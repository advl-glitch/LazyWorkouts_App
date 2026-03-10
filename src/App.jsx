import React, { useState, useEffect, useMemo } from "react";

// ===== THEME (manual light/dark toggle) =====
function useTheme() {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem("@themeMode") || "light"; } catch { return "light"; }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  const toggle = () => {
    const next = mode === "light" ? "dark" : "light";
    setMode(next);
    try { localStorage.setItem("@themeMode", next); } catch {}
  };

  return { mode, toggle };
}

// ===== STORAGE SHIM (localStorage drop-in for AsyncStorage) =====
const storage = {
  getItem(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem(key, value) {
    try { localStorage.setItem(key, value); } catch {}
  },
  removeItem(key) {
    try { localStorage.removeItem(key); } catch {}
  },
};

// ===== EXERCISE GIF LOOKUP (ExerciseDB API — free, no key) =====
const GIF_CACHE_KEY = "@exerciseGifCache";
let gifCache = null;
function getGifCache() {
  if (gifCache) return gifCache;
  try { gifCache = JSON.parse(localStorage.getItem(GIF_CACHE_KEY)) || {}; } catch { gifCache = {}; }
  return gifCache;
}
function saveGifCache(name, url) {
  const cache = getGifCache();
  cache[name.toLowerCase()] = url;
  gifCache = cache;
  try { localStorage.setItem(GIF_CACHE_KEY, JSON.stringify(cache)); } catch {}
}

async function fetchExerciseGif(exerciseName) {
  // Strip set/rep info to get clean name for search
  const clean = exerciseName.replace(/\s*\d+[\u00d7x×]\s*\d+[-\u2013]\d+.*$/i, "")
    .replace(/\s*@\s*\d+.*$/i, "")
    .replace(/\s*3[\u00d7x×]\s*$/i, "")
    .replace(/\s*\(.*\)\s*$/g, "")
    .trim();

  const cacheKey = clean.toLowerCase();
  const cached = getGifCache()[cacheKey];
  if (cached) return cached;
  if (cached === null) return null; // previously searched, not found

  try {
    const resp = await fetch(`https://exercisedb-api.vercel.app/api/v1/exercises?search=${encodeURIComponent(clean)}&limit=5`);
    if (!resp.ok) { saveGifCache(clean, null); return null; }
    const json = await resp.json();
    const results = json.data || [];
    if (results.length > 0 && results[0].gifUrl) {
      const url = results[0].gifUrl;
      saveGifCache(clean, url);
      return url;
    }
    saveGifCache(clean, null);
    return null;
  } catch {
    return null;
  }
}

function useExerciseGif(exerciseName) {
  const [gifUrl, setGifUrl] = useState(() => {
    const cached = getGifCache()[
      exerciseName.replace(/\s*\d+[\u00d7x×]\s*\d+[-\u2013]\d+.*$/i, "")
        .replace(/\s*@\s*\d+.*$/i, "")
        .replace(/\s*3[\u00d7x×]\s*$/i, "")
        .replace(/\s*\(.*\)\s*$/g, "")
        .trim().toLowerCase()
    ];
    return cached || null;
  });
  const [loading, setLoading] = useState(false);

  const load = () => {
    if (gifUrl || loading) return;
    setLoading(true);
    fetchExerciseGif(exerciseName).then(url => {
      if (url) setGifUrl(url);
      setLoading(false);
    });
  };

  return { gifUrl, loading, load };
}

// ===== BASE WORKOUT TEMPLATES =====
const WORKOUT_DAYS = [
  {
    id: "legs_woowoo",
    name: "Legs woowoo! \u2013 3x",
    focus: "Legs",
    category: "legs",
    exercises: [
      "Lunges 8\u201310 (10lbs each)",
      "Romanian deadlift 8\u201310 (35lbs)",
      "Leg extensions 12\u201315 (70lbs)",
      "Seated leg curls 10\u201312 (100lbs)",
      "Calf press 12\u201315",
    ],
  },
  {
    id: "chest_shoulders_tris",
    name: "Chest, Shoulders, Triceps",
    focus: "Upper push",
    category: "push",
    exercises: [
      "Incline DB press 3\u00d7 8\u201310",
      "Chest flys 3\u00d7 10\u201312",
      "Shoulder press 3\u00d7 8\u201310",
      "Lat raise 3\u00d7 10\u201312",
      "Dips / pushdowns 3\u00d7 10\u201312",
      "Overhead tricep extension 3\u00d7 10\u201312",
    ],
  },
  {
    id: "back_bis_core_v1",
    name: "Back, Biceps, Core V1 (\u00d73)",
    focus: "Back, biceps, core",
    category: "pull",
    exercises: [
      "Chest supported rows 3\u00d7 8\u201310",
      "Lat pulldowns 3\u00d7 10\u201312",
      "Seated curls 3\u00d7 10\u201312",
      "Reverse curls 3\u00d7 12\u201315",
      "Vertical knee raise 3\u00d7",
      "Back extensions 3\u00d7 10\u201312",
    ],
  },
  {
    id: "push_day_85",
    name: "Push Day \u2013 3\u00d7 8\u201310",
    focus: "Bench-focused push",
    category: "push",
    exercises: [
      "Bench press @ 85lb",
      "Chest flys @ 75lb",
      "Lat raises @ 10lb",
      "Shoulder press @ 50lb",
      "Tricep extensions @ 30lb",
    ],
  },
  {
    id: "pull_var",
    name: "Pull Day variation \u00d73 (8\u201312)",
    focus: "Pull variation",
    category: "pull",
    exercises: [
      "Chest supported rows @ 40lb per",
      "Lat pulldowns @ 110lb",
      "Seated curls @ 15lb per arm",
      "Reverse curls @ 40lb",
      "Back extensions",
    ],
  },
  {
    id: "push_machine",
    name: "Push \u00d73 (machine)",
    focus: "Machine push",
    category: "push",
    exercises: [
      "Bench press machine @ 65lb",
      "Machine flys @ 60lb",
      "Shoulder press @ 45lb",
      "Lat raise @ 10lb",
    ],
  },
  {
    id: "legs_type_one",
    name: "Legs Type One \u00d73",
    focus: "Legs",
    category: "legs",
    exercises: [
      "Lunges 8\u201310 @ 10lbs per",
      "Romanian deadlifts @ 20lb per",
      "Leg extensions @ 80lb",
      "Seated leg curls @ 90lb",
      "Calf press @ 70lb",
      "Ab crunch machine @ 25lb",
    ],
  },
  {
    id: "pull_day",
    name: "Pull Day \u00d73",
    focus: "Back, biceps, core",
    category: "pull",
    exercises: [
      "Chest supported rows @ 45lb",
      "Lat pulldowns @ 110lb",
      "Seated curls @ 20lb per bell",
      "Reverse curls @ 40lb (hard)",
      "Back extensions 10\u201312 @ 25lb",
      "Torso rotations 12\u201315 @ 65lb",
    ],
  },
  {
    id: "push_day_v2",
    name: "Push Day (\u00d73)",
    focus: "Push variation",
    category: "push",
    exercises: [
      "Incline bench press 20lb / arm",
      "Machine chest press @ 25lb",
      "Shoulder press @ 45lb",
      "Lat raise @ 10lb",
      "Tricep extension @ 25lb",
    ],
  },
  {
    id: "banded_legs",
    name: "Banded Legs Day",
    focus: "Legs + bands",
    category: "legs",
    exercises: [
      "Banded side steps 3\u00d7 7 (ankle)",
      "Calf press / tibia raise @ 70lb",
      "Leg extensions @ 110lb",
      "Seated leg curls @ 85lb",
      "Captain\u2019s choice",
      "Ab crunch machine @ 25lb",
    ],
  },
  {
    id: "back_bis_core_v2",
    name: "Back, Biceps, Core V2 (\u00d73)",
    focus: "Back, biceps, core",
    category: "pull",
    exercises: [
      "Chest supported rows @ 45lb per",
      "Assisted chin-up @ 85lb",
      "Seated curls 12 @ 20lb",
      "Reverse curls 15 @ 30lb",
      "Back extensions 12 @ 10lb",
    ],
  },
];

const CATEGORY_MUSCLE_HINTS = {
  pull: "Pull days: Back, Biceps, Rear Deltoids",
  push: "Push days: Chest, Shoulders, Triceps",
  legs: "Leg days: Quads, Hamstrings, Glutes, Calves",
};

const ALL_MUSCLE_OPTIONS = [
  "Chest", "Shoulders", "Triceps", "Back", "Biceps",
  "Rear Deltoids", "Quads", "Hamstrings", "Glutes", "Calves", "Core",
];

// ===== EXERCISE DATABASE (sound training structure) =====
// Organized by category → type (compound first, isolation after)
// Each exercise: name, primary muscles, default set/rep scheme
const EXERCISE_DB = {
  push: {
    compound: [
      { name: "Barbell bench press 3×8-10", muscles: ["Chest", "Triceps", "Shoulders"] },
      { name: "Incline dumbbell press 3×8-10", muscles: ["Chest", "Shoulders", "Triceps"] },
      { name: "Overhead press 3×8-10", muscles: ["Shoulders", "Triceps"] },
      { name: "Dumbbell shoulder press 3×8-10", muscles: ["Shoulders", "Triceps"] },
      { name: "Dips 3×8-12", muscles: ["Chest", "Triceps", "Shoulders"] },
      { name: "Close-grip bench press 3×8-10", muscles: ["Triceps", "Chest"] },
      { name: "Incline barbell press 3×8-10", muscles: ["Chest", "Shoulders"] },
      { name: "Machine chest press 3×10-12", muscles: ["Chest", "Triceps"] },
      { name: "Push-ups 3×12-15", muscles: ["Chest", "Triceps", "Shoulders"] },
      { name: "Landmine press 3×10-12", muscles: ["Shoulders", "Chest"] },
    ],
    isolation: [
      { name: "Lateral raises 3×12-15", muscles: ["Shoulders"] },
      { name: "Cable lateral raises 3×12-15", muscles: ["Shoulders"] },
      { name: "Chest flys (cable) 3×10-12", muscles: ["Chest"] },
      { name: "Dumbbell flys 3×10-12", muscles: ["Chest"] },
      { name: "Tricep pushdowns 3×10-12", muscles: ["Triceps"] },
      { name: "Overhead tricep extension 3×10-12", muscles: ["Triceps"] },
      { name: "Skull crushers 3×10-12", muscles: ["Triceps"] },
      { name: "Front raises 3×12-15", muscles: ["Shoulders"] },
      { name: "Pec deck / machine flys 3×10-12", muscles: ["Chest"] },
      { name: "Tricep kickbacks 3×12-15", muscles: ["Triceps"] },
    ],
  },
  pull: {
    compound: [
      { name: "Barbell rows 3×8-10", muscles: ["Back", "Biceps"] },
      { name: "Lat pulldowns 3×10-12", muscles: ["Back", "Biceps"] },
      { name: "Seated cable rows 3×10-12", muscles: ["Back", "Biceps"] },
      { name: "Chest-supported rows 3×8-10", muscles: ["Back", "Rear Deltoids"] },
      { name: "Pull-ups 3×6-10", muscles: ["Back", "Biceps"] },
      { name: "Chin-ups 3×6-10", muscles: ["Back", "Biceps"] },
      { name: "T-bar rows 3×8-10", muscles: ["Back", "Biceps"] },
      { name: "Dumbbell rows 3×8-10", muscles: ["Back", "Biceps"] },
      { name: "Meadows rows 3×10-12", muscles: ["Back", "Rear Deltoids"] },
      { name: "Pendlay rows 3×5-8", muscles: ["Back", "Biceps"] },
    ],
    isolation: [
      { name: "Seated dumbbell curls 3×10-12", muscles: ["Biceps"] },
      { name: "Hammer curls 3×10-12", muscles: ["Biceps"] },
      { name: "Reverse curls 3×12-15", muscles: ["Biceps"] },
      { name: "Face pulls 3×15-20", muscles: ["Rear Deltoids", "Back"] },
      { name: "Rear delt flys 3×12-15", muscles: ["Rear Deltoids"] },
      { name: "Back extensions 3×10-12", muscles: ["Back", "Core"] },
      { name: "Preacher curls 3×10-12", muscles: ["Biceps"] },
      { name: "Cable curls 3×12-15", muscles: ["Biceps"] },
      { name: "Concentration curls 3×10-12", muscles: ["Biceps"] },
      { name: "Incline dumbbell curls 3×10-12", muscles: ["Biceps"] },
    ],
  },
  legs: {
    compound: [
      { name: "Barbell squats 3×8-10", muscles: ["Quads", "Glutes", "Hamstrings"] },
      { name: "Romanian deadlifts 3×8-10", muscles: ["Hamstrings", "Glutes", "Back"] },
      { name: "Lunges 3×8-10 each", muscles: ["Quads", "Glutes"] },
      { name: "Leg press 3×10-12", muscles: ["Quads", "Glutes"] },
      { name: "Bulgarian split squats 3×8-10 each", muscles: ["Quads", "Glutes"] },
      { name: "Hip thrusts 3×10-12", muscles: ["Glutes", "Hamstrings"] },
      { name: "Goblet squats 3×10-12", muscles: ["Quads", "Glutes"] },
      { name: "Step-ups 3×10 each", muscles: ["Quads", "Glutes"] },
      { name: "Sumo deadlifts 3×8-10", muscles: ["Glutes", "Hamstrings", "Quads"] },
      { name: "Front squats 3×8-10", muscles: ["Quads", "Core"] },
    ],
    isolation: [
      { name: "Leg extensions 3×12-15", muscles: ["Quads"] },
      { name: "Seated leg curls 3×10-12", muscles: ["Hamstrings"] },
      { name: "Lying leg curls 3×10-12", muscles: ["Hamstrings"] },
      { name: "Calf raises 3×12-15", muscles: ["Calves"] },
      { name: "Seated calf raises 3×15-20", muscles: ["Calves"] },
      { name: "Hip abduction machine 3×12-15", muscles: ["Glutes"] },
      { name: "Hip adduction machine 3×12-15", muscles: ["Quads"] },
      { name: "Glute kickbacks 3×12-15", muscles: ["Glutes"] },
      { name: "Ab crunch machine 3×12-15", muscles: ["Core"] },
      { name: "Cable pull-throughs 3×12-15", muscles: ["Glutes", "Hamstrings"] },
    ],
  },
};

// ===== WARMUP SUGGESTIONS PER CATEGORY =====
const WARMUP_HINTS = {
  push: [
    "Arm circles (10 forward, 10 backward)",
    "Band pull-aparts × 15",
    "Shoulder dislocates with band × 10",
    "Light push-ups × 10",
  ],
  pull: [
    "Cat-cow stretches × 10",
    "Band pull-aparts × 15",
    "Dead hang 20-30 sec",
    "Light band rows × 12",
  ],
  legs: [
    "Bodyweight squats × 15",
    "Leg swings (front/back) × 10 each",
    "Hip circles × 10 each direction",
    "Walking lunges × 8 each",
  ],
};

const STRETCH_HINTS = {
  push: [
    "Doorway chest stretch — 30 sec each side",
    "Cross-body shoulder stretch — 30 sec each",
    "Overhead tricep stretch — 30 sec each arm",
    "Child's pose — 30 sec",
  ],
  pull: [
    "Lat stretch (hang or doorframe) — 30 sec each",
    "Seated bicep stretch (palms back) — 30 sec",
    "Upper trap stretch (ear to shoulder) — 30 sec each",
    "Thread the needle — 30 sec each side",
  ],
  legs: [
    "Standing quad stretch — 30 sec each",
    "Seated hamstring stretch — 30 sec each",
    "Pigeon pose (hip flexors) — 30 sec each",
    "Standing calf stretch — 30 sec each",
  ],
};

// ===== REMIX HELPERS =====
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateRemixExercises(category, avoidNames = []) {
  const db = EXERCISE_DB[category];
  if (!db) return [];
  const avoidSet = new Set(avoidNames.map(n => n.toLowerCase()));

  const availCompound = shuffleArray(db.compound.filter(e => !avoidSet.has(e.name.toLowerCase())));
  const availIsolation = shuffleArray(db.isolation.filter(e => !avoidSet.has(e.name.toLowerCase())));

  // Pick 2-3 compound, 2-3 isolation (5-6 total, compounds first)
  const numCompound = Math.min(availCompound.length, 2 + Math.round(Math.random()));
  const numIsolation = Math.min(availIsolation.length, 2 + Math.round(Math.random()));

  const picked = [
    ...availCompound.slice(0, numCompound),
    ...availIsolation.slice(0, numIsolation),
  ];

  return picked.map(e => e.name);
}

function reorderRotation(workoutList) {
  // Reorder so same category never appears back-to-back
  if (workoutList.length <= 2) return workoutList;
  const result = [];
  const remaining = [...workoutList];

  // Greedy: pick next workout that doesn't match last category
  let lastCat = null;
  while (remaining.length > 0) {
    const idx = remaining.findIndex(w => w.category !== lastCat);
    if (idx >= 0) {
      result.push(remaining.splice(idx, 1)[0]);
    } else {
      // No choice, just add whatever's left
      result.push(remaining.shift());
    }
    lastCat = result[result.length - 1].category;
  }
  return result;
}

const STORAGE_KEYS = {
  index: "@currentWorkoutIndex",
  history: "@workoutHistory",
  progress: "@exerciseProgress",
  labels: "@exerciseLabels",
  order: "@workoutOrder",
  media: "@exerciseMedia",
  checked: "@exerciseChecked",
  session: "@lastWorkoutSession",
  extra: "@extraExercises",
  removed: "@removedExercises",
  meta: "@exerciseMeta",
  custom: "@customWorkouts",
  library: "@exerciseLibrary",
  deletedWorkouts: "@deletedWorkouts",
  lockedWorkouts: "@lockedWorkouts",
  workoutNames: "@workoutNames",
};

const getExerciseKey = (workoutId, exerciseName) =>
  `${workoutId}::${exerciseName}`;

export default function App() {
  const theme = useTheme();
  const [tab, setTab] = useState("home");
  const [activeScreen, setActiveScreen] = useState("tab");
  const [workoutOriginTab, setWorkoutOriginTab] = useState("home");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState([]);

  const [exerciseChecked, setExerciseChecked] = useState({});
  const [exerciseProgress, setExerciseProgress] = useState({});
  const [exerciseLabels, setExerciseLabels] = useState({});
  const [exerciseMedia, setExerciseMedia] = useState({});

  const [workoutOrderIds, setWorkoutOrderIds] = useState(null);
  const [extraExercises, setExtraExercises] = useState({});
  const [removedExercises, setRemovedExercises] = useState({});
  const [exerciseMeta, setExerciseMeta] = useState({});
  const [customWorkouts, setCustomWorkouts] = useState([]);
  const [libraryExercises, setLibraryExercises] = useState([]);
  const [deletedWorkouts, setDeletedWorkouts] = useState([]);
  const [lockedWorkouts, setLockedWorkouts] = useState([]);
  const [workoutNames, setWorkoutNames] = useState({});

  const [lastIncompleteSession, setLastIncompleteSession] = useState(null);

  const [categoryPicker, setCategoryPicker] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [selectedMediaExercise, setSelectedMediaExercise] = useState(null);
  const [editWorkoutId, setEditWorkoutId] = useState(null);

  const [addWorkoutVisible, setAddWorkoutVisible] = useState(false);
  const [createExerciseVisible, setCreateExerciseVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [libraryEditName, setLibraryEditName] = useState(null);
  const [libraryDeleteName, setLibraryDeleteName] = useState(null);

  // ===== LOAD =====
  useEffect(() => {
    function loadAll() {
      try {
        const indexStr = storage.getItem(STORAGE_KEYS.index);
        const historyStr = storage.getItem(STORAGE_KEYS.history);
        const progressStr = storage.getItem(STORAGE_KEYS.progress);
        const labelsStr = storage.getItem(STORAGE_KEYS.labels);
        const orderStr = storage.getItem(STORAGE_KEYS.order);
        const mediaStr = storage.getItem(STORAGE_KEYS.media);
        const checkedStr = storage.getItem(STORAGE_KEYS.checked);
        const sessionStr = storage.getItem(STORAGE_KEYS.session);
        const extraStr = storage.getItem(STORAGE_KEYS.extra);
        const removedStr = storage.getItem(STORAGE_KEYS.removed);
        const metaStr = storage.getItem(STORAGE_KEYS.meta);
        const customStr = storage.getItem(STORAGE_KEYS.custom);
        const libraryStr = storage.getItem(STORAGE_KEYS.library);
        const deletedStr = storage.getItem(STORAGE_KEYS.deletedWorkouts);

        if (indexStr !== null) {
          const idx = Number(indexStr);
          if (!Number.isNaN(idx)) setCurrentIndex(idx);
        }
        if (historyStr) { const p = JSON.parse(historyStr); if (Array.isArray(p)) setHistory(p); }
        if (progressStr) { const p = JSON.parse(progressStr); if (p && typeof p === "object") setExerciseProgress(p); }
        if (labelsStr) { const p = JSON.parse(labelsStr); if (p && typeof p === "object") setExerciseLabels(p); }
        if (orderStr) { const p = JSON.parse(orderStr); if (Array.isArray(p)) setWorkoutOrderIds(p); }
        if (mediaStr) { const p = JSON.parse(mediaStr); if (p && typeof p === "object") setExerciseMedia(p); }
        if (checkedStr) { const p = JSON.parse(checkedStr); if (p && typeof p === "object") setExerciseChecked(p); }
        if (sessionStr) { const p = JSON.parse(sessionStr); if (p && p.workoutId) setLastIncompleteSession(p); }
        if (extraStr) { const p = JSON.parse(extraStr); if (p && typeof p === "object") setExtraExercises(p); }
        if (removedStr) { const p = JSON.parse(removedStr); if (p && typeof p === "object") setRemovedExercises(p); }
        if (metaStr) { const p = JSON.parse(metaStr); if (p && typeof p === "object") setExerciseMeta(p); }
        if (customStr) { const p = JSON.parse(customStr); if (Array.isArray(p)) setCustomWorkouts(p); }
        if (libraryStr) { const p = JSON.parse(libraryStr); if (Array.isArray(p)) setLibraryExercises(p); }
        if (deletedStr) { const p = JSON.parse(deletedStr); if (Array.isArray(p)) setDeletedWorkouts(p); }
        const lockedStr = storage.getItem(STORAGE_KEYS.lockedWorkouts);
        if (lockedStr) { const p = JSON.parse(lockedStr); if (Array.isArray(p)) setLockedWorkouts(p); }
        const namesStr = storage.getItem(STORAGE_KEYS.workoutNames);
        if (namesStr) { const p = JSON.parse(namesStr); if (p && typeof p === "object") setWorkoutNames(p); }
      } catch (e) {
        console.log("load error", e);
      }
    }
    loadAll();
  }, []);

  // ===== SAVE =====
  useEffect(() => { storage.setItem(STORAGE_KEYS.index, String(currentIndex)); }, [currentIndex]);
  useEffect(() => { storage.setItem(STORAGE_KEYS.history, JSON.stringify(history)); }, [history]);
  useEffect(() => { storage.setItem(STORAGE_KEYS.progress, JSON.stringify(exerciseProgress)); }, [exerciseProgress]);
  useEffect(() => { storage.setItem(STORAGE_KEYS.labels, JSON.stringify(exerciseLabels)); }, [exerciseLabels]);
  useEffect(() => { if (!workoutOrderIds) return; storage.setItem(STORAGE_KEYS.order, JSON.stringify(workoutOrderIds)); }, [workoutOrderIds]);
  useEffect(() => { storage.setItem(STORAGE_KEYS.media, JSON.stringify(exerciseMedia)); }, [exerciseMedia]);
  useEffect(() => { storage.setItem(STORAGE_KEYS.checked, JSON.stringify(exerciseChecked)); }, [exerciseChecked]);
  useEffect(() => { storage.setItem(STORAGE_KEYS.extra, JSON.stringify(extraExercises)); }, [extraExercises]);
  useEffect(() => { storage.setItem(STORAGE_KEYS.removed, JSON.stringify(removedExercises)); }, [removedExercises]);
  useEffect(() => { storage.setItem(STORAGE_KEYS.meta, JSON.stringify(exerciseMeta)); }, [exerciseMeta]);
  useEffect(() => { storage.setItem(STORAGE_KEYS.custom, JSON.stringify(customWorkouts)); }, [customWorkouts]);
  useEffect(() => { storage.setItem(STORAGE_KEYS.library, JSON.stringify(libraryExercises)); }, [libraryExercises]);
  useEffect(() => { storage.setItem(STORAGE_KEYS.deletedWorkouts, JSON.stringify(deletedWorkouts)); }, [deletedWorkouts]);
  useEffect(() => { storage.setItem(STORAGE_KEYS.lockedWorkouts, JSON.stringify(lockedWorkouts)); }, [lockedWorkouts]);
  useEffect(() => { storage.setItem(STORAGE_KEYS.workoutNames, JSON.stringify(workoutNames)); }, [workoutNames]);

  // ===== WORKOUT + EXERCISE DATA =====
  const baseWorkouts = useMemo(
    () => [...WORKOUT_DAYS, ...customWorkouts].filter((w) => !deletedWorkouts.includes(w.id)),
    [customWorkouts, deletedWorkouts]
  );

  function getEffectiveExercisesFor(workout) {
    const baseList = workout.exercises || [];
    const removed = removedExercises[workout.id] || [];
    const extras = extraExercises[workout.id] || [];
    const filteredBase = baseList.filter((n) => !removed.includes(n));
    return [...filteredBase, ...extras];
  }

  let orderedBase = baseWorkouts;
  if (workoutOrderIds && workoutOrderIds.length) {
    const map = new Map(baseWorkouts.map((w) => [w.id, w]));
    const mapped = workoutOrderIds.map((id) => map.get(id)).filter(Boolean);
    const missing = baseWorkouts.filter((w) => !workoutOrderIds.includes(w.id));
    orderedBase = [...mapped, ...missing];
  }

  const orderedWorkouts = orderedBase.map((w) => ({
    ...w,
    name: workoutNames[w.id] || w.name,
    exercises: getEffectiveExercisesFor(w),
  }));

  const currentWorkout =
    orderedWorkouts.length > 0
      ? orderedWorkouts[Math.min(currentIndex, orderedWorkouts.length - 1)]
      : null;

  const editWorkoutBase =
    editWorkoutId != null ? orderedBase.find((w) => w.id === editWorkoutId) || null : null;
  const editWorkoutEffective = editWorkoutBase != null ? getEffectiveExercisesFor(editWorkoutBase) : [];
  const editWorkoutExtras = editWorkoutId != null ? extraExercises[editWorkoutId] || [] : [];
  const editWorkoutRemoved = editWorkoutId != null ? removedExercises[editWorkoutId] || [] : [];

  const resumeWorkout =
    lastIncompleteSession && lastIncompleteSession.workoutId
      ? orderedWorkouts.find((w) => w.id === lastIncompleteSession.workoutId) || null
      : null;

  const nextWorkout = orderedWorkouts.length > 0 ? currentWorkout : null;
  const primaryWorkout = resumeWorkout || nextWorkout;

  const categoryWorkouts =
    categoryPicker && orderedWorkouts.length
      ? orderedWorkouts.filter((w) => w.category === categoryPicker)
      : [];

  function updateLibraryMeta(name, category, type, muscles) {
    const cleanName = (name || "").trim();
    if (!cleanName) return;
    setLibraryExercises((prev) => {
      const idx = prev.findIndex((e) => e.name === cleanName);
      if (idx === -1) return [...prev, { name: cleanName, category, type, muscles }];
      const next = [...prev];
      next[idx] = { ...next[idx], category, type, muscles };
      return next;
    });
  }

  const exerciseOptions = useMemo(() => {
    const map = new Map();
    baseWorkouts.forEach((w) => {
      const baseList = w.exercises || [];
      const extras = extraExercises[w.id] || [];
      const addName = (name) => {
        const trimmed = (name || "").trim();
        if (!trimmed) return;
        if (!map.has(trimmed)) {
          const key = getExerciseKey(w.id, name);
          const meta = exerciseMeta[key] || {};
          map.set(trimmed, {
            name: trimmed,
            category: meta.category || w.category,
            type: meta.type || "compound",
            muscles: meta.muscles || [],
          });
        }
      };
      baseList.forEach(addName);
      extras.forEach(addName);
    });
    libraryExercises.forEach((lib) => {
      const existing = map.get(lib.name);
      if (!existing) {
        map.set(lib.name, { name: lib.name, category: lib.category || "legs", type: lib.type || "compound", muscles: lib.muscles || [] });
      } else {
        map.set(lib.name, {
          ...existing,
          category: lib.category || existing.category,
          type: lib.type || existing.type,
          muscles: lib.muscles && lib.muscles.length ? lib.muscles : existing.muscles || [],
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [baseWorkouts, extraExercises, exerciseMeta, libraryExercises]);

  function saveLastSession(workoutId) {
    if (!workoutId) return;
    const session = { workoutId };
    setLastIncompleteSession(session);
    storage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
  }

  function clearLastSessionFor(workoutId) {
    setLastIncompleteSession((prev) => {
      if (!prev || prev.workoutId !== workoutId) return prev;
      return null;
    });
    storage.removeItem(STORAGE_KEYS.session);
  }

  function markComplete() {
    if (!currentWorkout || !orderedWorkouts.length) return;
    const today = new Date().toISOString().slice(0, 10);
    const newEntry = { date: today, workoutId: currentWorkout.id, name: currentWorkout.name };
    setHistory((prev) => [newEntry, ...prev]);
    setExerciseChecked((prev) => {
      const copy = { ...prev };
      currentWorkout.exercises.forEach((ex) => { delete copy[getExerciseKey(currentWorkout.id, ex)]; });
      return copy;
    });
    clearLastSessionFor(currentWorkout.id);
    setCurrentIndex((prev) => orderedWorkouts.length ? (prev + 1) % orderedWorkouts.length : prev);
  }

  function skipWorkout() {
    if (!currentWorkout || !orderedWorkouts.length) return;
    setExerciseChecked((prev) => {
      const copy = { ...prev };
      currentWorkout.exercises.forEach((ex) => { delete copy[getExerciseKey(currentWorkout.id, ex)]; });
      return copy;
    });
    clearLastSessionFor(currentWorkout.id);
    setCurrentIndex((prev) => orderedWorkouts.length ? (prev + 1) % orderedWorkouts.length : prev);
  }

  function handleToggleExercise(workoutId, exerciseName) {
    const key = getExerciseKey(workoutId, exerciseName);
    setExerciseChecked((prev) => ({ ...prev, [key]: !prev[key] }));
    saveLastSession(workoutId);
  }

  function handleOpenExercise(workoutId, exerciseName) { setSelectedExercise({ workoutId, exerciseName }); }
  function handleCloseExercise() { setSelectedExercise(null); }

  function handleUpdateExerciseProgress(workoutId, exerciseName, field, value) {
    const key = getExerciseKey(workoutId, exerciseName);
    setExerciseProgress((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: value } }));
    saveLastSession(workoutId);
  }

  function handleUpdateExerciseLabel(workoutId, exerciseName, label) {
    const key = getExerciseKey(workoutId, exerciseName);
    setExerciseLabels((prev) => {
      const clean = (label || "").trim();
      if (!clean) { const { [key]: _, ...rest } = prev; return rest; }
      return { ...prev, [key]: { ...(prev[key] || {}), label: clean } };
    });
    saveLastSession(workoutId);
  }

  function handleOpenMedia(workoutId, exerciseName) { setSelectedMediaExercise({ workoutId, exerciseName }); }
  function handleCloseMedia() { setSelectedMediaExercise(null); }

  function handleUpdateExerciseMedia(workoutId, exerciseName, url) {
    const key = getExerciseKey(workoutId, exerciseName);
    const clean = (url || "").trim();
    setExerciseMedia((prev) => {
      if (!clean) { const { [key]: _, ...rest } = prev; return rest; }
      return { ...prev, [key]: { url: clean } };
    });
    saveLastSession(workoutId);
  }

  function moveWorkout(id, direction) {
    setWorkoutOrderIds((prev) => {
      const baseIds = prev && prev.length ? [...prev] : baseWorkouts.map((w) => w.id);
      const idx = baseIds.indexOf(id);
      if (idx === -1) return baseIds;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= baseIds.length) return baseIds;
      const copy = [...baseIds];
      const [moved] = copy.splice(idx, 1);
      copy.splice(newIdx, 0, moved);
      return copy;
    });
  }

  function jumpToWorkout(id) {
    const idx = orderedWorkouts.findIndex((w) => w.id === id);
    if (idx >= 0) {
      setCurrentIndex(idx);
      setWorkoutOriginTab("workouts");
      setActiveScreen("workout");
    }
  }

  function addExerciseToWorkout(workoutId, name, type, muscles, category) {
    const cleanName = (name || "").trim();
    if (!cleanName || !workoutId) return;
    setExtraExercises((prev) => {
      const list = prev[workoutId] || [];
      if (list.includes(cleanName)) return prev;
      return { ...prev, [workoutId]: [...list, cleanName] };
    });
    const key = getExerciseKey(workoutId, cleanName);
    setExerciseMeta((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), type, muscles, category } }));
    updateLibraryMeta(cleanName, category, type, muscles);
    saveLastSession(workoutId);
  }

  function toggleRemoveExercise(workoutId, exerciseName, isCustom) {
    if (isCustom) {
      setExtraExercises((prev) => {
        const list = prev[workoutId] || [];
        const nextList = list.filter((n) => n !== exerciseName);
        const copy = { ...prev };
        if (nextList.length) copy[workoutId] = nextList;
        else delete copy[workoutId];
        return copy;
      });
    } else {
      setRemovedExercises((prev) => {
        const list = prev[workoutId] || [];
        const isRemoved = list.includes(exerciseName);
        const copy = { ...prev };
        if (isRemoved) {
          const nextList = list.filter((n) => n !== exerciseName);
          if (nextList.length) copy[workoutId] = nextList;
          else delete copy[workoutId];
        } else {
          copy[workoutId] = [...list, exerciseName];
        }
        return copy;
      });
    }
    saveLastSession(workoutId);
  }

  function toggleLockWorkout(id) {
    setLockedWorkouts((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function remixRotation() {
    // Collect names of exercises used across ALL workouts to try to vary picks
    const allUsedNames = [];
    orderedWorkouts.forEach(w => {
      w.exercises.forEach(e => allUsedNames.push(e));
    });

    // For each unlocked workout, generate new exercises
    const newExtra = { ...extraExercises };
    const newRemoved = { ...removedExercises };

    orderedWorkouts.forEach(w => {
      if (lockedWorkouts.includes(w.id)) return; // skip locked

      const cat = w.category;
      if (!EXERCISE_DB[cat]) return;

      // Get names used in OTHER workouts (to vary picks)
      const otherNames = [];
      orderedWorkouts.forEach(ow => {
        if (ow.id !== w.id) ow.exercises.forEach(e => otherNames.push(e));
      });

      const newExercises = generateRemixExercises(cat, otherNames);
      if (!newExercises.length) return;

      // Remove all base exercises
      const baseWorkout = baseWorkouts.find(bw => bw.id === w.id);
      if (baseWorkout && baseWorkout.exercises) {
        newRemoved[w.id] = [...baseWorkout.exercises];
      }

      // Replace extras with the new generated list
      newExtra[w.id] = newExercises;
    });

    setExtraExercises(newExtra);
    setRemovedExercises(newRemoved);

    // Reorder so same category isn't back-to-back
    const reordered = reorderRotation(orderedWorkouts);
    setWorkoutOrderIds(reordered.map(w => w.id));
    setCurrentIndex(0);
  }

  function renameWorkout(id, newName) {
    const clean = (newName || "").trim();
    if (!clean) return;
    setWorkoutNames((prev) => ({ ...prev, [id]: clean }));
  }

  function handleHomePrimaryPress() {
    if (!primaryWorkout) return;
    const idx = orderedWorkouts.findIndex((w) => w.id === primaryWorkout.id);
    if (idx >= 0) setCurrentIndex(idx);
    setWorkoutOriginTab("home");
    setActiveScreen("workout");
  }

  const onBackFromWorkout = () => {
    setActiveScreen("tab");
    if (workoutOriginTab) setTab(workoutOriginTab);
  };

  const handleAddWorkout = (name, focus, category) => {
    const cleanName = (name || "").trim();
    if (!cleanName) return;
    const id = `custom_${Date.now()}`;
    const newWorkout = { id, name: cleanName, focus: (focus || "").trim() || "Custom", category, exercises: [] };
    setCustomWorkouts((prev) => [...prev, newWorkout]);
    setWorkoutOrderIds((prev) => {
      if (prev && prev.length) return [...prev, id];
      return [...WORKOUT_DAYS.map((w) => w.id), id];
    });
  };

  const handleCreateExercise = (maybeWorkoutId, name, type, muscles, category) => {
    const cleanName = (name || "").trim();
    if (!cleanName) return;
    updateLibraryMeta(cleanName, category, type, muscles);
    if (maybeWorkoutId) addExerciseToWorkout(maybeWorkoutId, cleanName, type, muscles, category);
  };

  function deleteWorkout(id) {
    if (!id) return;
    setDeletedWorkouts((prev) => prev.includes(id) ? prev : [...prev, id]);
    setCustomWorkouts((prev) => prev.filter((w) => w.id !== id));
    setWorkoutOrderIds((prev) => prev ? prev.filter((wid) => wid !== id) : null);
    setExtraExercises((prev) => { const copy = { ...prev }; delete copy[id]; return copy; });
    setRemovedExercises((prev) => { const copy = { ...prev }; delete copy[id]; return copy; });
    const cleanObjByWorkout = (obj) => {
      const res = {};
      Object.entries(obj).forEach(([key, value]) => { if (!key.startsWith(`${id}::`)) res[key] = value; });
      return res;
    };
    setExerciseMeta((prev) => cleanObjByWorkout(prev));
    setExerciseProgress((prev) => cleanObjByWorkout(prev));
    setExerciseLabels((prev) => cleanObjByWorkout(prev));
    setExerciseMedia((prev) => cleanObjByWorkout(prev));
    setExerciseChecked((prev) => cleanObjByWorkout(prev));
    if (lastIncompleteSession && lastIncompleteSession.workoutId === id) {
      setLastIncompleteSession(null);
      storage.removeItem(STORAGE_KEYS.session);
    }
    if (currentWorkout && currentWorkout.id === id) setCurrentIndex(0);
  }

  function deleteExerciseEverywhere(exerciseName) {
    const target = (exerciseName || "").trim();
    if (!target) return;
    setExtraExercises((prev) => {
      const copy = {};
      Object.entries(prev).forEach(([wid, list]) => {
        const filtered = list.filter((n) => n !== target);
        if (filtered.length) copy[wid] = filtered;
      });
      return copy;
    });
    setRemovedExercises((prev) => {
      const copy = { ...prev };
      baseWorkouts.forEach((w) => {
        const baseList = w.exercises || [];
        if (baseList.includes(target)) {
          const existing = copy[w.id] || [];
          if (!existing.includes(target)) copy[w.id] = [...existing, target];
        }
      });
      return copy;
    });
    const cleanObjByName = (obj) => {
      const res = {};
      Object.entries(obj).forEach(([key, value]) => { if ((key.split("::")[1] || "") !== target) res[key] = value; });
      return res;
    };
    setExerciseMeta((prev) => cleanObjByName(prev));
    setExerciseProgress((prev) => cleanObjByName(prev));
    setExerciseLabels((prev) => cleanObjByName(prev));
    setExerciseMedia((prev) => cleanObjByName(prev));
    setExerciseChecked((prev) => cleanObjByName(prev));
    setLibraryExercises((prev) => prev.filter((e) => e.name !== target));
  }

  const onGoToWorkouts = () => { setTab("workouts"); setActiveScreen("tab"); };
  const onPickCategory = (cat) => setCategoryPicker(cat);

  const libraryEditingExercise = libraryEditName
    ? exerciseOptions.find((e) => e.name === libraryEditName) || null
    : null;

  return (
    <div className="app-container">
      {activeScreen === "tab" && (
        <div className="tab-row">
          <button className={`tab-button ${tab === "home" ? "active" : ""}`} onClick={() => setTab("home")}>
            <IconHome />
            <span>Home</span>
          </button>
          <button className={`tab-button ${tab === "workouts" ? "active" : ""}`} onClick={() => setTab("workouts")}>
            <IconDumbbell />
            <span>Workouts</span>
          </button>
          <button className={`tab-button ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")}>
            <IconClock />
            <span>History</span>
          </button>
        </div>
      )}

      {activeScreen === "workout" ? (
        <TodayView
          workout={currentWorkout} onComplete={markComplete} onSkip={skipWorkout}
          exerciseChecked={exerciseChecked} onToggleExercise={handleToggleExercise}
          onExercisePress={handleOpenExercise} onExerciseMediaPress={handleOpenMedia}
          onEditExercises={() => currentWorkout && setEditWorkoutId(currentWorkout.id)}
          exerciseProgress={exerciseProgress} exerciseLabels={exerciseLabels}
          exerciseMedia={exerciseMedia} onBack={onBackFromWorkout}
          onRename={(newName) => currentWorkout && renameWorkout(currentWorkout.id, newName)}
        />
      ) : activeScreen === "library" ? (
        <ExerciseLibraryView
          exerciseOptions={exerciseOptions}
          onBack={() => { setActiveScreen("tab"); setTab("home"); }}
          onEditExercise={(name) => setLibraryEditName(name)}
          onDeleteExercise={(name) => setLibraryDeleteName(name)}
        />
      ) : tab === "home" ? (
        <HomeView
          primaryWorkout={primaryWorkout} hasIncomplete={!!resumeWorkout}
          onPrimaryPress={handleHomePrimaryPress} onPickCategory={onPickCategory}
          onGoToWorkouts={onGoToWorkouts} onOpenLibrary={() => setActiveScreen("library")}
          onCreateExercise={() => setCreateExerciseVisible(true)}
          themeMode={theme.mode} onToggleTheme={theme.toggle}
          history={history}
        />
      ) : tab === "history" ? (
        <HistoryView history={history} workouts={orderedWorkouts} />
      ) : (
        <WorkoutsView
          workouts={orderedWorkouts} onMoveWorkout={moveWorkout} onOpenWorkout={jumpToWorkout}
          onAddWorkout={() => setAddWorkoutVisible(true)} onOpenDeleteModal={() => setDeleteModalVisible(true)}
          lockedWorkouts={lockedWorkouts} onToggleLock={toggleLockWorkout} onRemix={remixRotation}
          onRenameWorkout={renameWorkout}
        />
      )}

      {selectedExercise && (
        <ExerciseModal
          selected={selectedExercise} progress={exerciseProgress} labels={exerciseLabels}
          media={exerciseMedia} onChange={handleUpdateExerciseProgress}
          onChangeLabel={handleUpdateExerciseLabel} onChangeMedia={handleUpdateExerciseMedia}
          onClose={handleCloseExercise}
        />
      )}

      {selectedMediaExercise && (
        <MediaModal selected={selectedMediaExercise} media={exerciseMedia} onClose={handleCloseMedia} />
      )}

      {categoryPicker && (
        <CategoryPickerModal
          category={categoryPicker} workouts={categoryWorkouts}
          onSelect={(id) => {
            const idx = orderedWorkouts.findIndex((w) => w.id === id);
            if (idx >= 0) { setCurrentIndex(idx); setWorkoutOriginTab("home"); setActiveScreen("workout"); }
            setCategoryPicker(null);
          }}
          onClose={() => setCategoryPicker(null)}
        />
      )}

      {editWorkoutId != null && editWorkoutBase && (
        <EditExercisesModal
          workout={editWorkoutBase} effectiveExercises={editWorkoutEffective}
          extras={editWorkoutExtras} removed={editWorkoutRemoved}
          exerciseMeta={exerciseMeta} exerciseOptions={exerciseOptions}
          onAddExisting={addExerciseToWorkout} onToggleRemove={toggleRemoveExercise}
          onClose={() => setEditWorkoutId(null)}
        />
      )}

      {addWorkoutVisible && (
        <AddWorkoutModal
          onClose={() => setAddWorkoutVisible(false)}
          onSave={(name, focus, category) => { handleAddWorkout(name, focus, category); setAddWorkoutVisible(false); }}
        />
      )}

      {createExerciseVisible && (
        <CreateExerciseModal
          workouts={orderedWorkouts}
          onClose={() => setCreateExerciseVisible(false)}
          onSave={(workoutId, name, type, muscles, category) => { handleCreateExercise(workoutId, name, type, muscles, category); setCreateExerciseVisible(false); }}
        />
      )}

      {deleteModalVisible && (
        <DeleteWorkoutModal
          workouts={orderedWorkouts}
          onClose={() => setDeleteModalVisible(false)}
          onConfirmDelete={(id) => { deleteWorkout(id); setDeleteModalVisible(false); }}
        />
      )}

      {libraryEditName && libraryEditingExercise && (
        <LibraryExerciseModal
          exercise={libraryEditingExercise}
          onSave={(name, category, type, muscles) => { updateLibraryMeta(name, category, type, muscles); setLibraryEditName(null); }}
          onClose={() => setLibraryEditName(null)}
        />
      )}

      {libraryDeleteName && (
        <DeleteExerciseModal
          exerciseName={libraryDeleteName}
          onConfirm={() => { deleteExerciseEverywhere(libraryDeleteName); setLibraryDeleteName(null); }}
          onClose={() => setLibraryDeleteName(null)}
        />
      )}
    </div>
  );
}

/* ===== SVG ICONS ===== */
const dinoImgUrl = new URL("/dino-raw.png", import.meta.url).href;
const DinoIcon = () => (
  <img src={dinoImgUrl} alt="Lazy Workouts dino" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
);

const IconHome = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const IconDumbbell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 6.5h11M6.5 17.5h11"/>
    <rect x="2" y="5" width="4.5" height="14" rx="1.5"/>
    <rect x="17.5" y="5" width="4.5" height="14" rx="1.5"/>
    <line x1="12" y1="5" x2="12" y2="19"/>
  </svg>
);

const IconClock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconChevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const IconList = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const IconBook = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
  </svg>
);

const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

/* ===== HOME ===== */
function HomeView({ primaryWorkout, hasIncomplete, onPrimaryPress, onPickCategory, onGoToWorkouts, onOpenLibrary, onCreateExercise, themeMode, onToggleTheme, history }) {
  const labelTitle = hasIncomplete ? "Current workout" : "Next up";
  const buttonLabel = hasIncomplete ? "Continue unfinished workout" : "Start next workout";
  const subLabel = primaryWorkout ? primaryWorkout.name : "No workouts defined";

  const totalWorkouts = history.length;
  const streak = (() => {
    if (!history.length) return 0;
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      if (history.some(h => h.date === dateStr)) count++;
      else if (i > 0) break;
    }
    return count;
  })();
  const thisWeek = (() => {
    const now = new Date();
    const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - day);
    const startStr = start.toISOString().slice(0, 10);
    return history.filter(h => h.date >= startStr).length;
  })();

  return (
    <div className="card">
      <div className="logo-row">
        <div className="logo-circle"><DinoIcon /></div>
        <div style={{ flex: 1 }}>
          <div className="app-title">Lazy Workouts</div>
          <div className="app-subtitle">Strong, but make it comfy.</div>
        </div>
        <button className="theme-toggle" onClick={onToggleTheme} title={themeMode === "light" ? "Switch to dark mode" : "Switch to light mode"}>
          {themeMode === "light" ? "\u2600\uFE0F" : "\uD83C\uDF19"}
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{totalWorkouts}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-value streak">{streak}</div>
          <div className="stat-label">Streak</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{thisWeek}</div>
          <div className="stat-label">This Week</div>
        </div>
      </div>

      <div className="card-scroll">
        <div className="section-header">{labelTitle}</div>
        <button className="primary-big-button" onClick={primaryWorkout ? onPrimaryPress : undefined}>
          <span className="primary-big-button-label">{buttonLabel}</span>
          <span className="primary-big-button-sub">{subLabel}</span>
          <span className="primary-big-button-arrow"><IconChevron /></span>
        </button>

        <div className="section-header">Quick pick</div>
        <div className="button-row">
          <button className="secondary-button legs" onClick={() => onPickCategory("legs")}>Legs</button>
          <button className="secondary-button push" onClick={() => onPickCategory("push")}>Push</button>
          <button className="secondary-button pull" onClick={() => onPickCategory("pull")}>Pull</button>
        </div>

        <div className="section-header">Manage</div>
        <button className="outline-button" onClick={onGoToWorkouts}>
          <IconList />
          <span>All workouts</span>
          <span className="outline-button-arrow"><IconChevron /></span>
        </button>

        <button className="outline-button" onClick={onOpenLibrary}>
          <IconBook />
          <span>Exercise library</span>
          <span className="outline-button-arrow"><IconChevron /></span>
        </button>

        <button className="create-exercise-button" onClick={onCreateExercise}>
          <IconPlus />
          <span>Create a new exercise</span>
        </button>
      </div>
    </div>
  );
}

/* ===== TODAY VIEW ===== */
function TodayView({ workout, onComplete, onSkip, exerciseChecked, onToggleExercise, onExercisePress, onExerciseMediaPress, onEditExercises, exerciseProgress, exerciseLabels, exerciseMedia, onBack, onRename }) {
  const [showWarmup, setShowWarmup] = useState(false);
  const [showStretch, setShowStretch] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  if (!workout) {
    return (
      <div className="card">
        <div className="workout-header-row"><button className="back-button" onClick={onBack}>&larr; Back</button></div>
        <div className="title">No workouts defined</div>
        <div className="subtitle">Edit WORKOUT_DAYS at the top of the file to add your workouts.</div>
      </div>
    );
  }

  const checkedCount = workout.exercises.filter(item => !!exerciseChecked[getExerciseKey(workout.id, item)]).length;
  const totalCount = workout.exercises.length;
  const progressPct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  return (
    <div className="card">
      <div className="workout-header-row">
        <button className="back-button" onClick={onBack}>&larr; Back</button>
        <span className={`cat-badge ${workout.category || ""}`}>{(workout.category || "").toUpperCase()}</span>
      </div>
      {editingName ? (
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
          <input
            className="rename-input"
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { if (draftName.trim()) onRename(draftName.trim()); setEditingName(false); }
              if (e.key === "Escape") setEditingName(false);
            }}
          />
          <button className="small-btn" onClick={() => { if (draftName.trim()) onRename(draftName.trim()); setEditingName(false); }}>Save</button>
          <button className="small-btn" onClick={() => setEditingName(false)}>✕</button>
        </div>
      ) : (
        <div className="title editable-title" onClick={() => { setDraftName(workout.name); setEditingName(true); }}>
          {workout.name} <span className="edit-hint">✎</span>
        </div>
      )}
      <div className="subtitle">{workout.focus}</div>
      <div className="workout-progress-bar">
        <div className="workout-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>
      <div className="workout-progress-label">{checkedCount} of {totalCount} done ({progressPct}%)</div>

      {WARMUP_HINTS[workout.category] && (
        <button
          className="outline-button"
          style={{ marginBottom: 8, fontSize: 13 }}
          onClick={() => setShowWarmup(p => !p)}
        >
          <span>{showWarmup ? "\u25BC" : "\u25B6"} Warmup suggestions</span>
        </button>
      )}
      {showWarmup && WARMUP_HINTS[workout.category] && (
        <div style={{ marginBottom: 10 }}>
          {WARMUP_HINTS[workout.category].map((hint, i) => (
            <div key={i} style={{ padding: "6px 12px", fontSize: 13, color: "var(--text-secondary)", display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ color: "var(--accent)", fontWeight: 700 }}>{"\u2022"}</span>
              <span>{hint}</span>
            </div>
          ))}
        </div>
      )}

      <div className="card-scroll">
        {workout.exercises.map((item, index) => {
          const key = getExerciseKey(workout.id, item);
          const checked = !!exerciseChecked[key];
          const progress = exerciseProgress ? exerciseProgress[key] : null;
          const labelEntry = exerciseLabels ? exerciseLabels[key] : null;
          const mediaEntry = exerciseMedia ? exerciseMedia[key] : null;
          const displayName = labelEntry && labelEntry.label && labelEntry.label.trim() ? labelEntry.label.trim() : item;
          const w = progress?.weight ? progress.weight.trim() : "";
          const r = progress?.reps ? progress.reps.trim() : "";
          const parts = [];
          if (w) parts.push(w);
          if (r) parts.push(r);
          const progressLabel = parts.length > 0 ? parts.join(" \u2022 ") : "Tap to edit";
          const hasMedia = !!(mediaEntry && mediaEntry.url);

          return (
            <div className="exercise-row" key={`${workout.id}-${index}`}>
              <div className="exercise-number">{index + 1}</div>
              <div className="checkbox-wrapper" onClick={() => onToggleExercise(workout.id, item)}>
                <div className={`checkbox ${checked ? "checked" : ""}`}>
                  {checked && <span className="checkbox-tick">{"\u2713"}</span>}
                </div>
              </div>
              <div className="exercise-text-wrapper" onClick={() => onExercisePress(workout.id, item)}>
                <div className={`exercise-text ${checked ? "done" : ""}`}>{displayName}</div>
                <div className="exercise-hint">{progressLabel}</div>
              </div>
              {hasMedia && (
                <button className="media-btn" onClick={() => onExerciseMediaPress(workout.id, item)}>View</button>
              )}
            </div>
          );
        })}
      </div>
      {STRETCH_HINTS[workout.category] && (
        <button
          className="outline-button"
          style={{ marginTop: 8, marginBottom: 8, fontSize: 13 }}
          onClick={() => setShowStretch(p => !p)}
        >
          <span>{showStretch ? "\u25BC" : "\u25B6"} Cooldown stretches</span>
        </button>
      )}
      {showStretch && STRETCH_HINTS[workout.category] && (
        <div style={{ marginBottom: 10 }}>
          {STRETCH_HINTS[workout.category].map((hint, i) => (
            <div key={i} style={{ padding: "6px 12px", fontSize: 13, color: "var(--text-secondary)", display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ color: "var(--green, #4CAF50)", fontWeight: 700 }}>{"\u2022"}</span>
              <span>{hint}</span>
            </div>
          ))}
        </div>
      )}
      <button className="complete-button" onClick={onComplete}>Complete workout</button>
      <button className="skip-button" onClick={onSkip}>Skip this workout</button>
      <button className="edit-exercises-button" onClick={onEditExercises}>Edit exercises</button>
    </div>
  );
}

/* ===== HISTORY ===== */
function HistoryView({ history, workouts }) {
  const getCategory = (item) => {
    const w = workouts.find(w => w.id === item.workoutId);
    return w ? w.category : "";
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + "T12:00:00");
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (dateStr === today.toISOString().slice(0, 10)) return "Today";
    if (dateStr === yesterday.toISOString().slice(0, 10)) return "Yesterday";
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  if (!history.length) {
    return (
      <div className="card">
        <div className="history-empty-state">
          <div className="history-empty-icon"><DinoIcon /></div>
          <div className="title">No history yet</div>
          <div className="subtitle">Complete your first workout and it'll show up here.</div>
        </div>
      </div>
    );
  }
  return (
    <div className="card">
      <div className="title">History</div>
      <div className="subtitle">{history.length} workout{history.length !== 1 ? "s" : ""} completed</div>
      <div className="card-scroll">
        {history.map((item, index) => {
          const cat = getCategory(item);
          return (
            <div className="history-row" key={`${item.date}-${index}`}>
              <div className={`history-cat-dot ${cat}`} />
              <div className="history-info">
                <div className="history-name">{item.name}</div>
                <div className="history-date">{formatDate(item.date)}</div>
              </div>
              {cat && <span className={`cat-badge ${cat}`}>{cat}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ===== WORKOUTS TAB ===== */
function WorkoutsView({ workouts, onMoveWorkout, onOpenWorkout, onAddWorkout, onOpenDeleteModal, lockedWorkouts, onToggleLock, onRemix, onRenameWorkout }) {
  const [remixConfirm, setRemixConfirm] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameDraft, setRenameDraft] = useState("");

  const handleRemix = () => {
    if (!remixConfirm) { setRemixConfirm(true); return; }
    onRemix();
    setRemixConfirm(false);
  };

  const unlockedCount = workouts.filter(w => !lockedWorkouts.includes(w.id)).length;

  return (
    <div className="card">
      <div className="title">All workouts</div>
      <div style={{ display: "flex", gap: 8, marginTop: 6, marginBottom: 10 }}>
        <button className="add-workout-button" onClick={onAddWorkout}>+ Add new</button>
      </div>
      <div className="subtitle">{workouts.length} workout{workouts.length !== 1 ? "s" : ""} in rotation</div>
      <div className="card-scroll">
        {workouts.map((item) => {
          const isLocked = lockedWorkouts.includes(item.id);
          return (
            <div className="manage-row" key={item.id}>
              <div className={`manage-cat-strip ${item.category || ""}`} />
              <div className="manage-info">
                {renamingId === item.id ? (
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <input
                      className="rename-input"
                      autoFocus
                      value={renameDraft}
                      onChange={(e) => setRenameDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { if (renameDraft.trim()) onRenameWorkout(item.id, renameDraft.trim()); setRenamingId(null); }
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                    />
                    <button className="small-btn" onClick={() => { if (renameDraft.trim()) onRenameWorkout(item.id, renameDraft.trim()); setRenamingId(null); }}>✓</button>
                  </div>
                ) : (
                  <div className="manage-name" onClick={() => { setRenameDraft(item.name); setRenamingId(item.id); }} style={{ cursor: "pointer" }}>
                    {isLocked && <span title="Locked from remix" style={{ marginRight: 4 }}>{"\uD83D\uDD12"}</span>}
                    {item.name} <span className="edit-hint">✎</span>
                  </div>
                )}
                <div className="manage-meta">
                  <span>{item.focus}</span>
                  <span className={`cat-badge ${item.category || ""}`}>{(item.category || "").toUpperCase()}</span>
                </div>
              </div>
              <div className="manage-buttons">
                <button
                  className="small-btn"
                  onClick={() => onToggleLock(item.id)}
                  title={isLocked ? "Unlock for remix" : "Lock from remix"}
                  style={isLocked ? { background: "var(--accent-glow)", color: "var(--accent)" } : {}}
                >{isLocked ? "\uD83D\uDD12" : "\uD83D\uDD13"}</button>
                <button className="small-btn" onClick={() => onMoveWorkout(item.id, -1)}>{"\u2191"}</button>
                <button className="small-btn" onClick={() => onMoveWorkout(item.id, 1)}>{"\u2193"}</button>
                <button className="small-btn-outline" onClick={() => onOpenWorkout(item.id)}>Open</button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        className={`modal-button ${remixConfirm ? "" : ""}`}
        style={{ marginTop: 12, background: remixConfirm ? "var(--accent)" : "var(--surface)", color: remixConfirm ? "#fff" : "var(--accent)", border: `1px solid var(--accent)` }}
        onClick={handleRemix}
        disabled={unlockedCount === 0}
      >
        {remixConfirm ? `Remix ${unlockedCount} unlocked workout${unlockedCount !== 1 ? "s" : ""}? Tap again to confirm` : `Remix rotation (${unlockedCount} unlocked)`}
      </button>
      {remixConfirm && (
        <button className="modal-button cancel" style={{ marginTop: 6 }} onClick={() => setRemixConfirm(false)}>Cancel</button>
      )}

      <button className="delete-workouts-button" onClick={onOpenDeleteModal}>Delete workouts</button>
    </div>
  );
}

/* ===== EXERCISE LIBRARY ===== */
function ExerciseLibraryView({ exerciseOptions, onBack, onEditExercise, onDeleteExercise }) {
  return (
    <div className="card">
      <div className="workout-header-row"><button className="back-button" onClick={onBack}>&larr; Back</button></div>
      <div className="title">Exercise library</div>
      <div className="subtitle">View and tag all saved exercises so filters stay smart.</div>
      <div className="card-scroll">
        {exerciseOptions.length === 0 ? (
          <div className="subtitle">No exercises yet.</div>
        ) : (
          exerciseOptions.map((item) => (
            <div className="library-row" key={item.name}>
              <div style={{ flex: 1 }}>
                <div className="manage-name">{item.name}</div>
                <div className="manage-meta">
                  {(item.category || "uncategorized").toUpperCase()} {"\u2022"} {item.type === "isolation" ? "Isolation" : "Compound"}
                </div>
                {item.muscles && item.muscles.length > 0 && <div className="library-muscles">{item.muscles.join(", ")}</div>}
              </div>
              <div className="library-buttons">
                <button className="small-btn-outline" onClick={() => onEditExercise(item.name)}>Edit tags</button>
                <button className="small-btn-outline" style={{ borderColor: "#B3261E", color: "#B3261E" }} onClick={() => onDeleteExercise(item.name)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ===== EXERCISE DETAIL MODAL ===== */
function ExerciseGifPreview({ exerciseName }) {
  const { gifUrl, loading, load } = useExerciseGif(exerciseName);
  const [show, setShow] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searching, setSearching] = useState(false);
  const [customGif, setCustomGif] = useState(null);

  const handleToggle = () => {
    if (!show) { load(); setShow(true); }
    else setShow(false);
  };

  const handleSearch = () => {
    const term = searchTerm.trim();
    if (!term) return;
    setSearching(true);
    fetch(`https://exercisedb-api.vercel.app/api/v1/exercises?search=${encodeURIComponent(term)}&limit=5`)
      .then(r => r.json())
      .then(json => {
        const results = json.data || [];
        if (results.length > 0 && results[0].gifUrl) {
          const url = results[0].gifUrl;
          setCustomGif(url);
          saveGifCache(exerciseName.replace(/\s*\d+[\u00d7x×]\s*\d+[-\u2013]\d+.*$/i, "")
            .replace(/\s*@\s*\d+.*$/i, "").replace(/\s*3[\u00d7x×]\s*$/i, "")
            .replace(/\s*\(.*\)\s*$/g, "").trim(), url);
        }
        setSearching(false);
        setShowSearch(false);
        setSearchTerm("");
      })
      .catch(() => setSearching(false));
  };

  const handleDismiss = () => {
    saveGifCache(exerciseName.replace(/\s*\d+[\u00d7x×]\s*\d+[-\u2013]\d+.*$/i, "")
      .replace(/\s*@\s*\d+.*$/i, "").replace(/\s*3[\u00d7x×]\s*$/i, "")
      .replace(/\s*\(.*\)\s*$/g, "").trim(), null);
    setShow(false);
    setCustomGif(null);
  };

  const displayGif = customGif || gifUrl;

  return (
    <div style={{ marginBottom: 8 }}>
      <button className="visual-button" onClick={handleToggle} style={{ marginTop: 8, marginBottom: 0 }}>
        {show ? "Hide form demo" : "Show form demo"}
      </button>
      {show && (
        <div style={{ marginTop: 8 }}>
          {loading && <div style={{ textAlign: "center", padding: 16, color: "var(--text-muted)", fontSize: 13 }}>Loading...</div>}
          {displayGif && (
            <>
              <div style={{ borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden", background: "var(--input-bg)" }}>
                <img src={displayGif} alt={`${exerciseName} demo`} style={{ width: "100%", display: "block" }} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <button
                  className="visual-button"
                  style={{ marginTop: 0, flex: 1, fontSize: 12, padding: "8px 10px", color: "var(--accent)" }}
                  onClick={() => setShowSearch(p => !p)}
                >Wrong exercise? Search again</button>
                <button
                  className="visual-button"
                  style={{ marginTop: 0, flex: 0, fontSize: 12, padding: "8px 10px", color: "var(--danger)" }}
                  onClick={handleDismiss}
                >Dismiss</button>
              </div>
            </>
          )}
          {!loading && !displayGif && (
            <div style={{ textAlign: "center", padding: 12 }}>
              <div style={{ color: "var(--text-faint)", fontSize: 13, marginBottom: 8 }}>No demo found for this exercise</div>
              <button
                className="visual-button"
                style={{ marginTop: 0, fontSize: 12, color: "var(--accent)" }}
                onClick={() => setShowSearch(p => !p)}
              >Search manually</button>
            </div>
          )}
          {showSearch && (
            <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
              <input
                className="modal-input"
                style={{ flex: 1, fontSize: 13, padding: "10px 12px" }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="e.g. bicep curl, lat pulldown"
                onKeyDown={e => e.key === "Enter" && handleSearch()}
              />
              <button
                className="small-btn"
                style={{ padding: "10px 14px", background: "var(--accent)", color: "#fff", fontWeight: 700, borderRadius: 12 }}
                onClick={handleSearch}
                disabled={searching}
              >{searching ? "..." : "Go"}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExerciseModal({ selected, progress, labels, media, onChange, onChangeLabel, onChangeMedia, onClose }) {
  const [showMediaInput, setShowMediaInput] = useState(false);
  const { workoutId, exerciseName } = selected;
  const key = getExerciseKey(workoutId, exerciseName);
  const data = progress[key] || { weight: "", reps: "" };
  const labelEntry = labels ? labels[key] : null;
  const displayName = labelEntry && labelEntry.label && labelEntry.label.trim() ? labelEntry.label.trim() : exerciseName;
  const mediaEntry = media ? media[key] : null;
  const mediaUrl = mediaEntry?.url || "";
  const mediaButtonLabel = mediaUrl ? "Change / remove custom visual" : "Add a custom visual";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">{displayName}</div>
        <div className="modal-subtitle">Update your current numbers</div>

        <ExerciseGifPreview exerciseName={exerciseName} />

        <div className="modal-label">Exercise name</div>
        <input className="modal-input" value={displayName} onChange={(e) => onChangeLabel(workoutId, exerciseName, e.target.value)} placeholder={exerciseName} />

        <div className="modal-label">Weight / load</div>
        <input className="modal-input" value={data.weight} onChange={(e) => onChange(workoutId, exerciseName, "weight", e.target.value)} placeholder="e.g. 85 lb, band color, etc." />

        <div className="modal-label">Reps / notes</div>
        <textarea className="modal-input modal-input-multiline" value={data.reps} onChange={(e) => onChange(workoutId, exerciseName, "reps", e.target.value)} placeholder="e.g. 3\u00d78, last set hard, etc." />

        <button className="visual-button" onClick={() => setShowMediaInput((p) => !p)}>{mediaButtonLabel}</button>

        {showMediaInput && (
          <div style={{ marginTop: 6 }}>
            <div className="modal-label">Custom visual URL</div>
            <input className="visual-input" value={mediaUrl} onChange={(e) => onChangeMedia(workoutId, exerciseName, e.target.value)} placeholder="https://example.com/image-or-video" />
            <div className="media-hint">Override the auto demo with your own image or video link.</div>
          </div>
        )}

        <button className="modal-button" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

/* ===== MEDIA VIEW MODAL ===== */
function MediaModal({ selected, media, onClose }) {
  const { workoutId, exerciseName } = selected;
  const key = getExerciseKey(workoutId, exerciseName);
  const entry = media[key] || {};
  const url = entry.url || "";
  if (!url) return null;
  const isImage = /\.(png|jpe?g|gif|webp)$/i.test(url);

  return (
    <div className="media-overlay" onClick={onClose}>
      <div className="media-view-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Visual example</div>
        <div className="media-preview-box">
          {isImage ? <img src={url} alt="Exercise example" /> : (
            <div className="media-placeholder">This looks like a video or external link. Tap the button below to open it.</div>
          )}
        </div>
        {!isImage && (
          <button className="modal-button" onClick={() => window.open(url, "_blank")}>Open link</button>
        )}
        <button className="modal-button cancel" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/* ===== CATEGORY PICKER MODAL ===== */
function CategoryPickerModal({ category, workouts, onSelect, onClose }) {
  const label = category === "legs" ? "Legs" : category === "push" ? "Push" : "Pull";
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Pick a {label} workout</div>
        {(!workouts || !workouts.length) ? (
          <div className="modal-subtitle">No workouts found for this category.</div>
        ) : (
          <div className="modal-list">
            {workouts.map((item) => (
              <div className="category-item" key={item.id} onClick={() => onSelect(item.id)}>
                <div className="category-item-name">{item.name}</div>
                <div className="category-item-meta">{item.focus}</div>
              </div>
            ))}
          </div>
        )}
        <button className="modal-button" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

/* ===== EDIT EXERCISES MODAL ===== */
function EditExercisesModal({ workout, effectiveExercises, extras, removed, exerciseMeta, exerciseOptions, onAddExisting, onToggleRemove, onClose }) {
  const [filterType, setFilterType] = useState("all");
  const [filterMuscles, setFilterMuscles] = useState([]);
  const categoryHint = CATEGORY_MUSCLE_HINTS[workout.category] || "Tag muscles to keep things balanced.";
  const toggleMuscleFilter = (m) => setFilterMuscles((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);

  const filteredOptions = exerciseOptions.filter((opt) => {
    const isCoreExercise = (opt.muscles || []).includes("Core");
    if (opt.category !== workout.category && !isCoreExercise) return false;
    if (effectiveExercises.includes(opt.name)) return false;
    if (filterType !== "all" && opt.type !== filterType) return false;
    if (filterMuscles.length) {
      if (!opt.muscles || !opt.muscles.length) return false;
      if (!filterMuscles.every((m) => opt.muscles.includes(m))) return false;
    }
    return true;
  });

  const handleAddExisting = (name, type, muscles) => onAddExisting(workout.id, name, type, muscles, workout.category);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Edit exercises</div>
        <div className="modal-subtitle">{workout.name} {"\u2022"} {workout.category.toUpperCase()}</div>

        <div className="modal-label">Current exercises</div>
        <div className="modal-list">
          {effectiveExercises.map((item, index) => {
            const isCustom = extras.includes(item);
            const isRemoved = removed.includes(item);
            const key = getExerciseKey(workout.id, item);
            const meta = exerciseMeta ? exerciseMeta[key] : null;
            const typeLabel = meta?.type ? (meta.type === "compound" ? "Compound" : "Isolation") : isCustom ? "Custom" : "";
            const musclesLabel = meta?.muscles && meta.muscles.length ? meta.muscles.join(", ") : "";

            return (
              <div className="edit-row" key={`${workout.id}-edit-${index}`}>
                <div style={{ flex: 1 }}>
                  <div className={`edit-exercise-name ${isRemoved ? "removed" : ""}`}>{item}</div>
                  {(typeLabel || musclesLabel) && (
                    <div className="edit-exercise-meta">{typeLabel}{typeLabel && musclesLabel ? " \u2022 " : ""}{musclesLabel}</div>
                  )}
                </div>
                <button
                  className="small-btn-outline"
                  style={isRemoved && !isCustom ? { borderColor: "#B3261E", color: "#B3261E" } : {}}
                  onClick={() => onToggleRemove(workout.id, item, isCustom)}
                >
                  {isCustom ? "Delete" : isRemoved ? "Restore" : "Remove"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="modal-label">Add from saved exercises</div>
        <div className="modal-subtitle">{categoryHint}</div>

        <div className="type-row">
          <button className={`type-chip ${filterType === "all" ? "active" : ""}`} onClick={() => setFilterType("all")}>All</button>
          <button className={`type-chip ${filterType === "compound" ? "active" : ""}`} onClick={() => setFilterType("compound")}>Compound</button>
          <button className={`type-chip ${filterType === "isolation" ? "active" : ""}`} onClick={() => setFilterType("isolation")}>Isolation</button>
        </div>

        <div className="modal-label">Filter by muscles (optional)</div>
        <div className="muscle-grid">
          {ALL_MUSCLE_OPTIONS.map((m) => (
            <button key={m} className={`muscle-chip ${filterMuscles.includes(m) ? "active" : ""}`} onClick={() => toggleMuscleFilter(m)}>{m}</button>
          ))}
        </div>

        {filteredOptions.length === 0 ? (
          <div className="modal-subtitle">No saved exercises match this filter yet.</div>
        ) : (
          <div className="modal-list modal-list-short">
            {filteredOptions.map((item) => (
              <div className="add-row" key={`${workout.id}-opt-${item.name}`}>
                <div style={{ flex: 1 }}>
                  <div className="edit-exercise-name">{item.name}</div>
                  <div className="edit-exercise-meta">
                    {item.type === "compound" ? "Compound" : "Isolation"}
                    {item.muscles && item.muscles.length ? " \u2022 " + item.muscles.join(", ") : ""}
                  </div>
                </div>
                <button className="small-btn" onClick={() => handleAddExisting(item.name, item.type, item.muscles)}>Add</button>
              </div>
            ))}
          </div>
        )}

        <button className="modal-button" style={{ marginTop: 12 }} onClick={onClose}>Done editing</button>
      </div>
    </div>
  );
}

/* ===== ADD WORKOUT MODAL ===== */
function AddWorkoutModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [focus, setFocus] = useState("");
  const [category, setCategory] = useState("legs");
  const canSave = name.trim().length > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Add new workout</div>
        <div className="modal-subtitle">Start with a name and type. You can add exercises after this.</div>

        <div className="modal-label">Workout name</div>
        <input className="modal-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Push Day \u2013 Dumbbells" />

        <div className="modal-label">Focus (optional)</div>
        <input className="modal-input" value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. Chest + shoulders, etc." />

        <div className="modal-label">Category</div>
        <div className="type-row">
          <button className={`type-chip ${category === "legs" ? "active" : ""}`} onClick={() => setCategory("legs")}>Legs</button>
          <button className={`type-chip ${category === "push" ? "active" : ""}`} onClick={() => setCategory("push")}>Push</button>
          <button className={`type-chip ${category === "pull" ? "active" : ""}`} onClick={() => setCategory("pull")}>Pull</button>
        </div>

        <button className="modal-button" disabled={!canSave} onClick={() => onSave(name, focus, category)}>Save workout</button>
        <button className="modal-button cancel" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

/* ===== CREATE EXERCISE MODAL ===== */
function CreateExerciseModal({ workouts, onClose, onSave }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("legs");
  const [type, setType] = useState("compound");
  const [muscles, setMuscles] = useState([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(null);
  const toggleMuscle = (m) => setMuscles((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);
  const categoryWorkouts = workouts?.filter((w) => w.category === category) || [];
  const canSave = name.trim().length > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Create a new exercise</div>
        <div className="modal-subtitle">Save it to your library. Adding it to a workout is optional.</div>

        <div className="modal-label">Exercise name</div>
        <input className="modal-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cable row, Hip thrust" />

        <div className="modal-label">Category</div>
        <div className="type-row">
          <button className={`type-chip ${category === "legs" ? "active" : ""}`} onClick={() => setCategory("legs")}>Legs</button>
          <button className={`type-chip ${category === "push" ? "active" : ""}`} onClick={() => setCategory("push")}>Push</button>
          <button className={`type-chip ${category === "pull" ? "active" : ""}`} onClick={() => setCategory("pull")}>Pull</button>
        </div>

        <div className="modal-label">Type</div>
        <div className="type-row">
          <button className={`type-chip ${type === "compound" ? "active" : ""}`} onClick={() => setType("compound")}>Compound</button>
          <button className={`type-chip ${type === "isolation" ? "active" : ""}`} onClick={() => setType("isolation")}>Isolation</button>
        </div>

        <div className="modal-label">Muscles worked</div>
        <div className="muscle-grid">
          {ALL_MUSCLE_OPTIONS.map((m) => (
            <button key={m} className={`muscle-chip ${muscles.includes(m) ? "active" : ""}`} onClick={() => toggleMuscle(m)}>{m}</button>
          ))}
        </div>

        <div className="modal-label">Add to which workout? (optional)</div>
        {categoryWorkouts.length === 0 ? (
          <div className="modal-subtitle">No workouts for this category yet.</div>
        ) : (
          <div className="modal-list modal-list-xs">
            {categoryWorkouts.map((item) => {
              const sel = item.id === selectedWorkoutId;
              return (
                <div className={`category-item ${sel ? "selected" : ""}`} key={item.id} onClick={() => setSelectedWorkoutId(sel ? null : item.id)}>
                  <div className="category-item-name">{item.name}</div>
                  <div className="category-item-meta">{item.focus}</div>
                </div>
              );
            })}
          </div>
        )}

        <button className="modal-button" disabled={!canSave} onClick={() => onSave(selectedWorkoutId, name, type, muscles, category)}>Save exercise</button>
        <button className="modal-button cancel" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

/* ===== DELETE WORKOUT MODAL ===== */
function DeleteWorkoutModal({ workouts, onClose, onConfirmDelete }) {
  const [selectedId, setSelectedId] = useState(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => { setConfirming(false); }, [selectedId]);

  const selectedWorkout = workouts.find((w) => w.id === selectedId);

  const handleDeletePress = () => {
    if (!selectedWorkout) return;
    if (!confirming) { setConfirming(true); return; }
    onConfirmDelete(selectedWorkout.id);
  };

  const deleteButtonLabel = confirming ? "Yes, delete this workout you lazy bum" : "Delete selected workout";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Delete workouts</div>
        <div className="modal-subtitle">Select a workout, then delete it forever. Are you sure you want to permanently delete this workout you lazy bum?</div>

        {workouts.length === 0 ? (
          <div className="modal-subtitle">No workouts to delete.</div>
        ) : (
          <div className="modal-list">
            {workouts.map((item) => {
              const sel = item.id === selectedId;
              return (
                <div className={`category-item ${sel ? "selected" : ""}`} key={item.id} onClick={() => setSelectedId(sel ? null : item.id)}>
                  <div className="category-item-name">{item.name}</div>
                  <div className="category-item-meta">{item.focus}</div>
                </div>
              );
            })}
          </div>
        )}

        <button
          className={`modal-button ${confirming ? "danger" : ""}`}
          disabled={!selectedWorkout || !workouts.length}
          onClick={handleDeletePress}
        >{deleteButtonLabel}</button>
        <button className="modal-button cancel" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

/* ===== LIBRARY EXERCISE TAGGING MODAL ===== */
function LibraryExerciseModal({ exercise, onSave, onClose }) {
  const [category, setCategory] = useState(exercise.category || "legs");
  const [type, setType] = useState(exercise.type || "compound");
  const [muscles, setMuscles] = useState(exercise.muscles || []);
  const toggleMuscle = (m) => setMuscles((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{exercise.name}</div>
        <div className="modal-subtitle">Set tags so this exercise is easy to find when building workouts.</div>

        <div className="modal-label">Category</div>
        <div className="type-row">
          <button className={`type-chip ${category === "legs" ? "active" : ""}`} onClick={() => setCategory("legs")}>Legs</button>
          <button className={`type-chip ${category === "push" ? "active" : ""}`} onClick={() => setCategory("push")}>Push</button>
          <button className={`type-chip ${category === "pull" ? "active" : ""}`} onClick={() => setCategory("pull")}>Pull</button>
        </div>

        <div className="modal-label">Type</div>
        <div className="type-row">
          <button className={`type-chip ${type === "compound" ? "active" : ""}`} onClick={() => setType("compound")}>Compound</button>
          <button className={`type-chip ${type === "isolation" ? "active" : ""}`} onClick={() => setType("isolation")}>Isolation</button>
        </div>

        <div className="modal-label">Muscles worked</div>
        <div className="muscle-grid">
          {ALL_MUSCLE_OPTIONS.map((m) => (
            <button key={m} className={`muscle-chip ${muscles.includes(m) ? "active" : ""}`} onClick={() => toggleMuscle(m)}>{m}</button>
          ))}
        </div>

        <button className="modal-button" onClick={() => onSave(exercise.name, category, type, muscles)}>Save tags</button>
        <button className="modal-button cancel" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

/* ===== DELETE EXERCISE MODAL ===== */
function DeleteExerciseModal({ exerciseName, onConfirm, onClose }) {
  return (
    <div className="media-overlay" onClick={onClose}>
      <div className="media-view-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Delete exercise</div>
        <div className="modal-subtitle">
          Are you sure you want to permanently delete <strong>{exerciseName}</strong> everywhere, you lazy bum?
        </div>
        <button className="modal-button danger" onClick={onConfirm}>Yes, delete it</button>
        <button className="modal-button cancel" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
