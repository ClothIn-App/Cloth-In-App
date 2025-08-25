// src/debug/log.ts
const isDev =
  (typeof __DEV__ !== 'undefined' && __DEV__) ||
  (typeof process !== 'undefined' && process.env?.JEST_WORKER_ID !== undefined) ||
  (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production');

export const log = {
  debug: (...a: any[]) => { if (isDev) console.log('[DEBUG]', ...a); },
  info:  (...a: any[]) => console.log('[INFO]', ...a),
  warn:  (...a: any[]) => console.warn('[WARN]', ...a),
  error: (...a: any[]) => console.error('[ERROR]', ...a),
};
