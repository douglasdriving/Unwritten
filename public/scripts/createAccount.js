import { CreateAccount, AttachToSignIn } from "/scripts/authHandler.js?v=0.02";

const emailField = document.getElementById('emailField');
const passwordField = document.getElementById('passwordField');
const createAccountButton = document.getElementById('createAccountButton');
const errorText = document.getElementById('errorText');

AttachToSignIn(user => {
  if (user) window.location.href = '/pages/hub.html?v=0.01';
})

Show(errorText, '', false);

createAccountButton.onclick = async () => {

  const email = emailField.value;
  const pw = passwordField.value;

  const createAccountSuccess = await CreateAccount(email, pw);

  if (!createAccountSuccess){
    Show(errorText, 'User could not be created, please check to make sure that email and password is in the correct format', true);
  }

}
function Show(element, text, show) {
  element.textContent = text;
  if (show) element.style.display = 'block';
  else element.style.display = 'none';
}