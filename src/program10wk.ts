// program10wk.ts
// Tässä on KOKO 10 viikon ohjelma, juuri se, mikä oli App.tsx:ssä.

// ========== TYPES ==========
export type Scheme = { percent?: number; sets: number; reps: number | string; note?: string };
export type MainBlock = { lift: string; scheme: Scheme[] };
export type Accessory = { name: string; sets: number; reps: number | string };
export type Session = { day: number; title: string; warmup: string[]; main: MainBlock; accessories: Accessory[] };
export type WeekData = { week: number; squatType: "Back Squat" | "Front Squat"; days: Session[] };

// ========== PROGRAM (tismalleen sama logiikka kuin App.tsx:ssä) ==========

const pct = (p: number, sets: number, reps: number | string, note = ""): Scheme => ({ percent: p, sets, reps, note });

const MAIN = {
  snatch: {
    1: [pct(55,2,3), pct(60,2,3), pct(65,2,3)],
    2: [pct(60,2,3), pct(65,2,3), pct(70,2,3)],
    3: [pct(70,3,2), pct(72,3,2)],
    4: [pct(72,2,2), pct(75,2,2), pct(78,2,2)],
    5: [pct(75,3,2), pct(80,3,2)],
    6: [pct(78,2,2), pct(82,2,2)],
    7: [pct(80,2,2), pct(85,2,1)],
    8: [pct(82,3,1), pct(85,2,1)],
    9: [pct(85,3,1,"build heavy singles"), pct(88,1,1), pct(90,1,1)],
    10:[pct(60,2,2), pct(65,1,2), pct(70,1,2)],
  },
  cj: {
    1: [pct(55,4,"1+1"), pct(60,2,"1+1"), pct(65,2,"1+1")],
    2: [pct(60,4,"1+1"), pct(65,2,"1+1"), pct(70,2,"1+1")],
    3: [pct(70,3,"1+1"), pct(75,3,"1+1")],
    4: [pct(72,2,"1+1"), pct(78,2,"1+1")],
    5: [pct(75,3,"1+1"), pct(80,3,"1+1")],
    6: [pct(78,2,"1+1"), pct(82,2,"1+1")],
    7: [pct(80,3,"1+1"), pct(85,2,"1+1")],
    8: [pct(82,3,"1+1"), pct(85,2,"1+1")],
    9: [pct(85,2,"1+1"), pct(88,1,"1+1"), pct(90,1,"1+1")],
    10:[pct(60,2,"1+1"), pct(65,1,"1+1"), pct(70,1,"1+1")],
  },
  deadlift: {
    1: [pct(60,1,5), pct(65,1,5), pct(70,3,5)],
    3: [pct(70,1,4), pct(75,3,4)],
    5: [pct(75,1,4), pct(80,3,4)],
    7: [pct(80,4,3)],
    9: [pct(85,3,3)],
  },
  bench: {
    2: [pct(60,1,6), pct(65,1,6), pct(70,3,5)],
    4: [pct(72,4,4)],
    6: [pct(75,4,4)],
    8: [pct(80,4,3)],
    10:[pct(60,3,5)],
  },
  backSquat: {
    base:[pct(60,2,5), pct(70,2,4), pct(75,2,4)],
    3:[pct(70,2,4), pct(75,2,4), pct(80,1,3)],
    5:[pct(75,2,4), pct(80,2,3)],
    7:[pct(80,3,3)],
    9:[pct(85,3,2)],
  },
  frontSquat: {
    base:[pct(60,2,5), pct(65,2,4), pct(70,2,4)],
    4:[pct(70,2,4), pct(75,2,3)],
    6:[pct(75,3,3)],
    8:[pct(80,3,2)],
    10:[pct(60,3,3)],
  }
};

/* Apuliike-poolit (sama logiikka kuin App.tsx:ssä) */
const POOL = {
  warm: ["SAS / band warm-up","Bird Dog","Glute Bridge","Superman / Hyper","Overhead Duck Walk","T-plank","90/90 Hip Flow","Rack Lats Stretch","Shoulder Spins","Hip Mobilization"],

  snatchBarbellOnly: ["Snatch Pull (to knee)"],
  cjBarbellLight: ["Push Press","Jerk Behind Neck (tech)","Clean Pull (to knee)"],
  squatAssistBar: ["Paused Squat (3s)","Tempo Squat (3-0-3)"],
  deadliftAssistBar: ["Romanian Deadlift","Good Morning","Snatch Grip RDL"],

  upperHyper: ["DB Lateral Raise","Rear Delt Fly (DB/Cable)","Incline DB Press","Lat Pulldown / Pull-up","Seated Cable Row","Face Pull","Single-arm DB Row","Cable Fly","Triceps Pressdown","Biceps Curl (DB)"],
  lowerHyper: ["Walking Lunges","Leg Press","Hack/Goblet Squat","Hamstring Curl (machine)","Reverse Hyper","Seated Calf Raise","Standing Calf Raise","Spanish Squat"],

  core: ["Hanging Leg Raise","Cable Crunch","Pallof Press","Back Extension","Weighted Plank 30–45s","Dead Bug","Side Plank 30–45s"]
};

