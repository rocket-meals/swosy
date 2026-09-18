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

// The bundled text recognition models, required as Metro assets.
// See public/paddleocr/README.md.
declare module '*.ort' {
	const content: number;
	export default content;
}

declare module '*.txt' {
	const content: number;
	export default content;
}
