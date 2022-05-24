import { createNewStory } from "/dbHandler.js?v=0.01";

const creator = document.getElementById('creator');

const maxCharTitle = 25;
const maxCharDescription = 150;
const maxCharIntroduction = 1000;
const maxCharInitialScenario = 300;

const titleField = CreateInputArea('Title', 'The title of the story', maxCharTitle);
const descriptionField = CreateInputArea('Description', 'A short description of the story. Will be displayed on the front page', maxCharDescription);
const introductionField = CreateInputArea('Introduction', 'An introduction to the universe in which the story takes place. Include information about the main character, the setting, the goal, etc.', maxCharIntroduction);
const initialScenarioField = CreateInputArea('Initial scenario', 'The first thing that happens in the story. Players will react to this initial scenario by picking an action', maxCharInitialScenario);

document.getElementById('createButton').onclick = CreateStory;

function CreateInputArea(headingText, descriptionText, maxChars, fieldRef) {

  const area = document.createElement('div');
  const heading = document.createElement('h3');
  const description = document.createElement('p');
  const inputField = document.createElement('textarea');
  const charCounter = document.createElement('p');

  heading.textContent = headingText;
  description.textContent = descriptionText;
  charCounter.textContent = '0 / ' + maxChars;

  document.getElementById('form').append(area);
  area.append(heading);
  area.append(description);
  area.append(inputField);
  area.append(charCounter);

  charCounter.style.color = 'transparent';

  inputField.addEventListener('input',
    function CountChars() {

      let numOfEnteredChars = inputField.value.length;
      let counter = maxChars - numOfEnteredChars;
      charCounter.textContent = counter + " / " + maxChars;

      if (numOfEnteredChars < 1) {
        charCounter.style.color = 'transparent';
      }
      else if (counter > 10) {
        charCounter.style.color = 'black';
      }
      else if (counter > 0) {
        charCounter.style.color = 'darkorange';
      }
      else {
        charCounter.style.color = 'red';
      }
    }
  );

  return inputField;
}

async function CreateStory() {

  let allReady = true;

  const title = titleField.value;
  const description = descriptionField.value;
  const introduction = introductionField.value;
  const initialScenario = initialScenarioField.value

  if (title.length > maxCharTitle) allReady = false;
  if (description.length > maxCharDescription) allReady = false;
  if (initialScenario.length > maxCharInitialScenario) allReady = false;
  if (introduction.length > maxCharIntroduction) allReady = false;

  if (title.length <= 0) allReady = false;
  if (description.length <= 0) allReady = false;
  if (initialScenario.length <= 0) allReady = false;
  if (introduction.length <= 0) allReady = false;

  if (!allReady) {
    const errorMessage = document.createElement('p');
    errorMessage.textContent = '!Please control the number of characters in all fields!';
    errorMessage.style.color = 'red';
    creator.append(errorMessage);
    window.scrollTo(0, document.body.scrollHeight);
    return;
  }

  creator.style.display = 'none';

  const statusText = document.createElement('p');
  statusText.textContent = "Please wait while your story is being added to Unwritten...";
  document.body.append(statusText);

  const storyCreationStatus = await createNewStory(titleField.value, descriptionField.value, introductionField.value, initialScenarioField.value);
  console.log('story creation status:');
  console.log(storyCreationStatus);

  const continueButton = document.createElement('button');
  document.body.append(continueButton);

  if (storyCreationStatus === -1){
    statusText.textContent = "A story with that name already exists.";
    statusText.style.color = 'red';
    continueButton.textContent = 'Go back to edit story';
    continueButton.onclick = () => {
      creator.style.display = 'block';
      continueButton.remove();
      statusText.remove();
    }
    return;
  }

  statusText.textContent = "Your story was successfully added to Unwritten!";
  continueButton.textContent = 'Enter story';
  continueButton.onclick = () => {
    window.location.href = `/play.html?v=0.01&storyCollectionID=${titleField.value}`;
  }

}