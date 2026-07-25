import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCh4IFTdkb7krIe1fjyfzZHbGad3RcFupE",
  authDomain: "hackos-ae983.firebaseapp.com",
  projectId: "hackos-ae983",
  storageBucket: "hackos-ae983.firebasestorage.app",
  messagingSenderId: "780797425737",
  appId: "1:780797425737:web:d72bf531bbd23b8fb9e798",
  measurementId: "G-4FSHL95LJF"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };
