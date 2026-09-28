import { RecognizeRequest, buildRecognizeScript, parsePageMessage } from './protocol';

/**
 * The app's side of the text recognition WebView.
 *
 * `useTextRecognition` hands frames to this object; `TextRecognitionWebViewHost`
 * (mounted once, at the root of the app) watches it and puts a WebView up when
 * the first frame arrives. Between the two sits nothing but this bridge: it
 * remembers which frame is waiting for which answer, holds frames back until
 * the page says it is ready, and turns a WebView that dies into rejected
 * promises rather than promises that never settle.
 *
 * A module-level singleton, deliberately. There is one engine on the device
 * and it is expensive to start, so every scanner in the app shares it.
 */

/** Where the WebView is in its life. */
export type BridgeStatus = 'idle' | 'starting' | 'ready' | 'failed';

/** What the page read off one frame. */
export interface PageReading {
	/** The raw engine output, lines separated by `\n`. */
	text: string;
	sharpness: number | null;
}

/** What the host gives the bridge once the WebView is mounted. */
export interface WebViewHandle {
	injectJavaScript: (script: string) => void;
}

/**
 * How long the page may take to come up. That covers composing the page file
 * on first use and compiling 14 MB of WebAssembly on a slow phone.
 */
export const START_TIMEOUT_MS = 180_000;

/** How long one frame may take. The engine needs well under a second; a stuck WebView needs an answer. */
export const RECOGNIZE_TIMEOUT_MS = 90_000;

/**
 * How long the WebView stays up after the last frame. Long enough that the
 * next card in the same session does not wait for the engine again, short
 * enough that the memory is given back afterwards.
 */
export const IDLE_RELEASE_MS = 120_000;

interface PendingRequest {
	resolve: (reading: PageReading) => void;
	reject: (error: Error) => void;
	/** Armed when the frame is handed to the page, not while it waits for the page to come up. */
	timeout: ReturnType<typeof setTimeout> | null;
}

export class TextRecognitionBridge {
	private readonly listeners = new Set<() => void>();
	private readonly pending = new Map<string, PendingRequest>();
	/** Frames that arrived before the page was ready. */
	private queued: RecognizeRequest[] = [];
	private handle: WebViewHandle | null = null;
	private status: BridgeStatus = 'idle';
	private startTimeout: ReturnType<typeof setTimeout> | null = null;
	private lastActivityAt = 0;
	private nextId = 0;

	/** The host subscribes to be re-rendered whenever the bridge changes its mind about needing a WebView. */
	subscribe(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}

	private notify(): void {
		for (const listener of this.listeners) {
			listener();
		}
	}

	getStatus(): BridgeStatus {
		return this.status;
	}

	/** Whether the host should have a WebView mounted right now. */
	get isWanted(): boolean {
		return this.status === 'starting' || this.status === 'ready';
	}

	/** True once nothing has been asked of the page for `milliseconds`. */
	isIdleFor(milliseconds: number): boolean {
		return this.pending.size === 0 && this.queued.length === 0 && Date.now() - this.lastActivityAt >= milliseconds;
	}

	/** Reads one frame. Starts the WebView if there is none. */
	recognize(imageBase64: string, mimeType: string): Promise<PageReading> {
		const id = String(++this.nextId);
		const request: RecognizeRequest = { id, imageBase64, mimeType };
		this.lastActivityAt = Date.now();

		return new Promise<PageReading>((resolve, reject) => {
			this.pending.set(id, { resolve, reject, timeout: null });

			if (this.status === 'failed') {
				// The last start failed. Whatever the reason was, it is worth one more try.
				this.status = 'idle';
			}
			if (this.status === 'idle') {
				this.status = 'starting';
				this.armStartTimeout();
				this.queued.push(request);
				this.notify();
				return;
			}
			if (this.status === 'ready' && this.handle) {
				this.send(request);
				return;
			}
			this.queued.push(request);
		});
	}

	/** Hands one frame to the page and starts the clock on its answer. */
	private send(request: RecognizeRequest): void {
		const pending = this.pending.get(request.id);
		if (!pending || !this.handle) {
			return;
		}
		pending.timeout = setTimeout(() => {
			this.settle(request.id, new Error('the text recognition page did not answer in time'));
		}, RECOGNIZE_TIMEOUT_MS);
		this.handle.injectJavaScript(buildRecognizeScript(request));
	}

	/** The host: the WebView is mounted and can take scripts. */
	attach(handle: WebViewHandle): void {
		this.handle = handle;
	}

	/** The host: the WebView is gone. Everything still waiting is over. */
	detach(): void {
		this.handle = null;
		if (this.status !== 'idle') {
			this.failEverything(new Error('the text recognition page was closed'));
			this.status = 'idle';
			this.clearStartTimeout();
			this.notify();
		}
	}

	/** The host gives the WebView back after a quiet spell; the next frame starts a fresh one. */
	release(): void {
		this.handle = null;
		this.status = 'idle';
		this.clearStartTimeout();
		this.notify();
	}

	/** The host could not bring the page up: no file, a load error, a dead renderer. */
	reportStartFailure(message: string): void {
		this.clearStartTimeout();
		this.status = 'failed';
		this.failEverything(new Error(message));
		this.notify();
	}

	/** Whatever the page posted. Anything that is not ours is ignored. */
	onPageMessage(raw: string): void {
		const message = parsePageMessage(raw);
		if (message === null) {
			return;
		}
		switch (message.type) {
			case 'ready': {
				this.clearStartTimeout();
				this.status = 'ready';
				const queued = this.queued;
				this.queued = [];
				for (const request of queued) {
					this.send(request);
				}
				this.notify();
				return;
			}
			case 'init-failed':
				this.reportStartFailure(message.message);
				return;
			case 'result':
				this.settle(message.id, { text: message.text, sharpness: message.sharpness });
				return;
			case 'failed':
				this.settle(message.id, new Error(message.message));
				return;
		}
	}

	private settle(id: string, outcome: PageReading | Error): void {
		const request = this.pending.get(id);
		if (!request) {
			return;
		}
		this.pending.delete(id);
		if (request.timeout !== null) {
			clearTimeout(request.timeout);
		}
		this.lastActivityAt = Date.now();
		if (outcome instanceof Error) {
			request.reject(outcome);
		} else {
			request.resolve(outcome);
		}
	}

	private failEverything(error: Error): void {
		this.queued = [];
		for (const id of [...this.pending.keys()]) {
			this.settle(id, error);
		}
	}

	private armStartTimeout(): void {
		this.clearStartTimeout();
		this.startTimeout = setTimeout(() => {
			this.reportStartFailure('the text recognition page did not start in time');
		}, START_TIMEOUT_MS);
	}

	private clearStartTimeout(): void {
		if (this.startTimeout !== null) {
			clearTimeout(this.startTimeout);
			this.startTimeout = null;
		}
	}
}

/** The one bridge every scanner in the app shares. */
export const textRecognitionBridge = new TextRecognitionBridge();
