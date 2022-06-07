import { createNewStory } from "/scripts/dbHandler.js?v=0.11";

const creator = document.getElementById('creator');

const fields = [
  {
    heading: 'Title',
    description: 'The title of the story',
    maxChar: 25
  },
  {
    heading: 'Description',
    description: 'A short description of the story. Will be displayed on the front page',
    maxChar: 150
  },
  {
    heading: 'Introduction',
    description: 'An introduction to the universe in which the story takes place. Include information about the main character, the setting, the goal, etc.',
    maxChar: 1000
  },
  {
    heading: 'Initial Sceanario',
    description: 'The first thing that happens in the story. Players will react to this initial scenario by picking an action',
    maxChar: 300
  },
]

fields.forEach(field => {
  field.inputField = CreateInputArea(field.heading, field.description, field.maxChar);
})

document.getElementById('createButton').onclick = CreateStory;

function CreateInputArea(headingText, descriptionText, maxChars) {

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

  charCounter.className = 'charCounter';
  inputField.className = 'createStoryInputField';
  inputField.style.height = maxChars/3 + 'pt';
  const defaultFieldBorderColor = inputField.style.borderBlockColor;

  inputField.addEventListener('input',
    function CountChars() {

      let numOfEnteredChars = inputField.value.length;
      let counter = maxChars - numOfEnteredChars;
      charCounter.textContent = counter + " / " + maxChars;

      inputField.style.borderColor = defaultFieldBorderColor;

      if (numOfEnteredChars < 1) {
        charCounter.style.color = 'red';
        inputField.style.borderColor = 'red';
      }
      else if (counter > 10) {
        charCounter.style.color = '#382e2c';
      }
      else if (counter > 0) {
        charCounter.style.color = 'darkorange';
      } 
      else {
        charCounter.style.color = 'red';
        inputField.style.borderColor = 'red';
      }
    }
  );

  return inputField;
}

async function CreateStory() {

  let allReady = true;

  fields.forEach(field => {
    const charCount = field.inputField.value.length;
    if((charCount > field.maxChar) || (charCount <= 0)){
      allReady = false;
      field.inputField.style.borderColor = 'red';
    }
  })

  if (!allReady) {
    const errorMessage = document.createElement('p');
    errorMessage.textContent = '!Please control the number of characters in all fields!';
    errorMessage.style.color = 'red';
    creator.append(errorMessage);
    window.scrollTo(0, document.body.scrollHeight);
    return;
  }

  TryUpload();

  async function TryUpload() {

    creator.style.display = 'none';

    const statusText = document.createElement('p');
    statusText.textContent = "Please wait while your story is being added to Unwritten...";
    document.body.append(statusText);

    const storyCreationStatus = await createNewStory(fields[0].inputField.value, fields[1].inputField.value, fields[2].inputField.value, fields[3].inputField.value);

    const continueButton = document.createElement('button');
    document.body.append(continueButton);

    if (storyCreationStatus === -1) {
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

    if (storyCreationStatus === -2) {
      statusText.textContent = "There was an error in uploading your story. Please try again.";
      statusText.style.color = 'red';
      continueButton.textContent = 'Try uploading again';
      continueButton.onclick = () => {
        continueButton.remove();
        statusText.remove();
        TryUpload();
      }
      return;
    }

    statusText.textContent = "Your story was successfully added to Unwritten!";
    continueButton.textContent = 'Enter story';
    continueButton.onclick = () => {
      const storyId = fields[0].inputField.value.replace(/\s+/g, '');
      window.location.href = `/pages/play.html?v=0.11&storyCollectionID=${storyId}`;
    }

  }

}