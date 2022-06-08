import { getStories, getScenarioCount, GetPlayerNotifications } from "/scripts/dbHandler.js?v=0.11";
import { AttachToSignIn, Logout } from '/scripts/authHandler.js?v=0.11';

const storyDiv = document.getElementById('stories');

LoadStoryMeny();

async function LoadStoryMeny() {

    const loadText = document.createElement('p');
    storyDiv.append(loadText);
    loadText.textContent = 'Loading unwritten stories...';

    const stories = await getStories();
    stories.forEach(story => {
        AddStoryToMeny(story.data().title, story.data().description, story.id);
    });

    loadText.remove();
}

async function AddStoryToMeny(title, description, id) {

    const count = await getScenarioCount(id);

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
        window.location.href = `/pages/play.html?v=0.11&storyCollectionID=${id}`;
    }
}