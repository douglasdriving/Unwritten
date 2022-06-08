import { CreateAccount, AttachToSignIn } from "/scripts/authHandler.js?v=0.11";

const emailField = document.getElementById('emailField');
const passwordField = document.getElementById('passwordField');
const displayNameField = document.getElementById('displayNameField');

const createAccountButton = document.getElementById('createAccountButton');
const errorText = document.getElementById('errorText');

AttachToSignIn(user => {
  if (user) window.location.href = '/pages/storyList.html?v=0.11';
})

Show(errorText, '', false);

createAccountButton.onclick = async () => {

  const email = emailField.value;
  const pw = passwordField.value;
  const displayName = displayNameField.value;

  if (email === '' || pw === '' || displayName === ''){
    Show(errorText, 'Please fill in all the fields', true);
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