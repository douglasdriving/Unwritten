import { Login } from "/scripts/authHandler.js?v=0.02";

const emailField = document.getElementById('emailField');
const passwordField = document.getElementById('passwordField');
const loginButton = document.getElementById('loginButton');
const loginErrorText = document.getElementById('loginErrorText');

const pwError = document.getElementById('passwordError');
const usernameError = document.getElementById('usernameError');

Show(loginErrorText, '', false);

loginButton.onclick = async () => {

  const email = emailField.value;
  const pw = passwordField.value;

  const loginSuccess = await Login(email, pw);
  
  if (loginSuccess){
    window.location.href = '/pages/hub.html?v=0.01';
  }
  else{
    Show(loginErrorText, 'Wrong username or password!', true);
  }

  //Validate Input
  /*
  let loginFailed = false;

  if (!onlyLettersAndNumbers(email)){
    Show(usernameError, 'username can only include numbers and letters', true);
    loginFailed = true;
  }
  if (!lengthIsBetween(email, 6, 20)){
    Show(usernameError, 'username must contain 6-20 characters', true);
    loginFailed = true;
  }
  if (!onlyLettersAndNumbers(password)){
    Show(pwError, 'password can only include numbers and letters', true);
    loginFailed = true;
  }
  if (!lengthIsBetween(password, 8, 20)){
    Show(pwError, 'password must contain 8-20 characters', true);
    loginFailed = true;
  }

  if (loginFailed) return;

  Show(usernameError, '', false);
  Show(pwError, '', false);

  console.log('logged in successfully! :)');

  function onlyLettersAndNumbers(str) {
    return /^[A-Za-z0-9]*$/.test(str);
  }

  function lengthIsBetween(str, min, max){
    if (str.length < min) return false;
    if (str.length > max) return false;
    return true;
  }
  */

}

function Show(element, text, show) {
  element.textContent = text;
  if (show) element.style.display = 'block';
  else element.style.display = 'none';
}