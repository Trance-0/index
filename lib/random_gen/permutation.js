// Pure helpers for random permutation generation (Fisher-Yates).

export function generatePermutation(size, startValue = 0) {
  const n = Math.max(0, Number(size) || 0);
  const start = Number(startValue) || 0;
  const arr = Array.from({ length: n }, (_, i) => i + start);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function formatPermutation(perm, multiline = false) {
  if (!Array.isArray(perm)) return '';
  return multiline
    ? '[\n' + perm.join(',\n') + '\n]'
    : '[' + perm.join(', ') + ']';
}
