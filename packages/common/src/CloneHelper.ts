export class CloneHelper {
	/**
	 * Deep-clones a plain, JSON-serializable value (no functions, `undefined` values,
	 * `Date`/`Map`/`Set` instances, or circular references - every current caller only
	 * clones plain JSON-shaped data).
	 *
	 * Not using the native `structuredClone()`: it is not implemented as a global in
	 * Hermes (React Native's JS engine), so calling it there throws a ReferenceError.
	 * `JSON.parse(JSON.stringify(...))` works everywhere this helper is used (the
	 * frontend apps and the backend extension) and is sufficient for plain JSON data.
	 */
	static deepClone<T>(value: T): T {
		return JSON.parse(JSON.stringify(value)); // NOSONAR - see comment above
	}
}
