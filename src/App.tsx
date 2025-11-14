import React, { useEffect, useMemo, useState } from "react";
import { PROGRAMS, buildProgram } from "./data";

type ProgramId = "10week" | "6week_2split";

/* ========== UTIL ========== */
const roundTo = (x: number, step = 2.5) => Math.round(x / step) * step;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const fmt = (n: number) => n.toString().padStart(2, "0");

function useLocalStore<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : initial; }
    catch { return initial; }
  });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(value)); }, [key, value]);
  return [value, setValue];
}

/* ========== TYPES (UI:ssa käytettävät) ========== */

type Scheme = { percent?: number; sets: number; reps: number | string; note?: string };
type MainBlock = { lift: string; scheme: Scheme[] };
type Accessory = { name: string; sets: number; reps: number | string };

// HUOM: main voi olla joko 1 tai useampi pääliike
type Session = {
  day: number;
  title: string;
  warmup: string[];
  main: MainBlock | MainBlock[];
  accessories: Accessory[];
};

type WeekData = {
  week: number;
  squatType: "Back Squat" | "Front Squat";
  days: Session[];
};

type OneRM = {
  ["Snatch"]: number;
  ["Clean & Jerk"]: number;
  ["Deadlift"]: number;
  ["Bench Press"]: number;
  ["Back Squat"]: number;
  ["Front Squat"]: number;
};

type RowLog = { setWeights: number[]; notes?: string };
type AccessoryLog = { weight?: number; reps?: number | string; setsCompleted?: number };

// main-logi: indeksi on "globaali" rivinumero (jos 2 pääliikettä, rivit 0..n1-1 ja n1..n1+n2-1)
type DayLog = {
  main: { [rowIdx: number]: RowLog };
  accessories: { [accIdx: number]: AccessoryLog };
};

type LogStore = { [key: string]: DayLog };

/* ========== PROGRESS ========== */

function computeSessionProgress(session: Session, log: DayLog) {
  const mainBlocks: MainBlock[] = Array.isArray(session.main) ? session.main : [session.main];

  let totalMainSets = 0;
  let doneMain = 0;
  let rowBase = 0;

  for (const block of mainBlocks) {
    totalMainSets += block.scheme.reduce((s, r) => s + r.sets, 0);

    block.scheme.forEach((r, idx) => {
      const globalIdx = rowBase + idx;
      const row = log.main[globalIdx];
      if (!row) return;
      const setOk = row.setWeights?.filter((w) => (w ?? 0) > 0).length || 0;
      doneMain += Math.min(setOk, r.sets);
    });

    rowBase += block.scheme.length;
  }

  const totalAccSets = session.accessories.reduce((s, a) => s + a.sets, 0);
  let doneAcc = 0;
  session.accessories.forEach((a, i) => {
    const row = log.accessories[i];
    if (!row) return;
    doneAcc += Math.min(row.setsCompleted ?? 0, a.sets);
  });

  const total = totalMainSets + totalAccSets;
  const done = doneMain + doneAcc;
  const pctVal = total ? Math.round((done / total) * 100) : 0;
  return { pct: pctVal, done, total };
}

const ProgressBar = ({ value }: { value: number }) => (
  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
    <div className="h-full bg-indigo-500" style={{ width: `${value}%` }} />
  </div>
);

/* ========== 90s REST TIMER ========== */

function useRestTimer() {
  const [active, setActive] = useState(false);
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setSecs((s) => (s >= 90 ? 90 : s + 1)), 1000);
    return () => clearInterval(id);
  }, [active]);
  useEffect(() => {
    if (secs >= 90 && active) setActive(false);
  }, [secs, active]);
  const start = () => {
    setSecs(0);
    setActive(true);
  };
  const stop = () => setActive(false);
  const reset = () => {
    setActive(false);
    setSecs(0);
  };
  return { active, secs, start, stop, reset };
}

