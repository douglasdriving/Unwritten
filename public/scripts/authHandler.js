import { StartFirebase } from "/scripts/firebaseConfig.js?v=0.01";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js";

const app = StartFirebase();
const auth = getAuth(app);

export function AttachToSignIn(func) {

  onAuthStateChanged(auth, user => { func(user) })

  /*
  onAuthStateChanged(auth, (user) => {

    if (user) {
  
      const uid = user.uid;
      console.log('signed in');
      console.log(user.email)
      elem.dispatchEvent(userLoggedIn);
  
    }
    else {
  
      console.log('no user is signed in');
  
    }
  
  });
  */

}

export async function Login(email, pw) {

  return signInWithEmailAndPassword(auth, email, pw)
    .then(response => {
      return true;
    })
    .catch(err => {
      return false;
    })

}

export async function Logout() {

  console.log('starting sign out');

  signOut(auth).then(() => {
    console.log('user was signed out');
  }).catch((error) => {
    console.log('was not able to sign out');
    console.log(error);
  });

}

export async function CreateAccount(email, pw) {

  createUserWithEmailAndPassword(auth, email, pw)
    .then((userCredential) => {
      return true;
    })
    .catch((error) => {
      return false;
    });

}