const pickVaried = (list: string[], amount: number, seed: number) => {
  const rot = seed % list.length;
  const rotated = list.slice(rot).concat(list.slice(0, rot));
  return rotated.slice(0, amount);
};

/* Viikot (4 treeniä/vko, kyykky vuoroviikoin; Päivä4: mave pariton / penkki parillinen) */
export const weeks: WeekData[] = Array.from({ length: 10 }, (_, i) => {
  const week = i + 1;
  const squatType = (week % 2 === 1) ? "Back Squat" : "Front Squat";
  const odd = week % 2 === 1;

  // Snatch (yläkroppa): 1 barbell + 3 hyper upper + 1 core => 5 apuliikettä
  const snatchAccessories: Accessory[] = [
    { name: POOL.snatchBarbellOnly[0], sets: 3, reps: 3 },
    ...pickVaried(POOL.upperHyper, 3, week*13+1).map(n => ({ name: n, sets: 3, reps: 10 })),
    { name: pickVaried(POOL.core, 1, week*17+1)[0], sets: 3, reps: 12 },
  ];

  // Squat (alakroppa): 1 bar + 2 hyper lower + 1 core => 4
  const squatAccessories: Accessory[] = [
    { name: pickVaried(POOL.squatAssistBar, 1, week*5+2)[0], sets: 3, reps: 3 },
    ...pickVaried(POOL.lowerHyper, 2, week*7+2).map(n => ({ name: n, sets: 3, reps: 12 })),
    { name: pickVaried(POOL.core, 1, week*9+2)[0], sets: 3, reps: 12 }
  ];

  // C&J (yläkroppa): viikko3 barbell=Push Press; muuten 1 light bar + 3 hyper + 1 core => 5
  const cjBarbell = (week === 3) ? "Push Press" : pickVaried(POOL.cjBarbellLight, 1, week*19+3)[0];
  const cjAccessories: Accessory[] = [
    { name: cjBarbell, sets: 3, reps: 3 },
    ...pickVaried(POOL.upperHyper, 3, week*23+3).map(n => ({ name: n, sets: 3, reps: 10 })),
    { name: pickVaried(POOL.core, 1, week*29+3)[0], sets: 3, reps: 12 },
  ];

  // Deadlift (alakroppa): 1 bar + 2 hyper lower + 1 core => 4
  const dlAccessories: Accessory[] = [
    { name: pickVaried(POOL.deadliftAssistBar, 1, week*31+4)[0], sets: 3, reps: 6 },
    ...pickVaried(POOL.lowerHyper, 2, week*37+4).map(n => ({ name: n, sets: 3, reps: 10 })),
    { name: pickVaried(POOL.core, 1, week*41+4)[0], sets: 3, reps: 12 },
  ];

  // Bench (yläkroppa): 4 hyper + 1 core => 5
  const benchAccessories: Accessory[] = [
    ...pickVaried(POOL.upperHyper, 4, week*43+4).map(n => ({ name: n, sets: 3, reps: 10 })),
    { name: pickVaried(POOL.core, 1, week*47+4)[0], sets: 3, reps: 12 },
  ];

  const days: Session[] = [
    { day: 1, title: "Snatch Day", warmup: pickVaried(POOL.warm, 3, week*11+1), main: { lift: "Snatch", scheme: (MAIN.snatch as any)[week] }, accessories: snatchAccessories },
    { day: 2, title: `${squatType} Day`, warmup: pickVaried(POOL.warm, 3, week*11+2), main: { lift: squatType, scheme: squatType==="Back Squat" ? ((MAIN.backSquat as any)[week] || (MAIN.backSquat as any).base) : ((MAIN.frontSquat as any)[week] || (MAIN.frontSquat as any).base) }, accessories: squatAccessories },
    { day: 3, title: "Clean & Jerk Day", warmup: pickVaried(POOL.warm, 3, week*11+3), main: { lift: "Clean & Jerk", scheme: (MAIN.cj as any)[week] }, accessories: cjAccessories },
    odd
      ? { day: 4, title: "Deadlift Day", warmup: pickVaried(POOL.warm, 3, week*11+4), main: { lift: "Deadlift", scheme: (MAIN.deadlift as any)[week] }, accessories: dlAccessories }
      : { day: 4, title: "Bench Press Day", warmup: pickVaried(POOL.warm, 3, week*11+4), main: { lift: "Bench Press", scheme: (MAIN.bench as any)[week] }, accessories: benchAccessories },
  ];

  return { week, squatType, days };
});
