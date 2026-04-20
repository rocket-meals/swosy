export const MIN_CARD_WIDTH = 280;

export default class CardDimensionHelper {
	static getCardDimension(screenWidth: number): number {
		const dimensionMap = [
			{ min: 960, max: 1110, value: 300 },
			{ min: 750, max: 840, value: 350 },
			{ min: 710, max: 750, value: 330 },
			{ min: 650, max: 709, value: 300 },
			{ min: 570, max: Infinity, value: 260 },
			{ min: 530, max: Infinity, value: 240 },
			{ min: 500, max: Infinity, value: 220 },
			{ min: 450, max: Infinity, value: 210 },
			{ min: 380, max: Infinity, value: 180 },
			{ min: 360, max: Infinity, value: 170 },
			{ min: 340, max: Infinity, value: 160 },
			{ min: 320, max: Infinity, value: 150 },
			{ min: 300, max: Infinity, value: 140 },
			{ min: 280, max: Infinity, value: 130 },
		];

		for (const { min, max, value } of dimensionMap) {
			if (screenWidth > min && screenWidth < max) {
				return value;
			}
		}
		return 120;
	}

	static getCardWidth(screenWidth: number, columns: number): number {
		const offset = screenWidth < 500 ? 10 : screenWidth < 900 ? 25 : 35;
		return screenWidth / columns - offset;
	}

	static getNumColumns(screenWidth: number, columnsSetting: number): number {
		if (columnsSetting === 0) {
			const size = this.getCardDimension(screenWidth);
			return Math.max(1, Math.floor(screenWidth / size));
		}
		return columnsSetting;
	}

	/**
	 * Responsive gap between grid items, matching the FoodOffers scroll list pattern.
	 * Returns the margin to apply on each side of a card (horizontally and vertically).
	 */
	static getItemGap(screenWidth: number): number {
		if (screenWidth >= 1600) return 28;
		if (screenWidth >= 1300) return 24;
		if (screenWidth >= 1000) return 20;
		if (screenWidth >= 700) return 16;
		if (screenWidth >= 500) return 12;
		if (screenWidth >= 300) return 10;
		return 8;
	}

	/**
	 * Card width for a responsive grid, matching the FoodOffers scroll list pattern.
	 * Each card gets marginHorizontal = itemGap on both sides.
	 */
	static getGridCardWidth(listWidth: number, numColumns: number, itemGap: number): number {
		const totalMargin = itemGap * 2 * numColumns;
		const availableWidth = listWidth - totalMargin;
		return availableWidth / numColumns;
	}

	/**
	 * Number of columns for a responsive grid, matching the FoodOffers scroll list pattern.
	 * Uses MIN_CARD_WIDTH as the minimum card width, with at least 2 columns.
	 */
	static getGridNumColumns(listWidth: number, amountColumnsForcard?: number | null): number {
		if (amountColumnsForcard && amountColumnsForcard > 0) {
			return amountColumnsForcard;
		}
		if (!listWidth) return 2;
		const cols = Math.floor(listWidth / MIN_CARD_WIDTH);
		return Math.max(2, cols);
	}
}
