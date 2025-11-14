// src/data/index.ts

// POISTA tämä rivi kokonaan:
// import type { ProgramId } from "../types";

import { weeks as weeks10 } from "../program10wk";
import { build6WeekTwoSplit } from "../program6wk";

// Nimet alasvetovalikkoon
export const PROGRAMS: { id: string; name: string }[] = [
  { id: "10week",       name: "10-Week WL" },
  { id: "6week_2split", name: "6-Week 2-Split" },
];

// Palauttaa aina samanmuotoisen weeks-taulukon (array)
export function buildProgram(id: string) {
  if (id === "10week") {
    return weeks10;
  }
  if (id === "6week_2split") {
    return build6WeekTwoSplit();
  }
  // Fallback (ei pitäisi ikinä osua, mutta varmuuden vuoksi)
  return weeks10;
}
