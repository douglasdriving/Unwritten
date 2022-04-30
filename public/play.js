import { getScenario, addAction, addScenario, monitorScenario } from "/dbHandler.js?v=0.2";

const storyBlock = document.getElementById('story');
const beginButton = document.getElementById('beginPlay');

const actionBlock = document.getElementById('actionBlock');
const actionButtonBlock = document.getElementById('actionButtons');

const addContentBlock = document.getElementById('addContentBlock');
const addContentButton = document.getElementById('addContentButton');
const addContentTextField = document.getElementById('addContentTextField');
const addContentInstruction = document.getElementById('addContentInstruction');

const addingContentBlock = document.getElementById('addingContent');
const addingContentStatusText = document.getElementById('addContentStatus');

const replayButton = document.getElementById('replayButton');
const keepPlayButton = document.getElementById('keepPlayButton');

actionBlock.style.display = 'none';
replayButton.style.display = 'none';
keepPlayButton.style.display = 'none';
addingContentBlock.style.display = 'none';
addContentBlock.style.display = 'none';

beginButton.onclick = () => { playScenario('start'); }
replayButton.onclick = () => { window.location.href = 'play.html'; }

let unsubscribe;

async function playScenario(scenarioID) {
    beginButton.style.display = 'none';

    const scenarioTextBlock = print('scenario loading...')
    const scenarioData = await getScenario(scenarioID);
    const scenarioText = scenarioData.text;
    scenarioTextBlock.textContent = scenarioText;

    tryDisplayActions(scenarioData.actions, scenarioID);
}

function tryDisplayActions(scenarioActions, scenarioID) {

    if (!scenarioActions) {
        displayAddActionSection(scenarioID, 'What do you want to do?');
        return;
    }

    actionBlock.style.display = 'block';

    scenarioActions.forEach((element, actionIndex) => {
        const actionButton = document.createElement('button');
        actionButtonBlock.appendChild(actionButton);
        actionButton.textContent = element.action;
        const nextScenarioID = element.scenarioID;

        actionButton.onclick = (() => {
            clearActions();
            print(`> ${element.action}`);
            if (nextScenarioID) playScenario(nextScenarioID);
            else reachEndpointAction(scenarioID, actionIndex);
        });
    });

    displayAddActionSection(scenarioID, '...or write your own action and create a new branch in the story');
}

function displayAddActionSection(scenarioID, instructionText) {
    addContentBlock.style.display = 'block';
    addContentInstruction.textContent = instructionText;
    addContentButton.textContent = 'Add Action';
    addContentButton.onclick = () => {
        const actionText = addContentTextField.value;

        if (actionText != '') {
            addContentBlock.style.display = 'none';
            tryAddNewAction(actionText, scenarioID);
        }
        else {
            console.log('please write something in the text field');
            //change to an error shown in the game
        }

    }
}

async function tryAddNewAction(actionText, scenarioID) {
    //display a load text
    addContentTextField.value = '';
    addContentBlock.style.display = 'none';
    clearActions();
    addingContentBlock.style.display = 'block';
    addingContentStatusText.textContent = 'Adding your action to Unwritten...'

    //add the action to the database
    addAction(scenarioID, actionText)
        .then(newActionID => {
            confirmContentAddition('action', actionText, scenarioID, newActionID);
        })
}

function confirmContentAddition(type, contentText, scenarioID, newActionID) {
    //confirm that it has been added succesfully
    addingContentStatusText.textContent = `The following ${type} was succesfully added to Unwritten: "${contentText}"`;

    //show restart button
    replayButton.style.display = 'block';

    //show button that allows you to keep on playing
    keepPlayButton.style.display = 'block';
    keepPlayButton.onclick = () => {

        addContentBlock.style.display = 'none';
        addingContentBlock.style.display = 'none';
        replayButton.style.display = 'none';
        keepPlayButton.style.display = 'none';

        if (type === 'action') {
            print(`> ${contentText}`);
            reachEndpointAction(scenarioID, newActionID)
        }
        else if (type === 'scenario') {
            playScenario(scenarioID);
        }

    }
}

function reachEndpointAction(scenarioID, actionIndex) {
    clearActions();
    addContentBlock.style.display = 'block';
    addContentInstruction.textContent = 'What happens next?';
    addContentButton.textContent = 'Add Scenario';
    addContentButton.onclick = () => { tryAddNewScenario(scenarioID, actionIndex); }

    //start to monitor the scenario
    unsubscribe = monitorScenario(scenarioID, async updatedData => {
        //check if someone else adds a scenario here (i.e. the scenario is updated with a scenario attached to the action index)
        const newScenarioID = updatedData.actions[actionIndex].scenarioID
        if (!newScenarioID) return; //the data was updated in some other way

        //- inform the player
        addContentBlock.style.display = 'none'
        addingContentBlock.style.display = 'block'
        addingContentStatusText.textContent = 'Someone else just added a scenario to this action: ';
        getScenario()
            .then(newScenarioData => {
                addingContentStatusText.textContent += ('"' + newScenarioData.text + '"');
            })

        //- add a button to show the newly added scenario
    });
    //remember to unsubscribe after the player has successfully added a new scenario
}

async function tryAddNewScenario(scenarioID, actionIndex) {
    const scenarioText = addContentTextField.value;

    if (scenarioText != '') {
        addContentBlock.style.display = 'none';
        addContentTextField.value = '';
        addingContentBlock.style.display = 'block';
        addingContentStatusText.textContent = 'Adding your scenario to Unwritten...'

        addScenario(scenarioText, scenarioID, actionIndex)
            .then(newScenarioDoc => {
                confirmContentAddition('scenario', scenarioText, newScenarioDoc.id, 0);
            })
    }
    else {
        console.log('please write something in the text field');
        //change to an error shown in the game
    }
}

function clearActions() {
    actionButtonBlock.textContent = '';
    actionBlock.style.display = 'none';
}

function print(text) {
    const scenarioTextBlock = document.createElement('div');
    scenarioTextBlock.textContent = text;
    storyBlock.appendChild(scenarioTextBlock);
    storyBlock.appendChild(document.createElement('br'));
    return scenarioTextBlock;
}