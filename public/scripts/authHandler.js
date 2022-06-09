import { StartFirebase } from "/scripts/firebaseConfig.js?v=0.11";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js";

const app = StartFirebase();
const auth = getAuth(app);
let currentPlayerId;

AttachToSignIn(user => {
  if (user) {
    currentPlayerId = user.uid;

    //Check for now - remove later when oxxar is updated
    if (currentPlayerId === 'nquBcfPUEoQPFpzaOsep3DwFInt1') {
      ChangePlayerDisplayName('Oxxar');
    }
  }
  else {
    currentPlayerId = '';
  }
})

export function AttachToSignIn(func) {

  onAuthStateChanged(auth, user => { func(user) })

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
export async function CreateAccount(email, pw, displayName) {
  createUserWithEmailAndPassword(auth, email, pw)
    .then(async (userCredential) => {
      await ChangePlayerDisplayName(displayName);
      return true;
    })
    .catch((error) => {
      return false;
    });
}
export function GetCurrentPlayerId() {
  return currentPlayerId;
}
export async function ChangePlayerDisplayName(newName) {
  await updateProfile(auth.currentUser, {
    displayName: newName
  })
}
export function GetPlayerDisplayName(id) {
  const user = auth.currentUser;
  let dispName;
  if (user !== null) {
    user.providerData.forEach((profile) => {
      dispName = profile.displayName;
    });
  }
  return dispName;
}