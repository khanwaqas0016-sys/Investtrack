import { AppState } from "../types";

/**
 * DEPRECATED: This service is no longer used.
 * The application uses LocalStorage for persistence.
 * See services/storageService.ts for the active implementation.
 */

export const saveUserData = async (userId: string, data: AppState) => {
  console.warn("saveUserData (Firestore) is deprecated. Use saveAppData (LocalStorage) instead.");
};

export const loadUserData = async (userId: string): Promise<AppState | null> => {
  console.warn("loadUserData (Firestore) is deprecated. Use loadAppData (LocalStorage) instead.");
  return null;
};