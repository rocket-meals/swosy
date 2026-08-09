// Shared palette and proportions of the "Tag und Jahr" clock face.
//
// Used by the in-app rendering (components/YearClock.tsx) and by
// scripts/generate-app-icon.js (colors copied by hand there, since the icon
// generator runs standalone in node). widgets/TagUndJahrWidget.tsx also
// repeats these values inline - the 'widget' directive forbids imports.

export const CLOCK_COLORS = {
	/** Muted blue-gray canvas behind the clock. */
	background: '#5d6b85',
	/** The yellow year disc - the year cycle as a whole. */
	yearDisc: '#e6a83c',
	/** The brown day disc in the middle. */
	dayDisc: '#6b4a2c',
	/** The red mark for 21 March (start of spring). */
	yearMark: '#c1271c',
	/** The blue dot that travels once around per day. */
	dayDot: '#2fa6a0',
	/** Light ring around the day dot. */
	dayDotRing: '#d8dde4',
} as const;

// All proportions are relative to the clock diameter.
export const CLOCK_PROPORTIONS = {
	/** Diameter of the inner brown day disc. */
	dayDisc: 0.64,
	/** Width of the red year mark (capsule). */
	yearMarkWidth: 0.035,
	/** Height of the red year mark (capsule). */
	yearMarkHeight: 0.1,
	/** Distance of the year mark's center from the clock center. */
	yearMarkCenterRadius: 0.41,
	/** Diameter of the blue day dot. */
	dayDot: 0.056,
	/** Diameter of the light ring behind the day dot. */
	dayDotRing: 0.072,
	/** Distance of the day dot's center from the clock center. */
	dayDotCenterRadius: 0.2,
} as const;
