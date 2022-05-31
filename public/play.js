import { addAction, addScenario } from "/dbHandler.js?v=0.275";
import { getIntro, SetupData, GetNextScenario, GetCurrentActionOptions, SetScenario } from "/storyData.js?v=0.03";
import { GetScenarioExample, GetActionExample } from "/examples.js?v=0.01";

//BALANCING
const timeBetweenLetters = 15; //ms
const delayAfterPrintFinished = 500; //ms
const maxCharsAction = 80;
const maxCharsScenario = 300;

//DOC VARABLE DECLARATIONS
const storyBlock = document.getElementById('story');
const beginButton = document.getElementById('beginPlay');
const addContentBlock = document.getElementById('addContentBlock');
const tryAddContentButton = document.getElementById('tryAddContentButton');
const addContentTextField = document.getElementById('addContentTextField');
const addingContentBlock = document.getElementById('addingContent');
const addingContentStatusText = document.getElementById('addContentStatus');
const contentAddConfirmBlock = document.getElementById('contentAddConfirmBlock');
const keepPlayButton = document.getElementById('keepPlayButton');
const charCounter = document.getElementById('charCounter');

//SET WHAT TO SHOW AT START
keepPlayButton.style.display = 'none';
addingContentBlock.style.display = 'none';
addContentBlock.style.display = 'none';
document.getElementById("contentAddConfirmBlock").style.display = 'none';
SetIntroText();
beginButton.style.display = 'none';

//TRACKING VARIABLES
let currentScenarioID;
let startScenarioID = 'start';
let onEnterPress;
//let actionsTaken = [];
let contentIsBeingAdded = false;
let currentActionBlock;
let lastAButtonPressed;
let maxNumOfChars = maxCharsAction;

//ASSIGN BUTTONS AND EVENTS
beginButton.onclick = () => {
    lastAButtonPressed = beginButton;
    PlayScenario(GetNextScenario(), startScenarioID);
    beginButton.style.display = 'none';
}
document.addEventListener("keypress", event => {
    if (event.key != 'Enter') return;
    if (!onEnterPress) return;
    onEnterPress();
});
addContentTextField.addEventListener('input', CountCharacters);
const terminatePrint = new Event('terminatePrint');

//create a function that gets intro text and sets it in the game window.

const scenariosContainer = document.createElement('div');
storyBlock.append(scenariosContainer);

async function SetIntroText() {

    await SetupData();
    const text = getIntro();
    document.getElementById('ingress').textContent = text;
    beginButton.style.display = 'block';

}

function CountCharacters() {

    let numOfEnteredChars = addContentTextField.value.length;
    let counter = maxNumOfChars - numOfEnteredChars;
    charCounter.textContent = counter + " / " + maxNumOfChars;

    if (numOfEnteredChars < 1) {
        charCounter.style.color = 'transparent';
        tryAddContentButton.style.opacity = 0.3;
    }
    else if (counter > 10) {
        charCounter.style.color = 'black';
        tryAddContentButton.style.opacity = 1;
    }
    else if (counter > 0) {
        charCounter.style.color = 'darkorange';
        tryAddContentButton.style.opacity = 1;
    }
    else {
        charCounter.style.color = 'red';
        tryAddContentButton.style.opacity = 0.3;
    }

}

async function PlayScenario(scenarioData, scenarioID) {

    const scenario = scenarioData.text;
    currentScenarioID = scenarioID;

    //TryUnsubscribe();

    addContentBlock.style.display = 'none';

    ScrollDown();

    //setup termination tracking
    let printTerminated = false;
    addEventListener('terminatePrint', () => { printTerminated = true });

    //start the print!
    const scenarioTextBlock = document.createElement('div');
    scenarioTextBlock.className = 'scenarioText';
    let delayForNextLetter = 0;
    let printedText = '';

    Array.from(scenario).forEach(char => {
        setTimeout(() => {
            if (!scenarioTextBlock) return;
            if (printTerminated) scenarioTextBlock.remove();
            printedText += char;
            scenarioTextBlock.textContent = printedText;
            ScrollDown();
        }, delayForNextLetter);
        delayForNextLetter += timeBetweenLetters;
    })

    //Create the container
    const scenarioBlock = document.createElement('div');
    scenarioBlock.className = 'scenarioContainer';
    scenarioBlock.appendChild(scenarioTextBlock);
    scenariosContainer.appendChild(scenarioBlock);

    const actionBlock = document.createElement('div');
    currentActionBlock = actionBlock;
    scenarioBlock.appendChild(actionBlock);

    ScrollDown();

    //delay the addition of action window and content add window.
    const timeBeforePrintDone = Array.from(scenario).length * timeBetweenLetters;
    setTimeout(() => {
        if (printTerminated) return;
        LoadActionButtons(scenarioData.actions);
    }, timeBeforePrintDone + delayAfterPrintFinished);


}

