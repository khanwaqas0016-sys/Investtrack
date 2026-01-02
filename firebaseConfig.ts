// Modular Firebase v9 initialization
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD2cLmes77a_MnxkQBJKSs8TOmFyGJg2RQ",
  authDomain: "mobile-investment-6752c.firebaseapp.com",
  projectId: "mobile-investment-6752c",
  storageBucket: "mobile-investment-6752c.firebasestorage.app",
  messagingSenderId: "268897303544",
  appId: "1:268897303544:web:70e4fe6224f1fb29a5740d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;