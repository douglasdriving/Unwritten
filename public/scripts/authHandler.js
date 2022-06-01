import { StartFirebase } from "/scripts/firebaseConfig.js?v=0.01";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js";

const app = StartFirebase();
const auth = getAuth(app);



export function AttachToSignIn(func){

  onAuthStateChanged(auth, user => {func(user)})

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