function RestTimerBadge({ timer }: { timer: ReturnType<typeof useRestTimer> }) {
  if (!timer.active && timer.secs === 0) return null;
  const pctVal = Math.round((clamp(timer.secs, 0, 90) / 90) * 100);
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50">
      <div className="rounded-full bg-white/90 shadow-lg border border-slate-200 px-4 py-2 flex items-center gap-3">
        <div className="font-['Outfit',sans-serif] text-xl text-slate-900">
          {fmt(Math.floor(timer.secs / 60))}:{fmt(timer.secs % 60)}
        </div>
        <div className="w-36">
          <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
            <div className="h-full bg-indigo-500" style={{ width: `${pctVal}%` }} />
          </div>
        </div>
        {timer.active ? (
          <button
            onClick={timer.stop}
            className="text-xs font-semibold bg-slate-900 text-white rounded-full px-3 py-1"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={timer.start}
            className="text-xs font-semibold bg-indigo-600 text-white rounded-full px-3 py-1"
          >
            Restart
          </button>
        )}
        <button
          onClick={timer.reset}
          className="text-xs font-semibold bg-slate-100 text-slate-800 rounded-full px-3 py-1 border border-slate-300"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

/* ========== HEADER ========== */

const titleFont = "font-['Outfit',sans-serif]";
const bodyFont = "font-['Inter',system-ui,sans-serif]";

function Header() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
      <div className="flex items-center justify-between">
        <div>
          <div className={`${titleFont} text-2xl text-slate-900`}>Weightlifting Program</div>
          <div className="text-sm text-slate-500">10 weeks • 4 sessions / week</div>
        </div>
        <div className={`${titleFont} hidden sm:block text-xl text-indigo-600`}>Training Log</div>
      </div>
    </div>
  );
}

/* ========== MAIN LIFT (TUETTU 1 TAI 2 PÄÄLIIKETTÄ) ========== */

function MainLiftRow({
  main,
  oneRM,
  log,
  rowBase,
  onLogChange,
  onAnySetLogged,
}: {
  main: MainBlock;
  oneRM: Partial<OneRM>;
  log: DayLog["main"];
  rowBase: number;
  onLogChange: (rowIdx: number, data: RowLog) => void;
  onAnySetLogged: () => void;
}) {
  const rm = (oneRM as any)[main.lift] ?? 0;

  return (
    <div className="space-y-6 mb-6">
      <div className={`${titleFont} text-xl text-slate-900`}>{main.lift}</div>

      {main.scheme.map((s, idx) => {
        const est = rm && s.percent ? roundTo((s.percent / 100) * rm) : 0;
        const globalIdx = rowBase + idx;
        const row = (log[globalIdx] ??
          { setWeights: Array.from({ length: s.sets }, () => 0) }) as RowLog;
        const setWeights =
          row.setWeights?.length === s.sets
            ? row.setWeights
            : Array.from({ length: s.sets }, (_, i) => row.setWeights?.[i] ?? 0);

        return (
          <div key={idx} className="space-y-2">
            <div className="text-sm font-semibold text-slate-700">
              {s.sets} x {s.reps}{" "}
              {s.percent ? (
                <>
                  @ <span className="text-slate-900">{s.percent}%</span>
                </>
              ) : null}
              {est ? <span className="ml-2 text-slate-500">~{est} kg</span> : null}
            </div>

            <div className="overflow-x-auto [-webkit-overflow-scrolling:touch] touch-pan-x">
              <div className="inline-flex gap-3 pr-2 py-1 whitespace-nowrap">
                {setWeights.map((w, i) => (
                  <div
                    key={i}
                    className="shrink-0 min-w-[10.5rem] bg-white rounded-xl border border-slate-200 shadow-sm"
                  >
                    <div className="p-3 text-center">
                      <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">
                        Set {i + 1}
                      </div>
                      <div className="text-xs text-slate-500">
                        Reps: <span className="text-slate-900 font-semibold">{s.reps}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Target:{" "}
                        <span className="text-slate-900 font-semibold">
                          {est ? `${est} kg` : "-"}
                        </span>
                      </div>
                      <input
                        type="number"
                        inputMode="decimal"
                        className="input w-full mt-2 bg-slate-50 border-slate-200"
                        placeholder={est ? `${est}` : ""}
                        value={w || ""}
                        onChange={(e) => {
                          const v = Number(e.target.value || 0);
                          const next = [...setWeights];
                          next[i] = v;
                          onLogChange(globalIdx, { ...row, setWeights: next });
                        }}
                        onBlur={onAnySetLogged}
                      />
                    </div>
                    <div className="h-[3px] bg-indigo-500 rounded-b-xl" />
                  </div>
                ))}
              </div>
            </div>

            <input
              type="text"
              className="input w-full bg-slate-50 border-slate-200"
              placeholder="Notes (main lift)"
              value={row.notes ?? ""}
              onChange={(e) =>
                onLogChange(globalIdx, { ...row, notes: e.target.value })
              }
            />
          </div>
        );
      })}
    </div>
  );
}

