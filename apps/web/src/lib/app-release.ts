export const APP_RELEASE =
  typeof __APP_VERSION__ !== 'undefined' && __APP_VERSION__
    ? typeof __APP_VERSION__ === 'string'
      ? __APP_VERSION__
      : typeof __APP_VERSION__ === 'object' && 'release' in __APP_VERSION__ && typeof __APP_VERSION__.release === 'string'
        ? __APP_VERSION__.release
        : '0.1.0'
    : '0.1.0';
