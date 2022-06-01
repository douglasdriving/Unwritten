import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyCuHFWH47mYRwBWEbPjRgkwJw55-ph7ft4",
  authDomain: "unwritten-19096.firebaseapp.com",
  projectId: "unwritten-19096",
  storageBucket: "unwritten-19096.appspot.com",
  messagingSenderId: "252249876749",
  appId: "1:252249876749:web:cd0c902d44154409b9a844",
  measurementId: "G-R0ED9C7TE4"
};

export function StartFirebase(){
  const app = initializeApp(firebaseConfig);
  return app;
}