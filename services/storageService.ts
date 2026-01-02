import { AppState } from "../types";

const STORAGE_PREFIX = "investTrack_v1_";

/**
 * Helper to get the specific key for a user to ensure data isolation.
 */
const getUserKey = (email: string) => `${STORAGE_PREFIX}${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

/**
 * Saves the application state to LocalStorage for the specific user.
 */
export const saveAppData = (email: string, data: AppState) => {
  if (!email) return;
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(getUserKey(email), serializedData);
  } catch (error) {
    console.error("Auto-save failed:", error);
  }
};

/**
 * Loads the application state from LocalStorage for the specific user.
 */
export const loadAppData = (email: string): AppState | null => {
  if (!email) return null;
  try {
    const serializedData = localStorage.getItem(getUserKey(email));
    if (!serializedData) return null;
    return JSON.parse(serializedData) as AppState;
  } catch (error) {
    console.error("Auto-restore failed:", error);
    return null;
  }
};