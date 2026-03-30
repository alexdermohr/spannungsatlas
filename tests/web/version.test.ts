import { describe, expect, it } from 'vitest';
import { isUpdateAvailable, buildVersionFromInputs } from '../../apps/web/src/lib/version.js';

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

describe('buildVersionFromInputs', () => {
  const fixedDate = new Date('2026-01-15T12:00:00.000Z');

  it('uses commit as build ID when commit is known', () => {
    const v = buildVersionFromInputs('1.0.0', 'abc1234', fixedDate);
    expect(v.build).toBe('abc1234');
    expect(v.commit).toBe('abc1234');
  });

  it('falls back to base-36 timestamp when commit is unknown', () => {
    const v = buildVersionFromInputs('1.0.0', 'unknown', fixedDate);
    expect(v.build).not.toBe('unknown');
    expect(v.build).toBe(fixedDate.getTime().toString(36));
    expect(v.commit).toBe('unknown');
  });

  it('includes the release version from package.json', () => {
    const v = buildVersionFromInputs('2.3.4', 'abc1234', fixedDate);
    expect(v.release).toBe('2.3.4');
  });

  it('produces an ISO timestamp for builtAt', () => {
    const v = buildVersionFromInputs('1.0.0', 'abc1234', fixedDate);
    expect(v.builtAt).toBe('2026-01-15T12:00:00.000Z');
  });

  it('returns an object with all required AppVersion fields', () => {
    const v = buildVersionFromInputs('0.1.0', 'deadbeef', fixedDate);
    expect(typeof v.release).toBe('string');
    expect(typeof v.build).toBe('string');
    expect(typeof v.commit).toBe('string');
    expect(typeof v.builtAt).toBe('string');
  });

  it('build ID is never empty regardless of inputs', () => {
    const withCommit = buildVersionFromInputs('1.0.0', 'abc', fixedDate);
    expect(withCommit.build.length).toBeGreaterThan(0);
    const withoutCommit = buildVersionFromInputs('1.0.0', 'unknown', fixedDate);
    expect(withoutCommit.build.length).toBeGreaterThan(0);
  });
});
