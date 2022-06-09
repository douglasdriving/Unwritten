import { getStories, getScenarioCount } from "/scripts/dbHandler.js?v=0.11";

const storyDiv = document.getElementById('stories');

LoadStoryMeny();

async function LoadStoryMeny() {

    const loadText = DisplayLoadText();
    const stories = await GetSortedStories();
    stories.forEach(story => {
        AddStoryToMeny(story.data().title, story.data().description, story.id, story.scenarioCount);
    });
    loadText.remove();

    function DisplayLoadText() {
        const loadText = document.createElement('p');
        storyDiv.append(loadText);
        loadText.textContent = 'Loading unwritten stories...';
        return loadText;
    }

    async function GetSortedStories() {
        const stories = await getStories();

        await Promise.all(stories.map(async (story) => {
            const count = await getScenarioCount(story.id);
            story.scenarioCount = count;
        }));

        stories.sort(function (a, b) {
            if (a.scenarioCount < b.scenarioCount)
                return 1;
            if (a.scenarioCount > b.scenarioCount)
                return -1;
            return 0;
        });
        return stories;
    }
}

async function AddStoryToMeny(title, description, id, scenarioCount) {

    const menuItem = document.createElement('div');
    menuItem.className = 'story';
    storyDiv.append(menuItem);
    CreateRow('h3', title, 'storyItemText');
    CreateRow('p', description, 'storyItemText');
    CreateRow('p', `(${scenarioCount} scenarios)`, 'storyItemText');
    const startStoryButton = CreateRow('button', 'Play this story', 'startStoryButton');
    startStoryButton.onclick = () => {
        window.location.href = `/pages/play.html?v=0.11&storyCollectionID=${id}`;
    }

    function CreateRow(type, text, className) {
        const element = document.createElement(type);
        element.textContent = text;
        element.className = className;
        menuItem.append(element);
        return element;
    }
}