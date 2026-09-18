import React, { Component, ErrorInfo, ReactNode } from 'react';

export interface ErrorBoundaryProps {
	children: ReactNode;
	/**
	 * What went wrong, so the screen around it can say it out loud instead of
	 * disappearing. Called during React's error handling, so keep it to state
	 * updates.
	 */
	onError?: (error: Error) => void;
	/** Rendered in place of the children once they have thrown. */
	fallback?: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
}

/**
 * Catches a render error in its children instead of letting it take the whole
 * screen down.
 *
 * React has exactly one mechanism for this and it is a class component — there
 * is no hook equivalent. Use it around anything that can fail in ways this app
 * cannot fully control: a WebView, a native module, content from a server.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	state: ErrorBoundaryState = { hasError: false };

	static getDerivedStateFromError(): ErrorBoundaryState {
		return { hasError: true };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		// eslint-disable-next-line no-console
		console.error('ErrorBoundary caught an error', error, errorInfo.componentStack);
		this.props.onError?.(error);
	}

	render() {
		if (this.state.hasError) {
			return this.props.fallback ?? null;
		}
		return this.props.children;
	}
}

export default ErrorBoundary;
