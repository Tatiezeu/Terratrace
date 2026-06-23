/**
 * Client-side local state caching utility.
 * Saves query results to localStorage with a timestamp to enable
 * the stale-while-revalidate pattern for instant page transitions.
 */

export const getCachedData = (key) => {
  try {
    const item = localStorage.getItem(`cache_${key}`);
    if (!item) return undefined;
    const { data, timestamp } = JSON.parse(item);
    return { data, timestamp };
  } catch (e) {
    console.warn(`[Cache] Failed to parse cache for key ${key}:`, e);
    return undefined;
  }
};

export const setCachedData = (key, data) => {
  try {
    if (data === undefined || data === null) return;
    const item = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(`cache_${key}`, JSON.stringify(item));
  } catch (e) {
    console.warn(`[Cache] Failed to write cache for key ${key}:`, e);
  }
};

export const clearCachedData = (key) => {
  try {
    localStorage.removeItem(`cache_${key}`);
  } catch (e) {
    console.warn(`[Cache] Failed to clear cache for key ${key}:`, e);
  }
};
