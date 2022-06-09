import { CreateAccount, AttachToSignIn } from "/scripts/authHandler.js?v=0.11";

const emailField = document.getElementById('emailField');
const passwordField = document.getElementById('passwordField');
const displayNameField = document.getElementById('displayNameField');

const displayNameError = document.getElementById('displayNameError');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');

const createAccountButton = document.getElementById('createAccountButton');
const errorText = document.getElementById('errorText');

AttachToSignIn(user => {
  if (user) window.location.href = '/pages/storyList.html?v=0.11';
})

Show(errorText, '', false);

displayNameField.addEventListener('input', SetDisplayNameError);
passwordError.addEventListener('input', SetEmailError);
emailError.addEventListener('input', SetPasswordError);

createAccountButton.onclick = async () => {

  const email = emailField.value;
  const pw = passwordField.value;
  const displayName = displayNameField.value;

  if (EmailHasError() || PasswordHasError() || DisplayNameHasError()){
    Show(errorText, 'Form contains errors. Please check all fields', true);
    return;
  }

  const createAccountSuccess = await CreateAccount(email, pw, displayName);

  if (!createAccountSuccess){
    Show(errorText, 'User could not be created, please check to make sure that email and password is in the correct format', true);
  }

}
function Show(element, text, show) {
  element.textContent = text;
  if (show) element.style.display = 'block';
  else element.style.display = 'none';
}
function TextHasError(text, maxLength, minLength, spacesAllowed, onlyLettersAndNumbers){

  if (text.length > maxLength) return 'Text cannot contain more than ' + maxLength + ' characters';
  else if (text.length < minLength) return 'Text must contain at least ' + minLength + ' characters';
  else if (!spacesAllowed && text.includes(' ')) return 'Text cannot contain spaces';
  else if (onlyLettersAndNumbers && !/^[A-Za-z0-9]*$/.test(text)) return 'Text can only contain letters and numbers';
  else return false;

}

function SetDisplayNameError() {

  const textError = DisplayNameHasError();
  if (textError){
    displayNameError.style.display = 'block';
    displayNameError.textContent = textError;
    displayNameField.style.color = 'red';
  }
  else{
    displayNameError.style.display = 'none';
    displayNameField.style.color = 'black';
  }

}
function SetEmailError() {

  const textError = EmailHasError();
  if (textError){
    displayNameError.style.display = 'block';
    displayNameError.textContent = textError;
    displayNameField.style.color = 'red';
  }
  else{
    displayNameError.style.display = 'none';
    displayNameField.style.color = 'black';
  }

}
function SetDisplayNameError() {

  const textError = DisplayNameHasError();
  if (textError){
    displayNameError.style.display = 'block';
    displayNameError.textContent = textError;
    displayNameField.style.color = 'red';
  }
  else{
    displayNameError.style.display = 'none';
    displayNameField.style.color = 'black';
  }

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