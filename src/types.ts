export type Scheme = { percent?: number; sets: number; reps: number | string; note?: string };
export type MainBlock = { lift: string; scheme: Scheme[] };
export type Accessory = { name: string; sets: number; reps: string | number };

export type Session = {
  day: number;            // 1–7
  title: string;          // esim. "Lower A"
  warmup?: string[];
  main: MainBlock[];      // 1–2 pääliikettä/päivä
  accessories: Accessory[];
  notes?: string;
};

export type Week = { week: number; days: Session[] };
