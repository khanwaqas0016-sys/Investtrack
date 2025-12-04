import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { AppState } from "../types";

const COLLECTION_NAME = "users";

/**
 * Saves the entire application state to Firestore under the user's UID.
 * This overwrites the existing data in the 'appData' field to ensure synchronization.
 * 
 * Call this function whenever the critical app state (customers, investments, payments) changes.
 */
export const saveUserData = async (userId: string, data: AppState) => {
  if (!userId) return;
  
  try {
    const userDocRef = doc(db, COLLECTION_NAME, userId);
    
    // Firestore throws an error if it encounters 'undefined'.
    // We sanitize the data by stripping out undefined fields using JSON serialization.
    // This is safe because your dates are stored as strings.
    const sanitizedData = JSON.parse(JSON.stringify(data));

    // Storing data inside a field 'appData' keeps the document structure clean
    await setDoc(userDocRef, { appData: sanitizedData }, { merge: true });
  } catch (error) {
    console.error("Error saving data to cloud:", error);
  }
};

/**
 * Loads the application state from Firestore for a specific user.
 * Returns null if no data exists.
 */
export const loadUserData = async (userId: string): Promise<AppState | null> => {
  if (!userId) return null;

  try {
    const userDocRef = doc(db, COLLECTION_NAME, userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      return docSnap.data().appData as AppState;
    }
    return null;
  } catch (error) {
    console.error("Error loading data from cloud:", error);
    return null;
  }
};