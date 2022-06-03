import { getStories, getScenarioCount, GetPlayerNotifications } from "/scripts/dbHandler.js?v=0.01";
import { AttachToSignIn, Logout } from '/scripts/authHandler.js?v=0.01';

const storyDiv = document.getElementById('stories');
const updatesButton = document.getElementById('updatesButton');

LoadStoryMeny();

AttachToSignIn(user => {
    if (user){
        document.getElementById('loggedInText').textContent = 'Logged in as: ' + user.email;
        CheckForUpdates(user.uid);
    } 
})

document.getElementById('signOutButton').onclick = () => {

    Logout();

}

document.getElementById('createStoryButton').onclick = () => {
    window.location.href = `/pages/creator.html?v=0.01`;
}

async function LoadStoryMeny() {

    const loadText = document.createElement('p');
    storyDiv.append(loadText);
    loadText.textContent = 'Loading unwritten stories...';

    const stories = await getStories();
    stories.forEach(story => {
        AddStoryToMeny(story.title, story.description, story.collection);
    });

    loadText.remove();
}

async function AddStoryToMeny(title, description, collectionID) {

    const count = await getScenarioCount(collectionID);

    const menuItem = document.createElement('div');
    menuItem.className = 'story';
    storyDiv.append(menuItem);

    const heading = document.createElement('h3');
    heading.textContent = title;
    heading.className = 'storyItemText';
    menuItem.append(heading);

    const descText = document.createElement('p');
    descText.className = 'storyItemText';
    descText.textContent = description;
    menuItem.append(descText);

    const scenarioCounter = document.createElement('p');
    scenarioCounter.className = 'storyItemText';
    scenarioCounter.textContent = ('(' + count + ' scenarios)');
    menuItem.append(scenarioCounter);

    const startStoryButton = document.createElement('button');
    startStoryButton.textContent = 'Play this story';
    startStoryButton.className = 'startStoryButton';
    menuItem.append(startStoryButton);

    startStoryButton.onclick = () => {
        window.location.href = `/pages/play.html?v=0.02&storyCollectionID=${collectionID}`;
    }
}

async function CheckForUpdates(playerId){

    const notifications = await GetPlayerNotifications(playerId);
    if (notifications.length > 0){
        updatesButton.textContent = 'Updates (' + notifications.length + ')';
        updatesButton.style.backgroundColor = 'green';
    }
    else{
        console.log('no updates');  
        console.log(notifications);
    }

}