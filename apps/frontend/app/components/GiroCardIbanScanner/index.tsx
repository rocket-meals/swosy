import { useCallback } from 'react';
import { IbanCandidate, IbanRecognitionHelper } from 'repo-depkit-common';

import { useLanguage } from '@/hooks/useLanguage';
import { useOcr } from '@/hooks/useOcr';
import { TranslationKeys } from '@/locales/keys';

export interface OpenGiroCardIbanScannerOptions {
	/** Receives the IBAN grouped in blocks of four, ready for the input field. */
	onIbanDetected: (formattedIban: string, candidate: IbanCandidate) => void;
	/**
	 * Accept an IBAN whose mod-97 checksum does not add up. Only for testing
	 * against specimen cards such as the fixtures in
	 * `packages/common/src/__tests__/fixtures` — a real card always carries a
	 * checksum-valid IBAN, and demanding it filters out misreads.
	 */
	allowInvalidChecksum?: boolean;
	/** Every batch of recognized lines, for the experimental screen's debug output. */
	onRecognizedLinesChange?: (lines: string[]) => void;
}

/**
 * Reads the IBAN off a giro card and hands it back ready for an input field.
 *
 * Everything about cameras, photo rolls and engines belongs to `useOcr`; what
 * is left here is the one thing that is about IBANs: what counts as having
 * found one. That answer is also what lets the automatic camera close itself —
 * a scan that cannot recognize its own success would never end.
 */
export const useGiroCardIbanScannerModal = () => {
	const { openOcr, closeOcr } = useOcr();
	const { translate } = useLanguage();

	const openGiroCardIbanScanner = useCallback(
		(options: OpenGiroCardIbanScannerOptions) => {
			openOcr<IbanCandidate>({
				title: translate(TranslationKeys.giro_card_scan_title),
				hint: translate(TranslationKeys.giro_card_scan_hint),
				onLinesRecognized: options.onRecognizedLinesChange,
				findMatch: (lines) => IbanRecognitionHelper.findIban(lines, { allowInvalidChecksum: options.allowInvalidChecksum }),
				onRecognized: ({ match }) => {
					if (match) {
						options.onIbanDetected(match.formatted, match);
					}
				},
			});
		},
		[openOcr, translate],
	);

	return { openGiroCardIbanScanner, closeGiroCardIbanScanner: closeOcr };
};

export default useGiroCardIbanScannerModal;
