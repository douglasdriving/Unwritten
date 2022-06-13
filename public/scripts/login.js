import { Login, AttachToSignIn } from "/scripts/authHandler.js?v=0.11";

const emailField = document.getElementById('emailField');
const passwordField = document.getElementById('passwordField');
const loginButton = document.getElementById('loginButton');
const loginErrorText = document.getElementById('loginErrorText');
let isLogginIn = false;

//SETUP PAGE
document.getElementById('loginLoadText').style.display = 'none';
AttachToSignIn(user => {
  if (user) window.location.href = '/pages/storyList.html?v=0.11';
})
Show(loginErrorText, '', false);
loginButton.onclick = () => { TryLogin(); }
document.addEventListener("keydown", (event) => {
  if (event.key === "Enter") { TryLogin(); }
})

//FUNCTIONS
function Show(element, text, show) {
  element.textContent = text;
  if (show) element.style.display = 'block';
  else element.style.display = 'none';
}
async function TryLogin() {

  if (isLogginIn) return;
  
  isLogginIn = true;
  document.getElementById('loginControls').style.display = 'none';
  document.getElementById('loginLoadText').style.display = 'block';

  const email = emailField.value;
  const pw = passwordField.value;

  const loginSuccess = await Login(email, pw);

  if (!loginSuccess) {
    Show(loginErrorText, 'Wrong email or password!', true);
    isLogginIn = false;
    document.getElementById('loginControls').style.display = 'block';
    document.getElementById('loginLoadText').style.display = 'none';
  }
}
