import { CreateAccount, AttachToSignIn } from "/scripts/authHandler.js?v=0.11";

const emailField = document.getElementById('emailField');
const passwordField = document.getElementById('passwordField');
const displayNameField = document.getElementById('displayNameField');

const displayNameError = document.getElementById('displayNameError');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');

const createAccountButton = document.getElementById('createAccountButton');
const errorText = document.getElementById('errorText');

// AttachToSignIn(user => {
//   if (user) window.location.href = '/pages/storyList.html?v=0.11';
// })

Show(errorText, '', false);

displayNameField.addEventListener('input', () => {
  SetError(displayNameError, displayNameField, DisplayNameHasError());
});
passwordField.addEventListener('input', () => {
  SetError(passwordError, passwordField, PasswordHasError());
});
emailField.addEventListener('input', () => {
  SetError(emailError, emailField, EmailHasError());
});

createAccountButton.onclick = async () => {

  const email = emailField.value;
  const pw = passwordField.value;
  const displayName = displayNameField.value;

  if (EmailHasError() || PasswordHasError() || DisplayNameHasError()){
    Show(errorText, 'Form contains errors. Please check all fields', true);
    return;
  }

  //show a load text!!!
  const loadText = document.createElement('p');
  loadText.textContent = 'Creating account, please wait...';
  document.body.append(loadText);
  document.getElementById('content').style.display = 'none';

  let response = await CreateAccount(email, pw, displayName);
  console.log(response);
}
function Show(element, text, show) {
  element.textContent = text;
  if (show) element.style.display = 'block';
  else element.style.display = 'none';
}

function SetError(errorElement, inputField, errorMessage){
  if (errorMessage){
    errorElement.style.display = 'block';
    errorElement.textContent = errorMessage;
    inputField.style.color = 'red';
  }
  else{
    errorElement.style.display = 'none';
    inputField.style.color = 'black';
  }
}

function TextHasError(text, maxLength, minLength, spacesAllowed, onlyLettersAndNumbers){

  if (text.length > maxLength) return 'Cannot contain more than ' + maxLength + ' characters';
  else if (text.length < minLength) return 'Must contain at least ' + minLength + ' characters';
  else if (!spacesAllowed && text.includes(' ')) return 'Cannot contain spaces';
  else if (onlyLettersAndNumbers && !/^[A-Za-z0-9]*$/.test(text)) return 'Can only contain letters and numbers';
  else return false;

}
function DisplayNameHasError(){
  return TextHasError(displayNameField.value, 20, 6, false, true);
}
function EmailHasError(){
  return TextHasError(emailField.value, 100, 1, false, false);
}
function PasswordHasError(){
  return TextHasError(passwordField.value, 20, 8, false, false);
}