import React from 'react';

export type SettingsGroupPosition = 'single' | 'top' | 'middle' | 'bottom';

/** One row of a settings group. It is rendered with the position it ends up at, so rows can be shared and reordered freely. */
export type SettingsGroupRow = {
	key: string;
	render: (groupPosition: SettingsGroupPosition, showSeparator: boolean) => React.ReactNode;
};

export const getSettingsGroupPosition = (index: number, total: number): SettingsGroupPosition => {
	if (total === 1) return 'single';
	if (index === 0) return 'top';
	if (index === total - 1) return 'bottom';
	return 'middle';
};

/** Renders rows as one settings group, giving each row its group position. Rows that are null are left out. */
const SettingsGroupRows: React.FC<{ rows: (SettingsGroupRow | null | undefined | false)[] }> = ({ rows }) => {
	const visibleRows = rows.filter((row): row is SettingsGroupRow => !!row);
	return (
		<>
			{visibleRows.map((row, index) => (
				<React.Fragment key={row.key}>{row.render(getSettingsGroupPosition(index, visibleRows.length), index !== visibleRows.length - 1)}</React.Fragment>
			))}
		</>
	);
};

export default SettingsGroupRows;
