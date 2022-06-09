import { getStories, getScenarioCount } from "/scripts/dbHandler.js?v=0.11";

const storyDiv = document.getElementById('stories');

LoadStoryMeny();

async function LoadStoryMeny() {

    const loadText = document.createElement('p');
    storyDiv.append(loadText);
    loadText.textContent = 'Loading unwritten stories...';

    const stories = await getStories();

    await Promise.all(stories.map(async (story) => {
        const count = await getScenarioCount(story.id);
        story.scenarioCount = count;
    }))

    stories.sort(function (a, b) {
        if (a.scenarioCount < b.scenarioCount) return 1;
        if (a.scenarioCount > b.scenarioCount) return -1;
        return 0;
    });

    stories.forEach(story => {
        AddStoryToMeny(story.data().title, story.data().description, story.id, story.scenarioCount);
    });

    loadText.remove();
}

async function AddStoryToMeny(title, description, id, scenarioCount) {

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
    scenarioCounter.textContent = ('(' + scenarioCount + ' scenarios)');
    menuItem.append(scenarioCounter);

    const startStoryButton = document.createElement('button');
    startStoryButton.textContent = 'Play this story';
    startStoryButton.className = 'startStoryButton';
    menuItem.append(startStoryButton);

    startStoryButton.onclick = () => {
        window.location.href = `/pages/play.html?v=0.11&storyCollectionID=${id}`;
    }
}