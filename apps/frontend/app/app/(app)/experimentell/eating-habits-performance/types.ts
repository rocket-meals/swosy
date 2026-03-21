/**
 * Shared base props for plain marking row components in the eating-habits-performance
 * benchmark screens. All values are resolved in the parent screen and passed down
 * as plain strings/colors so the leaf components stay hook-free.
 */
export interface PlainMarkingBaseProps {
	id: string;
	name: string;
	description: string;
	borderColor: string;
	textColor: string;
}
