// Pure helpers for random array generation.

export function isIntegerRange(minValue, maxValue) {
  return Number.isInteger(minValue) && Number.isInteger(maxValue);
}

export function shuffle(values) {
  const out = [...values];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function reshapeTo2D(values, rows, cols) {
  return Array.from({ length: rows }, (_, r) =>
    values.slice(r * cols, r * cols + cols)
  );
}

// Generate a random array per the supplied options.
//
// Returns an object: { values, error }. `values` may be a 1D or 2D array,
// or [] when an error is set. The caller is responsible for surfacing
// `error` to the user.
export function generateRandomArray({
  rows, cols, minValue, maxValue,
  is2D = false, unique = false, sorted = false, inverseSort = false,
}) {
  if (Number.isNaN(minValue) || Number.isNaN(maxValue) || minValue > maxValue) {
    return { values: [], error: 'Minimum value must be less than or equal to maximum value.' };
  }
  const arrayLength = is2D ? rows * cols : rows;
  const integerMode = isIntegerRange(minValue, maxValue);
  const integerRangeSize = integerMode ? maxValue - minValue + 1 : null;

  if (unique && integerMode && integerRangeSize < arrayLength) {
    return {
      values: [],
      error: 'Unique values are impossible with the current integer range and array length.',
    };
  }

  const sample = () => integerMode
    ? Math.floor(Math.random() * (maxValue - minValue + 1) + minValue)
    : Math.random() * (maxValue - minValue) + minValue;

  let values;
  if (unique) {
    if (integerMode) {
      const pool = shuffle(
        Array.from({ length: integerRangeSize }, (_, i) => minValue + i)
      );
      values = pool.slice(0, arrayLength);
    } else {
      const seen = new Set();
      values = [];
      while (values.length < arrayLength) {
        const v = Number(sample().toFixed(6));
        if (!seen.has(v)) { seen.add(v); values.push(v); }
      }
    }
  } else {
    values = Array.from({ length: arrayLength }, sample);
  }

  if (is2D) {
    const grid = reshapeTo2D(values, rows, cols);
    if (sorted) grid.forEach((row) => row.sort((a, b) => inverseSort ? b - a : a - b));
    return { values: grid, error: '' };
  }

  if (sorted) values.sort((a, b) => inverseSort ? b - a : a - b);
  return { values, error: '' };
}

export function formatArray(arr, { is2D = false, multiline = false } = {}) {
  if (!Array.isArray(arr)) return '';
  if (is2D) {
    const rows = arr.map((row) => `[${row.join(', ')}]`);
    return multiline ? '[\n' + rows.join(',\n') + '\n]' : '[' + rows.join(', ') + ']';
  }
  return multiline ? '[\n' + arr.join(', ') + '\n]' : '[' + arr.join(', ') + ']';
}
