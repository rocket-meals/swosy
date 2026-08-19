import { DeepCopyHelper } from '../DeepCopyHelper';

describe('DeepCopyHelper.deepCopy', () => {
	it('returns an equal but distinct object', () => {
		const original = { a: 1, b: 'two' };
		const copy = DeepCopyHelper.deepCopy(original);
		expect(copy).toEqual(original);
		expect(copy).not.toBe(original);
	});

	it('copies nested objects deeply', () => {
		const original = { nested: { deeper: { value: 1 } } };
		const copy = DeepCopyHelper.deepCopy(original);
		copy.nested.deeper.value = 2;
		expect(original.nested.deeper.value).toBe(1);
	});

	it('copies arrays deeply', () => {
		const original = [{ id: 1 }, { id: 2 }];
		const copy = DeepCopyHelper.deepCopy(original);
		copy[0]!.id = 99;
		expect(original[0]!.id).toBe(1);
		expect(Array.isArray(copy)).toBe(true);
	});

	it('keeps primitives and null intact', () => {
		expect(DeepCopyHelper.deepCopy(42)).toBe(42);
		expect(DeepCopyHelper.deepCopy('text')).toBe('text');
		expect(DeepCopyHelper.deepCopy(true)).toBe(true);
		expect(DeepCopyHelper.deepCopy(null)).toBeNull();
	});

	it('copies an empty object and an empty array', () => {
		expect(DeepCopyHelper.deepCopy({})).toEqual({});
		expect(DeepCopyHelper.deepCopy([])).toEqual([]);
	});

	it('drops undefined properties – documented JSON-round-trip behaviour', () => {
		expect(DeepCopyHelper.deepCopy({ a: 1, b: undefined })).toEqual({ a: 1 });
	});

	it('turns a Date into its ISO string – documented JSON-round-trip behaviour', () => {
		const date = new Date('2026-08-17T10:00:00.000Z');
		expect(DeepCopyHelper.deepCopy({ date })).toEqual({ date: '2026-08-17T10:00:00.000Z' });
	});

	it('throws on circular references instead of looping forever', () => {
		const circular: Record<string, unknown> = { name: 'loop' };
		circular.self = circular;
		expect(() => DeepCopyHelper.deepCopy(circular)).toThrow();
	});
});
