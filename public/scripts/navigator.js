import { AttachToSignIn, Logout } from '/scripts/authHandler.js?v=0.11';
import { GetPlayerNotifications } from "/scripts/dbHandler.js?v=0.11";

//GENERAL NAV BAR
const navBar = document.createElement('div');
document.body.prepend(navBar);
navBar.className = 'inverted';

const homeButton = CreateNavButton('Home', '/index', navBar);
const aboutButton = CreateNavButton('About', '/pages/about', navBar);
const logInButton = CreateNavButton('Sign In', '/pages/login', navBar);

//TITLE
const title = document.createElement('h1');
document.body.prepend(title);
title.textContent = 'Unwritten';
title.style.textAlign = 'center';

//SIGNED IN BAR
const playerField = document.createElement('div');
navBar.append(playerField);

const divider = document.createElement('hr');
playerField.append(divider);

const loggedInText = document.createElement('p');
playerField.append(loggedInText);
loggedInText.textContent = 'Signed in as: ';
loggedInText.className = 'white';

const profileButtonsBlock = document.createElement('p');
playerField.append(profileButtonsBlock);

const storiesButton = CreateNavButton('Stories', '/pages/storyList', profileButtonsBlock);
const createStoryButton = CreateNavButton('Create Story', '/pages/creator', profileButtonsBlock);
const myTextsButton = CreateNavButton('My Texts', '/pages/profile', profileButtonsBlock);
const notificationsButton = CreateNavButton('Updated Branches', '/pages/notifications', profileButtonsBlock);

//const playButtons = [storiesButton, createStoryButton, myTextsButton, notificationsButton];

ShowProfileField(false);
loggedInText.style.display = 'none';

//FUNCTIONS
AttachToSignIn(user => {
  if (user) {
    SetLoginButton(true);
    ShowProfileField(true);
    loggedInText.style.display = 'block';
    loggedInText.textContent = 'Signed in as: ' + user.displayName;
    CheckForUpdates(user.uid);
  }
  else {
    SetLoginButton(false);
    ShowProfileField(false);
    loggedInText.textContent = 'Please sign in to start playing';
  }
})

function CreateNavButton(text, href, parent) {
  const button = document.createElement('button');
  button.textContent = text;
  parent.append(button);
  button.onclick = () => {
    window.location.href = href + '.html?v=0.11';
  }
  if (window.location.pathname !== (href + '.html')) button.className = 'paleButton';
  return button;
}
function SetLoginButton(isLoggedIn) {
  if (isLoggedIn) {
    logInButton.textContent = 'Sign Out';
    logInButton.onclick = () => {
      Logout();
      window.location.href = '/index.html?v=0.11'
    }
  }
  else {
    logInButton.textContent = 'Sign In';
    logInButton.onclick = () => {
      window.location.href = '/pages/login.html?v=0.11'
    }
  }
}
function ShowProfileField(show) {
  if (show) {
    // playButtons.forEach(button => { button.style.display = 'inline' })
    playerField.style.display = 'block';
  }
  else {
    // playButtons.forEach(button => { button.style.display = 'none' })
    playerField.style.display = 'none'
  }
} 
async function CheckForUpdates(playerId) {  
  const notifications = await GetPlayerNotifications(playerId);
  if (notifications.length > -1) {
    notificationsButton.textContent += ' (' + notifications.length + ')';
  }
}