function LoadActionButtons(actions) {

    if (actions) {
        actions.forEach((actionElement, actionID) => {
            CreateActionButton(actionElement, actionID);
        });
    }

    CreatePlusButton();
    ScrollDown();

    function CreatePlusButton() {
        if (contentIsBeingAdded) return;

        const plusButton = document.createElement('button');
        plusButton.className = 'plusButton';
        currentActionBlock.appendChild(plusButton);
        plusButton.textContent = '+';

        const scenarioIdForButton = currentScenarioID;
        const priorScenarios = Array.from(scenariosContainer.childNodes)

        plusButton.onclick = (() => {
            dispatchEvent(terminatePrint);
            if (plusButton.className != 'plusButton highlightedButton') {
                ActivateAddContentBlock('write a new action...', 'Add Action', 0);
                TryBacktrack(scenarioIdForButton, priorScenarios, plusButton.parentNode);
                SetHighlight(plusButton, true);
            }
            else {
                addContentBlock.style.display = 'none';
                SetHighlight(plusButton, false);
            }
        });
    }
}

function CreateActionButton(actionElement, actionID) {

    const actionButton = document.createElement('button');
    currentActionBlock.appendChild(actionButton);
    actionButton.className = 'actionButton';

    //const scenarioCount = actionElement.scenarioCount || 0;
    actionButton.textContent = actionElement.action; // + ` (${scenarioCount})`;

    //Assign onclick
    const scenarioIdForThisAction = currentScenarioID;
    const scenarioBlocksUpToThisAction = Array.from(scenariosContainer.childNodes);
    const scenarioBlock = currentActionBlock.parentNode;

    actionButton.onclick = (async () => {

        dispatchEvent(terminatePrint);

        if (contentIsBeingAdded) return;

        if (actionButton.className === 'actionButton highlightedButton') {

            TryBacktrack(scenarioIdForThisAction, scenarioBlocksUpToThisAction, actionButton.parentNode);
            addContentBlock.style.display = 'none';
            lastAButtonPressed = null;

            Array.from(actionButton.parentNode.childNodes).forEach(button => {

                const firstWord = button.className.split(' ')[0];
                if (firstWord === 'actionButton') button.className = 'actionButton';
                else if (firstWord === 'plusButton') button.className = 'plusButton';

            })

            return;
        }

        TryBacktrack(scenarioIdForThisAction, scenarioBlocksUpToThisAction, actionButton.parentNode);
        lastAButtonPressed = actionButton;
        TakeAction(actionElement, actionID, actionButton);
        SetHighlight(actionButton, true);
        
    });

    //return the button
    return actionButton;
}

function TryBacktrack(scenarioID, priorScenarios, actionBlock) {

    //simply delete all blocks that are beneath the one that was pressed?
    const scenarioContainer = actionBlock.parentNode;
    const allContainers = Array.from(scenarioContainer.parentNode.childNodes);
    const scenarioContainerId = allContainers.indexOf(scenarioContainer);
    for (let i=scenarioContainerId+1; i<allContainers.length; i++){
        console.log('deleting ' + allContainers[i]);
        allContainers[i].remove();
    }

    //then set the right "current scenario" in storyData
    SetScenario(scenarioID);
    /*
    const scenarioBlocksWhenClicking = Array.from(scenariosContainer.childNodes);
    if (scenarioBlocksWhenClicking.length === priorScenarios.length) return;

    console.log('backtracking');

    contentAddConfirmBlock.style.display = 'none';
    addingContentBlock.style.display = 'none';
    addContentTextField.value = '';

    scenarioBlocksWhenClicking.forEach(childElement => {
        if (!priorScenarios.includes(childElement))
            childElement.remove();
    });

    currentScenarioID = scenarioID;
    currentActionBlock = actionBlock;
    */

    //remove taken actions from the list
    /*
    actionsTaken.forEach((actionElement, i) => {
        if (actionElement.scenarioID === scenarioID)
            actionsTaken.splice(i + 1);
    });
    */

}

