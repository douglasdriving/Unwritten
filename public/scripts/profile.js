import { } from "/scripts/dbHandler.js?v=0.01"; //import functions for getting player branches
import { AttachToSignIn } from '/scripts/authHandler.js?v=0.01';

AttachToSignIn(user => { 
    if (user) document.getElementById('profileName').textContent = 'Profile for ' + user.email;
})