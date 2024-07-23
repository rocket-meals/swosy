const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

export class AppAreaColors {
	static DEFAULT_PROJECT_COLOR: string = "#D14610";
	static FOODS_COLOR: string | undefined = "#cb2f1d"; // #cb2f1d hannover
	static BUILDING_COLOR: string | undefined = "#FF4500";
	static LIVING_COLOR: string | undefined = "#FF69B4";
	static NEWS_COLOR: string | undefined = "#FF6347";
}

export default {
	light: {
		text: '#000',
		background: '#fff',
		tint: tintColorLight,
		tabIconDefault: '#ccc',
		tabIconSelected: tintColorLight,
	},
	dark: {
		text: '#fff',
		background: '#000',
		tint: tintColorDark,
		tabIconDefault: '#ccc',
		tabIconSelected: tintColorDark,
	},
};
