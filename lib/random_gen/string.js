// Pure helpers for random string generation.

export const DEFAULT_CHARSET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function generateRandomString(length, charset = DEFAULT_CHARSET) {
  const len = Math.max(0, Number(length) || 0);
  const cs = String(charset || '');
  if (!cs.length) return '';
  let out = '';
  for (let i = 0; i < len; i++) {
    out += cs[Math.floor(Math.random() * cs.length)];
  }
  return out;
}
