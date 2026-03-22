const PROGRESS_KEY = "mmax_stream_progress";

/**
 * Structure of the progress object:
 * {
 *   [id]: {
 *     season: number,
 *     episode: number,
 *     progressPercent: number, // 0 to 100
 *     timeString: string,     // "28 of 71m"
 *     mediaType: "movie" | "tv",
 *     title: string,
 *     episodeName: string,
 *     timestamp: number       // saved at
 *   }
 * }
 */

export const getProgress = (id) => {
  const all = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
  return all[id] || null;
};

export const saveProgress = (id, data) => {
  const all = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
  all[id] = {
    ...all[id],
    ...data,
    timestamp: Date.now(),
  };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
};

export const getAllProgress = () => {
  const all = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
  // Sort by most recently watched
  return Object.values(all).sort((a, b) => b.timestamp - a.timestamp);
};

export const clearProgress = (id) => {
  const all = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
  delete all[id];
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
};
