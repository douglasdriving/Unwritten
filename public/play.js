import { getScenario, addAction, addScenario, monitorScenario, tryUnsubscribe } from "/dbHandler.js?v=0.24";

//DOC VARABLE DECLARATIONS
const storyBlock = document.getElementById('story');
const beginButton = document.getElementById('beginPlay');
const actionBlock = document.getElementById('actionBlock');
const actionButtonBlock = document.getElementById('actionButtons');
const addContentBlock = document.getElementById('addContentBlock');
const addContentButton = document.getElementById('addContentButton');
const addContentTextField = document.getElementById('addContentTextField');
const addingContentBlock = document.getElementById('addingContent');
const addingContentStatusText = document.getElementById('addContentStatus');
const replayButton = document.getElementById('replayButton');
const keepPlayButton = document.getElementById('keepPlayButton');

//SET WHAT TO SHOW AT START
actionBlock.style.display = 'none';
replayButton.style.display = 'none';
keepPlayButton.style.display = 'none';
addingContentBlock.style.display = 'none';
addContentBlock.style.display = 'none';

//TRACKING VARIABLES
let currentScenarioID;
let startScenarioID = 'start';
let onEnterPress;

//ASSIGN BUTTON FUNCTIONS
beginButton.onclick = () => {
    playScenario(startScenarioID);
    replayButton.style.display = 'block';
}
replayButton.onclick = () => { window.location.href = 'play.html'; }

document.addEventListener("keypress", event => {
    if (event.key != 'Enter') return;
    if (!onEnterPress) return;
    onEnterPress();
});

async function playScenario(ID) {
    tryUnsubscribe();
    beginButton.style.display = 'none';
    const scenarioTextBlock = print('scenario loading...')
    const scenarioData = await getScenario(ID);

    if (!scenarioData) {
        const statusMessage = document.createElement('div');
        statusMessage.textContent = 'Error: Could not find the next scenario. Please try again';
        statusMessage.style.color = "red";
        storyBlock.append(statusMessage);
        return;
    }

    const scenarioText = scenarioData.text;
    scenarioTextBlock.textContent = scenarioText;
    currentScenarioID = ID;
    displayExistingActions(scenarioData.actions);
    activateAddContentBlock('write a new action...', 'Add Action', 0);
}

function displayExistingActions(scenarioActions) {
    clearActions();

    if (!scenarioActions) {
        addContentTextField.placeholder = 'What do you want to do?';
        return;
    }

    actionBlock.style.display = 'block';

    //CREATE ACTION BUTTONS
    scenarioActions.forEach((element, actionID) => {
        const actionButton = document.createElement('button');
        actionButtonBlock.appendChild(actionButton);
        actionButton.textContent = element.action;
        const nextScenarioID = element.scenarioID;

        actionButton.onclick = (() => {
            clearActions();
            print(`> ${element.action}`);
            if (nextScenarioID) playScenario(nextScenarioID);
            else reachEndpointAction(actionID);
        });
    });
}

async function tryAddNewAction() {
    const actionText = addContentTextField.value;
    if (actionText === '') {
        console.error('please write something in the text field!')
        return;
    }
    onEnterPress = null;

    //display a load text
    addContentTextField.value = '';
    addContentBlock.style.display = 'none';
    clearActions();
    addingContentBlock.style.display = 'block';
    addingContentStatusText.textContent = 'Adding your action to Unwritten...'
    tryUnsubscribe();

    //add the action to the database
    addAction(currentScenarioID, actionText)
        .then(newActionID => {
            if (newActionID === -1) {
                addingContentStatusText.textContent = 'ERROR - your action could not be added.'
                return;
            }
            confirmContentAddition('action', actionText, null, newActionID);
        })
}

async function tryAddNewScenario(actionIndex) {
    const scenarioText = addContentTextField.value;

    if (scenarioText === '') {
        console.error('please write something in the text field');
        return
    }

    onEnterPress = null;
    tryUnsubscribe();
    clearActions();

    addContentBlock.style.display = 'none';
    addContentTextField.value = '';
    addingContentBlock.style.display = 'block';
    addingContentStatusText.textContent = 'Adding your scenario to Unwritten...'

    addScenario(scenarioText, currentScenarioID, actionIndex)
        .then(response => {
            if (response.status === -1) {
                addingContentStatusText.textContent = 'Failed to add the scenario to Unwritten. Please try again.';
                return;
            }
            if (response.status === -2) {
                addingContentStatusText.textContent = 'Another player just added a scenario to this action! Keep playing to see what it was';
                keepPlayButton.style.display = 'block';
                keepPlayButton.onclick = () => {
                    playScenario(response.newDocID);
                }
                return;
            }
            confirmContentAddition('scenario', scenarioText, response.newDocID, 0);
            clearActions();
        })
}

