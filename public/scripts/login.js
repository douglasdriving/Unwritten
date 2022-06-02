import { Login, AttachToSignIn } from "/scripts/authHandler.js?v=0.03";

const emailField = document.getElementById('emailField');
const passwordField = document.getElementById('passwordField');
const loginButton = document.getElementById('loginButton');
const loginErrorText = document.getElementById('loginErrorText');

const pwError = document.getElementById('passwordError');
const usernameError = document.getElementById('usernameError');

AttachToSignIn(user => {
  if (user) window.location.href = '/pages/hub.html?v=0.01';
})

Show(loginErrorText, '', false);

loginButton.onclick = async () => {

  const email = emailField.value;
  const pw = passwordField.value;

  const loginSuccess = await Login(email, pw);
  
  if (!loginSuccess){
    Show(loginErrorText, 'Wrong email or password!', true);
  }

}

function Show(element, text, show) {
  element.textContent = text;
  if (show) element.style.display = 'block';
  else element.style.display = 'none';
}