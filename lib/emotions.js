// The three emoji live here and nowhere else: a screen renders the stored
// emotion verbatim, and only this module composes the string the provider sees.
const EMOJI = { happy: "😊", angry: "😠", sad: "😢" };

export const EMOTIONS = ["happy", "angry", "sad"]; // render order; EMOTIONS[0] is preselected
export const LEVELS = ["a bit", "quite", "very"]; // render order; LEVELS[1] is preselected
export const LEVELLED = ["angry", "sad"]; // the emotions that take a level

const invalid = (message) => {
  const error = new Error(message);
  error.status = 400;
  return error;
};

// The only validator in the feature. Seven strings are reachable and no eighth is.
export const buildHint = (emotion, level) => {
  if (!EMOTIONS.includes(emotion)) throw invalid("Unknown emotion");

  if (!LEVELLED.includes(emotion)) {
    if (level !== undefined) throw invalid(`${emotion} takes no level`);
    return `I am feeling ${emotion} ${EMOJI[emotion]}`;
  }

  if (!LEVELS.includes(level)) throw invalid("Unknown level");

  return `I am feeling ${level} ${emotion} ${EMOJI[emotion]}`;
};
