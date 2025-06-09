
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase project configuration provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyAYF6My8gAdwM-Ia86C-pgIp7lSNGmjOzA",
  authDomain: "parent-meeting-booking.firebaseapp.com",
  projectId: "parent-meeting-booking",
  storageBucket: "parent-meeting-booking.firebasestorage.app", // Corrected from .appspot.com if necessary, usually .appspot.com is for default bucket
  messagingSenderId: "163896530776",
  appId: "1:163896530776:web:cfe72657d5a38db757b72d"
  // measurementId is optional, so it's fine if not provided
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
