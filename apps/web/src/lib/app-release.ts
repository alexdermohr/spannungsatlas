function resolveAppRelease(): string {
  const value: unknown = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : undefined;

  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'release' in value &&
    typeof (value as { release?: unknown }).release === 'string'
  ) {
    const release = (value as { release: string }).release.trim();
    if (release) {
      return release;
    }
  }

  return '0.1.0';
}

export const APP_RELEASE = resolveAppRelease();
