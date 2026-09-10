// js/db.js

export const EXERCISES_DB = [
  { id: 1, name: "Pecho plano c/barra", group: "Pecho", images: ["gifs/pecho plano con barra.gif"] },
  { id: 2, name: "Pecho inclinado c/máquina", group: "Pecho", images: ["gifs/pecho inclinado con maquina.gif"] },
  { id: 3, name: "Jalón dorsal T. abierto", group: "Espalda", images: ["gifs/jalon dorsal t. abierto.gif"] },
  { id: 4, name: "Plaq espalda", group: "Espalda", images: ["gifs/maquina espalda.gif"] },
  { id: 5, name: "Camilla cuádriceps", group: "Piernas", images: ["gifs/camilla cuadriceps.gif"] },
  { id: 6, name: "Camilla isquio", group: "Piernas", images: ["gifs/camilla isquio.gif"] },
  { id: 7, name: "Prensa + gemelos", group: "Piernas", images: ["gifs/press pierna.jpg"] },
  { id: 8, name: "Extensiones", group: "Piernas", images: ["gifs/camilla cuadriceps.gif"] },
  { id: 9, name: "Posterior hombros", group: "Hombros", images: ["gifs/posterior hombros 01.gif"] },
  { id: 10, name: "Tríceps P. alta barra", group: "Tríceps", images: ["gifs/triceps parte alta barra 01.gif"] },
  { id: 11, name: "Tríceps patada burro", group: "Tríceps", images: ["gifs/triceps patada burro 01.gif"] },
  { id: 12, name: "Bíceps P. bajo c/barra", group: "Bíceps", images: ["gifs/biceps parte baja con barra 01.gif"] },
  { id: 13, name: "Hack frontal", group: "Piernas", images: ["gifs/hack frontal 01.gif"] },
  { id: 14, name: "Hip thrust", group: "Glúteos", images: ["gifs/hip thrust 01.gif"] },
  { id: 15, name: "Polea c/barra V y P. alto", group: "Espalda", images: ["gifs/pullover en polea alta 01.gif"] },
  { id: 16, name: "Semiflexo c/máquina", group: "Piernas", images: ["gifs/camilla isquio.gif"] },
  { id: 17, name: "Apertura c/poleas", group: "Pecho", images: ["gifs/apertura con poleas 01.gif"] },
  { id: 18, name: "Bíceps martillo", group: "Bíceps", images: ["gifs/biceps martillo.gif"] },
  { id: 19, name: "Caminadora (Cardio)", group: "Cardio", images: ["gifs/Caminadora (Cardio).gif"] },
  { id: 20, name: "Bicicleta fija", group: "Cardio", images: ["gifs/default.gif"] },
  { id: 21, name: "Serrucho c/mancuerna", group: "Bíceps", images: ["gifs/default.gif"] },
  { id: 22, name: "Pullover en polea alta", group: "Espalda", images: ["gifs/default.gif"] },
  { id: 23, name: "Hip Thrust", group: "Piernas", images: ["gifs/default.gif"] }
];

export const DEFAULT_ROUTINES = [
  { id: 1, name: "Día 1", exercises: [{ exerciseId: 1, sets: 3, reps: 12, weight: "" }, { exerciseId: 2, sets: 3, reps: 12, weight: "" }] },
  { id: 2, name: "Día 2", exercises: [{ exerciseId: 3, sets: 3, reps: 12, weight: "" }, { exerciseId: 4, sets: 3, reps: 12, weight: "" }] },
  { id: 3, name: "Día 3", exercises: [{ exerciseId: 5, sets: 3, reps: 12, weight: "" }, { exerciseId: 6, sets: 3, reps: 12, weight: "" }] },
  { id: 4, name: "Día 4", exercises: [{ exerciseId: 9, sets: 3, reps: 12, weight: "" }, { exerciseId: 10, sets: 3, reps: 12, weight: "" }] },
  { id: 5, name: "Día 5", exercises: [{ exerciseId: 12, sets: 3, reps: 12, weight: "" }, { exerciseId: 14, sets: 3, reps: 12, weight: "" }] },
  { id: 6, name: "Día 6", exercises: [{ exerciseId: 19, sets: 1, reps: 0, time: "20 min", weight: "", speed: 8, incline: 2 }] }
];

export const DEFAULT_REST_SECONDS = 60;

export function getExercises() {
  return EXERCISES_DB;
}

export function getExerciseById(id) {
  return EXERCISES_DB.find(ex => ex.id === id);
}