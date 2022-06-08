import { AttachToSignIn, Logout } from '/scripts/authHandler.js?v=0.11';
import { GetPlayerNotifications } from "/scripts/dbHandler.js?v=0.11";

const navBar = document.createElement('div');
document.body.prepend(navBar);

const homeButton = CreateNavButton('Home', '/index');
const storiesButton = CreateNavButton('Stories', '/pages/storyList');
const createStoryButton = CreateNavButton('Create Story', '/pages/creator');
const myTextsButton = CreateNavButton('My Texts', '/pages/profile');
const notificationsButton = CreateNavButton('Updated Branches', '/pages/notifications');
const logInButton = CreateNavButton('Sign In', '/pages/login');

const loggedInText = document.createElement('p');
navBar.append(loggedInText);
loggedInText.textContent = 'Signed in as: ';

const playButtons = [storiesButton, createStoryButton, myTextsButton, notificationsButton];

AttachToSignIn(user => {
  if (user) {
    SetLoginButton(true);
    ShowPlayButtons(true);
    loggedInText.style.display = 'block';
    loggedInText.textContent = 'Signed in as: ' + user.displayName;
    CheckForUpdates(user.uid);
  }
  else {
    SetLoginButton(false);
    ShowPlayButtons(false);
    loggedInText.style.display = 'none';
  }
})

function CreateNavButton(text, href) {
  const button = document.createElement('button');
  button.textContent = text;
  navBar.append(button);
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
function ShowPlayButtons(show) {
  if (show) {
    playButtons.forEach(button => { button.style.display = 'inline' })
  }
  else {
    playButtons.forEach(button => { button.style.display = 'none' })
  }
} 
async function CheckForUpdates(playerId) {  
  const notifications = await GetPlayerNotifications(playerId);
  if (notifications.length > -1) {
    notificationsButton.textContent += ' (' + notifications.length + ')';
  }
}