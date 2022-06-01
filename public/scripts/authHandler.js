import { StartFirebase } from "/scripts/firebaseConfig.js?v=0.01";
import {
  getAuth,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js";

const app = StartFirebase();
const auth = getAuth(app);

export async function Login(email, pw) {

  return signInWithEmailAndPassword(auth, email, pw)
    .then(response => {
      return true;
    })
    .catch(err => {
      return false;
    })

}