import { DirectusFieldChoiceHelper } from '@/helper/DirectusFieldChoiceHelper';

const appColors = { primary: '#FCDE31', text: '#000000' };

describe('DirectusFieldChoiceHelper', () => {
	it('reads the choices of a field definition', () => {
		const field = {
			meta: {
				options: {
					choices: [
						{ value: 'collected', text: 'Gesammelt', color: '#FFC23B', icon: 'forward_to_inbox' },
						{ value: 'planned' },
						{ text: 'without value' },
					],
				},
			},
		};
		expect(DirectusFieldChoiceHelper.parseChoices(field)).toEqual([
			{ value: 'collected', text: 'Gesammelt', color: '#FFC23B', icon: 'forward_to_inbox' },
			{ value: 'planned', text: null, color: null, icon: null },
		]);
		expect(DirectusFieldChoiceHelper.parseChoices(null)).toEqual([]);
	});

	it('uses hex colors and maps the theme variables of Directus', () => {
		expect(DirectusFieldChoiceHelper.resolveColor('#2ECDA7', appColors)).toBe('#2ECDA7');
		expect(DirectusFieldChoiceHelper.resolveColor('var(--theme--primary)', appColors)).toBe('#FCDE31');
		expect(DirectusFieldChoiceHelper.resolveColor('var(--theme--foreground)', appColors)).toBe('#000000');
		expect(DirectusFieldChoiceHelper.resolveColor('var(--theme--unknown)', appColors)).toBeNull();
		expect(DirectusFieldChoiceHelper.resolveColor('red', appColors)).toBeNull();
		expect(DirectusFieldChoiceHelper.resolveColor(null, appColors)).toBeNull();
	});

	it('turns Material Symbols names into names for the Icon component', () => {
		const glyphMap = { 'forward-to-inbox': 1, 'public-off': 2 };
		expect(DirectusFieldChoiceHelper.toIconName('forward_to_inbox', glyphMap)).toBe('MaterialIcons:forward-to-inbox');
		expect(DirectusFieldChoiceHelper.toIconName('robot_2', glyphMap)).toBeNull();
		expect(DirectusFieldChoiceHelper.toIconName(null, glyphMap)).toBeNull();
	});

	it('finds the choice of a value', () => {
		const choices = [{ value: 'a' }, { value: 'b', color: '#fff' }];
		expect(DirectusFieldChoiceHelper.findChoice(choices, 'b')).toEqual({ value: 'b', color: '#fff' });
		expect(DirectusFieldChoiceHelper.findChoice(choices, null)).toBeUndefined();
	});
});
