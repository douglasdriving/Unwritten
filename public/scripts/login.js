const userNameField = document.getElementById('userNameField');
const passwordField = document.getElementById('passwordField');
const loginButton = document.getElementById('loginButton');

loginButton.onclick = () => {

  const username = userNameField.value;
  const password = passwordField.value;

  //Validate Input
  if (!onlyLettersAndNumbers(username)){
    console.error('username can only include numbers and letters'); //show msg in window instead
    return;
  }
  if (!lengthIsBetween(username, 6, 20)){
    console.error('username must contain 6-20 characters');
    return;
  }
  if (!onlyLettersAndNumbers(password)){
    console.error('password can only include numbers and letters');
    return;
  }
  if (!lengthIsBetween(password, 8, 20)){
    console.error('password must contain 8-20 characters');
    return;
  }

  //

  console.log('logged in successfully! :)');

  function onlyLettersAndNumbers(str) {
    return /^[A-Za-z0-9]*$/.test(str);
  }

  function lengthIsBetween(str, min, max){
    if (str.length < min) return false;
    if (str.length > max) return false;
    return true;
  }

}