function confirmContentAddition(type, contentText, newScenarioID, newActionID) {
    //confirm that it has been added succesfully
    let confirmationText;
    confirmationText = `The following ${type} was succesfully added to Unwritten:`;
    if (type === 'scenario') confirmationText += `\r\n\r\n"${contentText}"`;
    else if (type === 'action') confirmationText += `\r\n\r\n> ${contentText}`;
    addingContentStatusText.textContent = confirmationText

    //show button that allows you to keep on playing
    const continueButton = document.createElement('button');
    addingContentBlock.appendChild(continueButton);

    if (type === 'action') {
        continueButton.textContent = 'Keep playing with this action';
        continueButton.onclick = () => {
            hideAddContentBlock();
            print(`> ${contentText}`);
            reachEndpointAction(newActionID)
        }
    }
    else if (type === 'scenario') {
        continueButton.textContent = 'Keep playing this scenario';
        continueButton.onclick = () => {
            hideAddContentBlock();
            playScenario(newScenarioID);
        }
    }

    function hideAddContentBlock() {
        addContentBlock.style.display = 'none';
        addingContentBlock.style.display = 'none';
        keepPlayButton.style.display = 'none';
        continueButton.remove();
    }
}

function reachEndpointAction(actionIndex) {
    clearActions();
    activateAddContentBlock('What happens next?', 'Add Scenario', actionIndex);
}

function activateAddContentBlock(instructionText, buttonText, actionIndex) {
    //show the block
    addContentTextField.placeholder = instructionText;
    addContentBlock.style.display = 'block';
    addContentButton.textContent = buttonText;

    //assign the "add" function to the button
    if (buttonText === 'Add Scenario') {
        addContentTextField.style.height = '36pt';
        addContentButton.onclick = () => { tryAddNewScenario(actionIndex); }
        onEnterPress = () => { tryAddNewScenario(actionIndex) };
    }
    else if (buttonText === 'Add Action') {
        addContentTextField.style.height = '12pt';
        addContentButton.onclick = () => { tryAddNewAction(); }
        onEnterPress = () => { tryAddNewAction() };
    }
    else {
        console.error('cant assign a function to the "add content" button because the text was not assigned correctly.');
        onEnterPress = null;
    }

    //start to monitor the scenario
    tryUnsubscribe();
    startScenarioMonitoring(actionIndex, buttonText);
}

async function startScenarioMonitoring(actionIndex, contentType) {
    if (contentType != 'Add Scenario' && contentType != 'Add Action') {
        console.error('content type text set incorrectly. Cannot monitor. it was set to: ' + contentType);
        return;
    }

    const monitorSucceeded = monitorScenario(currentScenarioID, updatedData => {
        if (contentType === 'Add Scenario') onScenarioUpdate(updatedData);
        else if (contentType === 'Add Action') onActionUpdate(updatedData);
    })

    if (!monitorSucceeded) {
        console.error('the monitoring was unable to start');
    }

    async function onScenarioUpdate(updatedData) {

        const newScenarioID = updatedData.actions[actionIndex].scenarioID;
        if (!newScenarioID) return;

        clearActions();
        tryUnsubscribe();

        addContentBlock.style.display = 'none';
        addingContentBlock.style.display = 'block';
        addingContentStatusText.textContent = '!Someone else just added a scenario here!';

        //add a button to keep playing
        const button = document.createElement('button');
        button.textContent = 'Show scenario and keep playing';
        addingContentBlock.appendChild(button);
        button.onclick = () => {
            playScenario(newScenarioID);
            button.remove();
            addingContentBlock.style.display = 'none';
        }

    }

    function onActionUpdate(updatedData) {
        addContentTextField.placeholder = '..or add your own action';
        displayExistingActions(updatedData.actions, currentScenarioID);
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