/* ========== ACCESSORIES ========== */

function AccessoriesLogger({
  items,
  log,
  onLogChange,
}: {
  items: Accessory[];
  log: DayLog["accessories"];
  onLogChange: (i: number, data: AccessoryLog) => void;
}) {
  return (
    <div className="grid gap-2">
      {items.map((a, i) => {
        const row = log[i] ?? {};
        return (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-3"
          >
            <div className="font-semibold text-slate-900">
              {a.name}{" "}
              <span className="text-slate-500">
                — {a.sets} x {a.reps}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
              <input
                type="number"
                inputMode="decimal"
                placeholder="Weight kg"
                className="input bg-slate-50 border-slate-200"
                value={row.weight ?? ""}
                onChange={(e) =>
                  onLogChange(i, {
                    ...row,
                    weight: Number(e.target.value || 0),
                  })
                }
              />
              <input
                type="number"
                inputMode="decimal"
                placeholder="Reps"
                className="input bg-slate-50 border-slate-200"
                value={typeof row.reps === "number" ? row.reps : ""}
                onChange={(e) =>
                  onLogChange(i, {
                    ...row,
                    reps: Number(e.target.value || 0),
                  })
                }
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder={`Done /${a.sets}`}
                  className="input w-24 bg-slate-50 border-slate-200"
                  value={row.setsCompleted ?? 0}
                  onChange={(e) =>
                    onLogChange(i, {
                      ...row,
                      setsCompleted: Number(e.target.value || 0),
                    })
                  }
                />
                <span className="text-slate-500 text-sm">/ {a.sets}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ========== APP ========== */

export default function App() {
  const [tab, setTab] = useLocalStore<"workout" | "settings">("wl_tab", "workout");
  const [week, setWeek] = useLocalStore<number>("wl_week", 1);
  const [day, setDay] = useLocalStore<number>("wl_day", 1);
  const [oneRM, setOneRM] = useLocalStore<Partial<OneRM>>("wl_1rm", {
    Snatch: 70,
    "Clean & Jerk": 90,
    Deadlift: 195,
    "Bench Press": 110,
    "Back Squat": 130,
    "Front Squat": 110,
  });
  const [logs, setLogs] = useLocalStore<LogStore>("wl_log_v2", {});
  const [programId, setProgramId] = useLocalStore<ProgramId>("programId", "10week");

  const weeks = useMemo<WeekData[]>(
    () => buildProgram(programId) as WeekData[],
    [programId]
  );
  const maxWeek = weeks.length || 1;

  useEffect(() => {
    if (week < 1 || week > maxWeek) setWeek(1);
  }, [maxWeek, programId, week, setWeek]);

  const current = useMemo(
    () => weeks.find((w) => w.week === week) ?? weeks[0],
    [weeks, week]
  );

  useEffect(() => {
    if (!current) return;
    if (day < 1 || day > current.days.length) setDay(1);
  }, [current, day, setDay]);

  const session = useMemo(
    () => current.days.find((d) => d.day === day) ?? current.days[0],
    [current, day]
  );

  const key = `${week}-${day}`;
  const dayLog: DayLog = logs[key] ?? { main: {}, accessories: {} };

  // Laske kokonaisprogressi oikeasti sessioiden määrän mukaan (ei oleteta aina 4/pv)
  let overallIndex = 0;
  let totalSessions = 0;
  weeks.forEach((w) => {
    w.days.forEach((d) => {
      if (w.week === week && d.day === day) {
        overallIndex = totalSessions;
      }
      totalSessions++;
    });
  });
  const overallPct =
    totalSessions > 0
      ? Math.round((overallIndex / Math.max(totalSessions - 1, 1)) * 100)
      : 0;

  const sessionProg = computeSessionProgress(session, dayLog);

  const updateMainLog = (rowIdx: number, data: RowLog) =>
    setLogs((prev) => ({
      ...prev,
      [key]: { ...dayLog, main: { ...dayLog.main, [rowIdx]: data } },
    }));

  const updateAccLog = (i: number, data: AccessoryLog) =>
    setLogs((prev) => ({
      ...prev,
      [key]: { ...dayLog, accessories: { ...dayLog.accessories, [i]: data } },
    }));

  const timer = useRestTimer();

  // Valmistellaan main-blockit 1–2 pääliikkeelle
  const mainBlocks: MainBlock[] = Array.isArray(session.main)
    ? session.main
    : [session.main];

  const mainBlocksWithBase = (() => {
    const result: { block: MainBlock; rowBase: number }[] = [];
    let base = 0;
    for (const b of mainBlocks) {
      result.push({ block: b, rowBase: base });
      base += b.scheme.length;
    }
    return result;
  })();

  return (
    <div className={`min-h-screen ${bodyFont} bg-slate-50 text-slate-900`}>
      <RestTimerBadge timer={timer} />

      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
        <Header />

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab("workout")}
            className={`px-4 py-2 rounded-lg border ${
              tab === "workout"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white border-slate-200 text-slate-800"
            }`}
          >
            Workout
          </button>
          <button
            onClick={() => setTab("settings")}
            className={`px-4 py-2 rounded-lg border ${
              tab === "settings"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white border-slate-200 text-slate-800"
            }`}
          >
            Settings
          </button>
        </div>

        {/* Program progress (bar only) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Program • Week {week} / Day {day}
          </div>
          <ProgressBar value={overallPct} />
        </div>

        {/* Program selector */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-slate-700" style={{ marginRight: 8 }}>
              Program
            </label>
            <select
              value={programId}
              onChange={(e) => setProgramId(e.target.value as ProgramId)}
              aria-label="Select program"
              className="input bg-slate-50 border-slate-200"
            >
              {PROGRAMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {tab === "settings" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className={`${titleFont} text-xl mb-3`}>1RM Settings</div>
            <div className="grid md:grid-cols-3 grid-cols-1 gap-3">
              {[
                "Snatch",
                "Clean & Jerk",
                "Deadlift",
                "Bench Press",
                "Back Squat",
                "Front Squat",
              ].map((k) => (
                <label
                  key={k}
                  className="text-sm flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                >
                  <span className="w-32">{k}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="input w-full bg-white border-slate-200"
                    value={(oneRM as any)[k] ?? ""}
                    onChange={(e) =>
                      setOneRM((v) => ({
                        ...v,
                        [k]: Number(e.target.value || 0),
                      }))
                    }
                  />
                  <span className="text-slate-500">kg</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {tab === "workout" && (
          <>
            {/* Week/Day Nav */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <button
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-900 border border-slate-200"
                  onClick={() => setWeek((w) => Math.max(1, w - 1))}
                >
                  ◀ Week
                </button>
                <div className={`${titleFont} text-xl`}>Week {week}</div>
                <button
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-900 border border-slate-200"
                  onClick={() => setWeek((w) => Math.min(maxWeek, w + 1))}
                >
                  Week ▶
                </button>
              </div>

              {/* Day buttons – 4 nappia kuten ennen (4 / vko 10-weekissä) */}
              <div className="mt-3 grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((d) => (
                  <button
                    key={d}
                    className={`px-3 py-2 rounded-lg border ${
                      d === day
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                    onClick={() => setDay(d)}
                  >
                    Day {d}
                  </button>
                ))}
              </div>

              <div className="mt-3 text-sm text-slate-600">
                This week squat:{" "}
                <span className="font-semibold text-slate-900">{current.squatType}</span>
              </div>
            </div>

            {/* Session card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className={`${titleFont} text-xl`}>{session.title}</div>
                <div className="w-48">
                  <ProgressBar value={sessionProg.pct} />
                </div>
              </div>

              <div className="text-sm text-slate-600">
                Warm-up: {session.warmup.join(" · ")}
              </div>

              {/* PÄÄLIIKKEET: 1–2 main-cardia */}
              <section>
                {mainBlocksWithBase.map(({ block, rowBase }, idx) => (
                  <MainLiftRow
                    key={idx}
                    main={block}
                    oneRM={oneRM}
                    log={dayLog.main}
                    rowBase={rowBase}
                    onLogChange={updateMainLog}
                    onAnySetLogged={() => {}}
                  />
                ))}
              </section>

              {/* Apuliikkeet */}
              <section>
                <div className={`${titleFont} text-lg mb-2`}>Accessories</div>
                <AccessoriesLogger
                  items={session.accessories}
                  log={dayLog.accessories}
                  onLogChange={updateAccLog}
                />
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