function TakeAction(actionElement, actionID) {

    //add action to the array -- PROBLEMATIC TO KEEP TRACK OF _ FIND OTHER SOLUTION
    /*
    actionsTaken.push({
        scenarioID: currentScenarioID,
        actionID: actionID
    })
    */

    //print scenario if there is one.

    //

    const nextScenario = GetNextScenario(actionID);
    if (nextScenario) PlayScenario(nextScenario, actionElement.scenarioID);
    else ReachEndpointAction(actionID);
}

function SetHighlight(button, highlight) {

    if (highlight) {
        button.parentNode.childNodes.forEach(bottonInBlock => {
            if (bottonInBlock.textContent === '+') bottonInBlock.className = 'plusButton';
            else bottonInBlock.className = 'actionButton';

            if (bottonInBlock === button) bottonInBlock.className += ' highlightedButton';
            else bottonInBlock.className += ' fadedButton';
        });

    }
    else {
        if (button.textContent === '+') button.className = 'plusButton';
        else button.className = 'actionButton';

        button.parentNode.childNodes.forEach(bottonInBlock => {
            if (bottonInBlock === button) return;
            if (bottonInBlock.textContent === '+') bottonInBlock.className = 'plusButton';
            else bottonInBlock.className = 'actionButton';
        });
    }

}

function ReshuffleActionButtons(block) {
    block.childNodes.forEach(button => {
        if (button.textContent === '+') block.append(button);
    });
}

async function TryAddNewContent(type, actionIndex) {

    //make sure there is a value in the input field
    const contentText = addContentTextField.value;
    if (contentText === '') {
        console.error('please write something in the text field!');
        return;
    }

    //make sure there aren't too many characters
    if (contentText.length > maxNumOfChars) {
        console.error('too many characters!');
        return;
    }

    //make sure type is correct
    if (type != 'action' && type != 'scenario') {
        console.error('type was defined inapropriately to: ' + type);
        return;
    }

    //hide out the add content and action window
    const tryAddContentFunction = onEnterPress;
    onEnterPress = null;
    addContentBlock.style.display = 'none';

    //show the confirm box
    const contentAddConfirmBlock = document.getElementById("contentAddConfirmBlock");
    contentAddConfirmBlock.style.display = 'block';
    const contentToConfirmText = document.getElementById('contentToConfirm')
    if (type === 'action') contentToConfirmText.textContent = `> ${contentText}`;
    else if (type === 'scenario') contentToConfirmText.textContent = `"${contentText}"`;
    ScrollDown();

    //assign dem buttons
    document.getElementById('addContentButton').onclick = () => {

        AddContent(type, contentAddConfirmBlock, contentText, actionIndex);

    }

    document.getElementById('editContentButton').onclick = () => {
        onEnterPress = tryAddContentFunction;
        addContentBlock.style.display = 'block';
        contentAddConfirmBlock.style.display = 'none';
    }
}

