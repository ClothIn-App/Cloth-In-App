// src/debug/log.ts
export const log = {
  debug: (...a: any[]) => { if (__DEV__) console.log('[DEBUG]', ...a); },
  info: (...a: any[]) => console.log('[INFO]', ...a),
  warn: (...a: any[]) => console.warn('[WARN]', ...a),
  error: (...a: any[]) => console.error('[ERROR]', ...a),
};
