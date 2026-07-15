// Approximates the UTF-8 byte size a stored value takes up, without relying on
// TextEncoder (not guaranteed to exist on every RN/Hermes runtime these apps target).
export const getUtf8ByteLength = (value: string): number => {
	let bytes = 0;
	for (let i = 0; i < value.length; i++) {
		const codePoint = value.codePointAt(i) as number;
		if (codePoint > 0xffff) i++; // surrogate pair - consumes two UTF-16 code units
		if (codePoint <= 0x7f) bytes += 1;
		else if (codePoint <= 0x7ff) bytes += 2;
		else if (codePoint <= 0xffff) bytes += 3;
		else bytes += 4;
	}
	return bytes;
};

export const formatBytes = (bytes: number): string => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