function AddContent(type, contentAddConfirmBlock, contentText, actionIndex) {

    ShowContentAddLoadText();
    //TryUnsubscribe();

    if (type === 'action') AddAction();
    else if (type === 'scenario') AddScenario();

    contentIsBeingAdded = true;

    function ShowContentAddLoadText() {

        contentAddConfirmBlock.style.display = 'none';
        addContentTextField.value = '';
        addingContentBlock.style.display = 'block';
        addingContentStatusText.textContent = 'Adding your content to Unwritten...';

    }

    async function AddAction() {
        addAction(currentScenarioID, contentText)
            .then(newActionID => {
                if (newActionID === -1) {
                    addingContentStatusText.textContent = 'ERROR - your action could not be added.';
                    return;
                }
                ConfirmContentAddition('action', contentText, null, newActionID);
                contentIsBeingAdded = false;
            });
    }

    async function AddScenario() {
        addScenario(contentText, currentScenarioID, actionIndex)
            .then(response => {

                if (response.status === -1) {
                    addingContentStatusText.textContent = 'Failed to add the scenario to Unwritten. Please try again.';
                    return;
                }

                if (response.status === -2) {
                    addingContentStatusText.textContent = 'Another player just added a scenario to this action! Keep playing to see what it was';
                    keepPlayButton.style.display = 'block';
                    keepPlayButton.onclick = () => {
                        PlayScenario(response.newDocID, -1);
                    };
                    return;
                }

                //updateContentCounters(actionsTaken);
                ConfirmContentAddition('scenario', contentText, response.newDocID, 0);
                contentIsBeingAdded = false;

            });
    }

}

function ConfirmContentAddition(type, contentText, newScenarioID, newActionID) {
    //confirm that it has been added succesfully
    addingContentStatusText.textContent = `The following ${type} was succesfully added to Unwritten:`;

    let addedContentText;
    if (type === 'scenario') addedContentText = `"${contentText}"`;
    else if (type === 'action') addedContentText = `> ${contentText}`;
    const addedContent = document.createElement('p');
    addedContent.textContent = addedContentText;
    addedContent.className = 'contentToConfirm';
    addingContentBlock.append(addedContent);

    //show button that allows you to keep on playing
    const continueButton = document.createElement('button');
    addingContentBlock.appendChild(continueButton);

    if (type === 'action') {
        continueButton.textContent = 'Keep playing with this action';
        continueButton.onclick = () => {
            hideAddContentBlock();
            const newActionElement = {
                scenarioCount: 0,
                action: contentText,
            }
            const actionButton = CreateActionButton(newActionElement, newActionID);
            SetHighlight(actionButton, true);
            ReshuffleActionButtons(actionButton.parentNode);
            TakeAction(newActionElement, newActionID, actionButton);
        }
    }
    else if (type === 'scenario') {
        continueButton.textContent = 'Keep playing this scenario';
        continueButton.onclick = () => {
            //IncreasePickedActionNumbers();
            hideAddContentBlock();
            PlayScenario(newScenarioID, lastAButtonPressed);
        }
    }

    function hideAddContentBlock() {
        addedContent.remove();
        addContentBlock.style.display = 'none';
        addingContentBlock.style.display = 'none';
        keepPlayButton.style.display = 'none';
        continueButton.remove();
    }

    ScrollDown();
}

function ReachEndpointAction(actionIndex) {
    ActivateAddContentBlock('What happens next?', 'Add Scenario', actionIndex);
    ScrollDown();
}

function ActivateAddContentBlock(instructionText, buttonText, actionIndex) {
    //show the block
    addContentTextField.placeholder = instructionText;
    addContentTextField.value = '';
    addContentBlock.style.display = 'block';
    tryAddContentButton.textContent = buttonText;

    //assign the "add" function to the button
    if (buttonText === 'Add Scenario') {
        addContentTextField.placeholder = `Write a new scenario. Example: "${GetScenarioExample()}"`
        maxNumOfChars = maxCharsScenario;
        CountCharacters();
        tryAddContentButton.onclick = () => { TryAddNewContent('scenario', actionIndex); }
        onEnterPress = () => { TryAddNewContent('scenario', actionIndex); };
    }
    else if (buttonText === 'Add Action') {
        addContentTextField.placeholder = `Write a new action. Example: "${GetActionExample()}"`
        maxNumOfChars = maxCharsAction;
        CountCharacters();
        tryAddContentButton.onclick = () => { TryAddNewContent('action', -1); }
        onEnterPress = () => { TryAddNewContent('action', -1); };
    }
    else {
        console.error('cant assign a function to the "add content" button because the text was not assigned correctly.');
        onEnterPress = null;
    }

    addContentTextField.style.height = maxNumOfChars * 250 / window.innerWidth + 'px';

    //TryUnsubscribe();
    ScrollDown();
}

function ScrollDown() {
    window.scrollTo(0, document.body.scrollHeight);
}