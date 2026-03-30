import { describe, expect, it } from 'vitest';
import { isUpdateAvailable } from '../../apps/web/src/lib/version.js';

describe('isUpdateAvailable', () => {
  it('returns false when remote build matches current build', () => {
    expect(isUpdateAvailable('abc123', { build: 'abc123' })).toBe(false);
  });

  it('returns true when remote build differs from current build', () => {
    expect(isUpdateAvailable('abc123', { build: 'def456' })).toBe(true);
  });

  it('returns false when remote has no build field', () => {
    expect(isUpdateAvailable('abc123', {})).toBe(false);
  });

  it('returns false when currentBuild is empty', () => {
    expect(isUpdateAvailable('', { build: 'def456' })).toBe(false);
  });

  it('returns false when both are empty', () => {
    expect(isUpdateAvailable('', {})).toBe(false);
  });

  it('returns false when currentBuild is unknown and remote is unknown', () => {
    expect(isUpdateAvailable('unknown', { build: 'unknown' })).toBe(false);
  });

  it('returns true when currentBuild is old commit and remote has new commit', () => {
    expect(isUpdateAvailable('a1b2c3d', { build: 'e4f5g6h' })).toBe(true);
  });
});
