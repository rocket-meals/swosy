// Pure helpers for comparing the store metadata ground truth with the values the store
// APIs report. Kept free of I/O so they are easy to test.

export type AttributeChange = {
  key: string;
  from: unknown;
  to: unknown;
};

function isEqualValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

// Returns the attributes that need to be written so that `current` matches `desired`.
// Only keys that are set (not undefined) in the ground truth are managed - everything
// else stays untouched in the store.
export function computeAttributeChanges(desired: Record<string, unknown>, current: Record<string, unknown>): AttributeChange[] {
  const changes: AttributeChange[] = [];
  for (const [key, desiredValue] of Object.entries(desired)) {
    if (desiredValue === undefined) {
      continue;
    }
    const currentValue = current[key];
    if (!isEqualValue(desiredValue, currentValue)) {
      changes.push({ key, from: currentValue, to: desiredValue });
    }
  }
  return changes;
}

export function changesToAttributeObject(changes: AttributeChange[]): Record<string, unknown> {
  const attributes: Record<string, unknown> = {};
  for (const change of changes) {
    attributes[change.key] = change.to;
  }
  return attributes;
}

export function formatChanges(changes: AttributeChange[], indent = '   '): string {
  return changes.map(change => `${indent}${change.key}: ${JSON.stringify(change.from ?? null)} -> ${JSON.stringify(change.to)}`).join('\n');
}

// Turns a display name like "Studi|Futter" into a safe file name like "studi-futter".
export function slugifyDisplayName(displayName: string): string {
  const dashed = displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  // Trimming the dashes without a regex: `/^-+|-+$/g` has super-linear runtime
  // due to backtracking on dash-only input.
  let start = 0;
  let end = dashed.length;
  while (start < end && dashed[start] === '-') start++;
  while (end > start && dashed[end - 1] === '-') end--;
  return dashed.slice(start, end) || 'app';
}
