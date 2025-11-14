// src/program6wk.ts
// 6 viikon 2-jakoinen ohjelma: 2 PÄÄLIIKETTÄ / PÄIVÄ
// Muotoiltu niin, että sopii App.tsx:n WeekData/Session oletuksiin.

type Scheme = { percent: number; sets: number; reps: number | string };
type MainBlock = { lift: string; scheme: Scheme[] };
type Accessory = { name: string; sets: number; reps: number | string };

type Session = {
  day: number;
  title: string;
  warmup: string[];
  main: MainBlock[];          // HUOM: TAULUKKO -> 1–2 PÄÄLIIKETTÄ
  accessories: Accessory[];
};

type WeekData = {
  week: number;
  squatType: "Back Squat" | "Front Squat";
  days: Session[];
};

function pct(p: number, sets: number, reps: number | string): Scheme {
  return { percent: p, sets, reps };
}

function accessory(name: string, sets: number, reps: number | string): Accessory {
  return { name, sets, reps };
}

const WARMUP: string[] = [
  "5–10 min kevyt cardio",
  "Dynaaminen liikkuvuus (lonkat, olkapäät)",
  "Kevyet lämmittelysarjat tangolla",
];

const POOL = {
  chestOdd: [
    accessory("DB Incline Bench", 3, "8–10"),
    accessory("DB/Cable Fly", 3, "12–15"),
  ],
  chestEven: [
    accessory("Barbell/Smith Incline Bench", 3, "8–10"),
    accessory("Cable Crossover", 3, "12–15"),
  ],
  quadsOdd: [
    accessory("Leg Press", 4, "10–15"),
    accessory("Leg Extension", 3, "12–15"),
  ],
  quadsEven: [
    accessory("Barbell Lunge", 4, "8+8"),
    accessory("Sissy Squat + Leg Extension (superset)", 3, "kierrokset"),
  ],
  backOdd: [
    accessory("Close-grip Pull-up / Chin-up", 4, "6–10"),
    accessory("Barbell Row", 4, "8"),
    accessory("RDL / Trap Bar RDL", 3, "8–10"),
    accessory("Face Pull", 3, "12–15"),
  ],
  backEven: [
    accessory("Wide-grip Lat Pulldown", 4, "8–10"),
    accessory("Seated Row / T-bar Row", 4, "8"),
    accessory("Good Morning / Reverse Hyper", 3, "8–10"),
    accessory("Reverse Fly / Y-raise", 3, "12–15"),
  ],
  bicepsOdd: [
    accessory("Barbell Curl", 3, "8–10"),
    accessory("Hammer Curl (DB)", 3, "10–12"),
  ],
  bicepsEven: [
    accessory("DB Curl", 3, "8–10"),
    accessory("Preacher Curl", 3, "10–12"),
  ],
};

function coreOdd(): Accessory[] {
  return [
    accessory("Ab Wheel / Raskas Cable Crunch", 4, "8–10"),
    accessory("Toes-to-bar / Hanging Leg Raise", 3, "15–20"),
  ];
}
function coreEven(): Accessory[] {
  return [
    accessory("Ab Wheel / Cable Crunch", 4, "8–10"),
    accessory("Cable Crunch + Plank (superset)", 3, "15–20 / 45s"),
  ];
}

const benchBase = [pct(70, 3, 5), pct(75, 2, 5), pct(80, 1, 5)];
const squatBase = [pct(70, 3, 5), pct(75, 2, 5), pct(80, 1, 5)];
const frontSquatBase = [pct(65, 3, 5), pct(70, 2, 5), pct(75, 1, 5)];
const deadliftBase = [pct(70, 2, 5), pct(75, 2, 5), pct(80, 1, 5)];
const pushPressBase = [pct(60, 3, 5), pct(65, 2, 5), pct(70, 1, 5)];

function bumpPercent(s: Scheme[], week: number): Scheme[] {
  if (week === 6) {
    // kevennetty viikko
    return s.map((x) => ({ ...x, percent: 60 }));
  }
  const add = (week - 1) * 2.5; // viikot 1–5: +0…+10 %
  return s.map((x) => ({ ...x, percent: x.percent + add }));
}

// Päivä 1 – Bench + Squat (2 pääliikettä)
function day1(week: number, isOddWeek: boolean): Session {
  const squatIsBack = week % 2 === 1;
  const squatName = squatIsBack ? "Back Squat" : "Front Squat";

  const squatScheme = bumpPercent(squatIsBack ? squatBase : frontSquatBase, week);
  const benchScheme = bumpPercent(benchBase, week);

  return {
    day: 1,
    title: "Bench + Squat Day",
    warmup: WARMUP.slice(),
    main: [
      { lift: squatName, scheme: squatScheme },
      { lift: "Bench Press", scheme: benchScheme },
    ],
    accessories: [
      ...(isOddWeek ? POOL.chestOdd : POOL.chestEven),
      ...(isOddWeek ? POOL.quadsOdd : POOL.quadsEven),
      ...(isOddWeek ? coreOdd() : coreEven()),
    ],
  };
}

// Päivä 2 – Deadlift + Push Press (2 pääliikettä)
function day2(week: number, isOddWeek: boolean): Session {
  const dlScheme = bumpPercent(deadliftBase, week);
  const ppScheme = bumpPercent(pushPressBase, week);

  return {
    day: 2,
    title: "Deadlift + Push Press Day",
    warmup: WARMUP.slice(),
    main: [
      { lift: "Deadlift", scheme: dlScheme },
      { lift: "Push Press", scheme: ppScheme },
    ],
    accessories: [
      ...(isOddWeek ? POOL.backOdd : POOL.backEven),
      ...(isOddWeek ? POOL.bicepsOdd : POOL.bicepsEven),
      ...(isOddWeek ? coreOdd() : coreEven()),
    ],
  };
}

// Päivä 3 – Optiopäivä
function day3Opt(week: number): Session {
  const lift =
    week % 2 === 1
      ? "Snatch (tekniikka, 50–65 %)"
      : "Clean & Jerk (tekniikka, 50–65 %)";

  return {
    day: 3,
    title: "OPTIONAL: Weightlifting or CrossFit Benchmark",
    warmup: WARMUP.slice(),
    main: [
      {
        lift,
        scheme: [],
      },
    ],
    accessories: [
      accessory(
        "CF Benchmark (valitse): DT / Diane / Lynne / Cindy / Macho Man / Fran",
        1,
        "valitse yksi"
      ),
    ],
    // notes-optio jos joskus haluat
  };
}

// Tämä funktio on se, jota buildProgramin pitäisi kutsua
export function build6WeekTwoSplit(): WeekData[] {
  const weeks: WeekData[] = [];

  for (let w = 1; w <= 6; w++) {
    const odd = w % 2 === 1;
    weeks.push({
      week: w,
      squatType: odd ? "Back Squat" : "Front Squat",
      days: [day1(w, odd), day2(w, odd), day3Opt(w)],
    });
  }

  return weeks;
}
