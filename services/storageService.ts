import { AppState } from "../types";

const STORAGE_PREFIX = "investTrack_data_";

// Helper to get the specific key for a user
const getKey = (userId: string) => `${STORAGE_PREFIX}${userId}`;

/**
 * Saves the entire application state to LocalStorage under the user's UID.
 * This works fully offline.
 */
export const saveAppData = (userId: string, data: AppState) => {
  if (!userId) return;
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(getKey(userId), serializedData);
  } catch (error) {
    console.error("Error saving data locally:", error);
  }
};

/**
 * Loads the application state from LocalStorage for a specific user.
 * Returns null if no data exists.
 */
export const loadAppData = (userId: string): AppState | null => {
  if (!userId) return null;
  try {
    const serializedData = localStorage.getItem(getKey(userId));
    if (!serializedData) return null;
    
    return JSON.parse(serializedData) as AppState;
  } catch (error) {
    console.error("Error loading data locally:", error);
    return null;
  }
};

/**
 * Checks if we have data for a specific user
 */
export const hasLocalData = (userId: string): boolean => {
  return !!localStorage.getItem(getKey(userId));
};
