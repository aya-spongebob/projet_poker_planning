export function average(nums) {
  if (!Array.isArray(nums) || nums.length === 0) return null;
  const s = nums.reduce((a, b) => a + b, 0);
  return s / nums.length;
}

export function median(nums) {
  if (!Array.isArray(nums) || nums.length === 0) return null;
  const a = [...nums].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

export function absoluteMajority(nums) {
  if (!Array.isArray(nums) || nums.length === 0) return null;
  const counts = new Map();
  for (const n of nums) counts.set(n, (counts.get(n) || 0) + 1);
  const needed = Math.floor(nums.length / 2) + 1;
  for (const [k, v] of counts.entries()) {
    if (v >= needed) return k;
  }
  return null;
}

export function relativeMajority(nums) {
  if (!Array.isArray(nums) || nums.length === 0) return null;
  const counts = new Map();
  for (const n of nums) counts.set(n, (counts.get(n) || 0) + 1);
  let bestKey = null;
  let bestVal = -1;
  for (const [k, v] of counts.entries()) {
    if (v > bestVal) {
      bestVal = v;
      bestKey = k;
    }
  }
  return bestKey;
}
