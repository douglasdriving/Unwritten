import { getScenario, addAction, addScenario, monitorScenario, tryUnsubscribe as TryUnsubscribe, updateContentCounters } from "/dbHandler.js?v=0.271";
import { GetScenarioExample, GetActionExample } from "/examples.js?v=0.01";

//BALANCING
const timeBetweenLetters = 40; //ms
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

//TRACKING VARIABLES
let currentScenarioID;
let startScenarioID = 'start';
let onEnterPress;
let actionsTaken = [];
let contentIsBeingAdded = false;
let currentActionBlock;
let lastActionPressed;
let maxNumOfChars = maxCharsAction;

//ASSIGN BUTTON FUNCTIONS
beginButton.onclick = () => {
    lastActionPressed = beginButton;
    PlayScenario(startScenarioID, beginButton);
    beginButton.style.display = 'none';
}

document.addEventListener("keypress", event => {
    if (event.key != 'Enter') return;
    if (!onEnterPress) return;
    onEnterPress();
});

addContentTextField.addEventListener('input', CountCharacters);

function CountCharacters() {

    let numOfEnteredChars = addContentTextField.value.length;
    let counter = maxNumOfChars - numOfEnteredChars;
    charCounter.textContent = counter + " / " + maxNumOfChars;

    if (numOfEnteredChars < 1){
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

async function PlayScenario(scenarioID, actionButtonThatLeadToThisScenario) {

    TryUnsubscribe();

    addContentBlock.style.display = 'none';

    const loadText = document.createElement('div');
    loadText.textContent = 'Scenario loading...'
    storyBlock.appendChild(loadText);

    ScrollDown();

    const scenarioData = await getScenario(scenarioID);
    loadText.remove();

    if (!scenarioData) {
        const statusMessage = document.createElement('div');
        statusMessage.textContent = 'Error: Could not find the next scenario. Please try again';
        statusMessage.style.color = "red";
        storyBlock.append(statusMessage);
        return;
    }

    currentScenarioID = scenarioID;

    //start the print!
    const scenarioTextBlock = document.createElement('div');
    scenarioTextBlock.className = 'printedAction';
    storyBlock.appendChild(scenarioTextBlock);

    let delayForNextLetter = 0;
    let printedText = '';
    let printTerminated = false;

    Array.from(scenarioData.text).forEach(char => {
        setTimeout(() => {
            if (printTerminated) return;
            if (actionButtonThatLeadToThisScenario !== lastActionPressed) {
                scenarioTextBlock.remove();
                printTerminated = true;
                return;
            }
            printedText += char;
            scenarioTextBlock.textContent = printedText;
        }, delayForNextLetter);
        delayForNextLetter += timeBetweenLetters;
    })

    //Create the container
    const scenarioBlock = document.createElement('div');
    scenarioBlock.className = 'scenarioContainer';
    scenarioTextBlock.className = 'scenarioText';
    scenarioBlock.appendChild(scenarioTextBlock);
    const actionBlock = document.createElement('div');
    currentActionBlock = actionBlock;
    scenarioBlock.appendChild(actionBlock);

    //put it together
    storyBlock.appendChild(scenarioBlock);
    ScrollDown();

    //delay the addition of action window and content add window. //PROBLEMATIC IF YOU CHOOSE DO SO SOMETHING MID_PRINT
    const timeBeforePrintDone = Array.from(scenarioData.text).length * timeBetweenLetters;
    setTimeout(() => {

        if (actionButtonThatLeadToThisScenario !== lastActionPressed) return;

        LoadActionButtons(scenarioData.actions);
        ActivateAddContentBlock('write a new action...', 'Add Action', 0);

    }, timeBeforePrintDone + delayAfterPrintFinished);
}

function LoadActionButtons(actions) {

    //CREATE ACTION BUTTONS
    if (!actions) {
        addContentTextField.placeholder = 'What do you want to do?';
        return;
    }

    actions.forEach((actionElement, actionID) => {
        CreateActionButton(actionElement, actionID);
    });

    ScrollDown();
}

function CreateActionButton(actionElement, actionID) {

    //create the element
    const actionButton = document.createElement('button');
    currentActionBlock.appendChild(actionButton);
    actionButton.className = 'actionButton';

    const scenarioCount = actionElement.scenarioCount || 0;
    actionButton.textContent = actionElement.action + ` (${scenarioCount})`;

    //Assign onclick
    const scenarioIdForThisAction = currentScenarioID;
    const scenarioBlocksUpToThisAction = Array.from(storyBlock.childNodes);

    actionButton.onclick = (() => {

        if (contentIsBeingAdded) return;

        lastActionPressed = actionButton;
        TakeAction(actionElement, actionID, actionButton);
        currentActionBlock = actionButton.parentNode;
        TryBacktrack();
        function TryBacktrack() {
            const scenarioBlocksWhenClicking = Array.from(storyBlock.childNodes);
            if (scenarioBlocksWhenClicking.length === scenarioBlocksUpToThisAction.length)
                return;

            contentAddConfirmBlock.style.display = 'none';
            addingContentBlock.style.display = 'none';
            //addContentBlock.style.display = 'none';
            addContentTextField.value = '';

            scenarioBlocksWhenClicking.forEach(childElement => {
                if (!scenarioBlocksUpToThisAction.includes(childElement))
                    childElement.remove();
            });

            currentScenarioID = scenarioIdForThisAction;

            //remove taken actions from the list
            actionsTaken.forEach((actionElement, i) => {
                if (actionElement.scenarioID === scenarioIdForThisAction)
                    actionsTaken.splice(i + 1);
            });
        }
    });

    //create an action block if it doesnt exist


    //return the button
    return actionButton;
}

function TakeAction(actionElement, actionID, actionButton) {

    //add action to the array -- PROBLEMATIC TO KEEP TRACK OF _ FIND OTHER SOLUTION
    actionsTaken.push({
        scenarioID: currentScenarioID,
        actionID: actionID
    })

    //print scenario if there is one.
    if (actionElement.scenarioID) PlayScenario(actionElement.scenarioID, actionButton);
    else ReachEndpointAction(actionID);

    //set button highlighting
    actionButton.className = 'highlightedActionButton';
    actionButton.parentNode.childNodes.forEach(button => {

        if (button === actionButton) return;
        if (button.className === 'fadedActionButton') return;
        button.className = 'fadedActionButton';

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
    TryUnsubscribe();

    if (type === 'action') AddAction();
    else if (type === 'scenario') AddScenario();

    contentIsBeingAdded = true;

    function ShowContentAddLoadText() {

        contentAddConfirmBlock.style.display = 'none';
        addContentTextField.value = '';
        addingContentBlock.style.display = 'block';
        addingContentBlock.style.backgroundColor = 'lightgrey';
        addingContentBlock.style.bordercolor = 'grey';
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

                updateContentCounters(actionsTaken);
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

    addingContentBlock.style.backgroundColor = 'rgb(181, 227, 181)';
    addingContentBlock.style.bordercolor = 'rgb(118, 149, 118)';

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
            TakeAction(newActionElement, newActionID, actionButton);
        }
    }
    else if (type === 'scenario') {
        continueButton.textContent = 'Keep playing this scenario';
        continueButton.onclick = () => {
            hideAddContentBlock();
            PlayScenario(newScenarioID, lastActionPressed);
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
    addContentBlock.style.display = 'block';
    tryAddContentButton.textContent = buttonText;

    //assign the "add" function to the button
    if (buttonText === 'Add Scenario') {
        addContentTextField.placeholder = `Write a new scenario. Example: "${GetScenarioExample()}"`
        maxNumOfChars = maxCharsScenario;
        CountCharacters();
        addContentBlock.style.height = '90pt';
        tryAddContentButton.onclick = () => { TryAddNewContent('scenario', actionIndex); }
        onEnterPress = () => { TryAddNewContent('scenario', actionIndex); };
    }
    else if (buttonText === 'Add Action') {
        addContentTextField.placeholder = `Write a new action. Example: "${GetActionExample()}"`
        maxNumOfChars = maxCharsAction;
        CountCharacters();
        addContentBlock.style.height = '30pt';
        tryAddContentButton.onclick = () => { TryAddNewContent('action', -1); }
        onEnterPress = () => { TryAddNewContent('action', -1); };
    }
    else {
        console.error('cant assign a function to the "add content" button because the text was not assigned correctly.');
        onEnterPress = null;
    }

    //start to monitor the scenario
    TryUnsubscribe();
    //startScenarioMonitoring(actionIndex, buttonText);
    ScrollDown();
}

/*
async function startScenarioMonitoring(actionIndex, contentType) {
    if (contentType != 'Add Scenario' && contentType != 'Add Action') {
        console.error('content type text set incorrectly. Cannot monitor. it was set to: ' + contentType);
        return;
    }
    
    const monitorSucceeded = monitorScenario(currentScenarioID, updatedData => onUpdate)
    
    if (!monitorSucceeded) {
        console.error('the monitoring was unable to start');
    }
    else{
        console.log('monitor started');
    }
    

    function onUpdate(updatedData){
        console.log('an update received!!!');
        if (contentType === 'Add Scenario') onScenarioUpdate(updatedData);
        else if (contentType === 'Add Action') onActionUpdate(updatedData);
    }

    async function onScenarioUpdate(updatedData) {

        const newScenarioID = updatedData.actions[actionIndex].scenarioID;
        if (!newScenarioID) return;

        TryUnsubscribe();

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
        console.log('an action was updated!');
        addContentTextField.placeholder = '..or add your own action';
        createScenarioActionButtons(updatedData.actions, currentScenarioID);
    }
    
}
*/

function ScrollDown() {
    window.scrollTo(0, document.body.scrollHeight);
}