// Yksinkertainen apuri joka palauttaa saman muodon kuin ohjelmien Scheme-objektit
export function pct(p: number, sets: number, reps: number | string, note = "") {
  return { percent: p, sets, reps, note };
}
