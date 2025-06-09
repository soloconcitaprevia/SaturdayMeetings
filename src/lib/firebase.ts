
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// TODO: Replace with your app's Firebase project configuration
// You can find this in your Firebase project settings:
// Project settings > General > Your apps > Web app > Firebase SDK snippet > Config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // REPLACE THIS
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com", // REPLACE THIS
  projectId: "YOUR_PROJECT_ID", // REPLACE THIS
  storageBucket: "YOUR_PROJECT_ID.appspot.com", // REPLACE THIS
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // REPLACE THIS
  appId: "YOUR_APP_ID", // REPLACE THIS
  measurementId: "YOUR_MEASUREMENT_ID" // Optional: REPLACE THIS
};

let app: FirebaseApp;
let db: Firestore;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

db = getFirestore(app);

export { db, app };
