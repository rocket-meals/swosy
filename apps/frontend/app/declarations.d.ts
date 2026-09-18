declare module '*.svg' {
	import React from 'react';
	import { SvgProps } from 'react-native-svg';
	const content: React.FC<SvgProps>;
	export default content;
}

declare module '*.html' {
	const content: number;
	export default content;
}

declare module '*.png' {
	const value: any;
	export default value;
}

// The bundled text recognition engine, required as Metro assets.
// See public/tesseract/README.md for why the engine's scripts arrive as .txt.
declare module '*.txt' {
	const content: number;
	export default content;
}

declare module '*.wasm' {
	const content: number;
	export default content;
}

declare module '*.gz' {
	const content: number;
	export default content;
}
