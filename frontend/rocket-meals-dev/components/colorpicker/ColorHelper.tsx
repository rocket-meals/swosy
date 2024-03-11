import tinycolor from 'tinycolor2';

export class ColorHelper {
	static isHexColor(color: string | null | undefined) {
		if (!color) {
			return false;
		}
		return tinycolor(color).isValid();
	}

	// TODO: We could use memoization here
	static getHueColors(gradientSteps?: number, maximumValue?: number) {
		if (!gradientSteps) {
			gradientSteps = 20;
		}
		if (!maximumValue) {
			maximumValue = 359;
		}
		return ColorHelper.getColors(ColorHelper.getHueStepColor, gradientSteps, maximumValue);
	}

	static getHueStepColor(i: number) {
		return tinycolor({ s: 1, l: 0.5, h: i }).toHexString();
	}

	static getColors(getStepColor: { (i: number): string; (arg0: number): any; }, gradientSteps: number, maximumValue: number) {
		const colors = [];
		const values = ColorHelper.getStepValues(gradientSteps, maximumValue);
		for (const value of values) {
			colors.push(
				getStepColor(value)
			);
		}
		return colors;
	}

	static getStepValues(gradientSteps: number, maximumValue: number) {
		const values = [];
		for (let i = 0; i <= gradientSteps; i++) {
			values.push(
				i * maximumValue / gradientSteps
			);
		}
		return values;
	}
}
