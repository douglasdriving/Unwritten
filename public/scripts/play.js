import { getIntro, SetupData, MoveToNextScenario, SetScenario, CreateAction, CreateScenario, GetCurrentScenarioID, GetLastScenarioAdded } from "/scripts/storyData.js?v=0.07";
import { GetScenarioExample, GetActionExample } from "/scripts/examples.js?v=0.02";

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

//TRACKING VARIABLES
let currentScenarioID;
let onEnterPress;
let contentIsBeingAdded = false;
let currentActionBlock;
let maxNumOfChars = maxCharsAction;

//RUN AT START
keepPlayButton.style.display = 'none';
addingContentBlock.style.display = 'none';
addContentBlock.style.display = 'none';
document.getElementById("contentAddConfirmBlock").style.display = 'none';
SetPlayingField();
beginButton.style.display = 'none';

//ASSIGN BUTTONS AND EVENTS
beginButton.onclick = () => {
    PlayScenario(MoveToNextScenario(), false);
    beginButton.style.display = 'none';
}
document.addEventListener("keypress", event => {
    if (event.key != 'Enter') return;
    if (!onEnterPress) return;
    onEnterPress();
});
addContentTextField.addEventListener('input', CountCharacters);
const terminatePrint = new Event('terminatePrint');

const scenariosContainer = document.createElement('div');
storyBlock.append(scenariosContainer);

//FUNCTIONS
async function SetPlayingField() {

    const sequence = await SetupData();
    const text = getIntro();
    document.getElementById('ingress').textContent = text;
    beginButton.style.display = 'block';

    //RUN SEQUENCE
    if (!sequence) return;
    beginButton.remove();
    console.log(sequence);
    
    for (let i = 0; i < sequence.length; i++) {

        if (i % 2 === 0){ //this is no necessarily true. it will vary depending on if it ends with an action or a scenario (or will it? should always start with a scenario lol)
            //its a scenario
            if (i === sequence.length - 1){
                //no need to print again
                return;
            }
            PlayScenario(sequence[i], true);    
        }
        else{
            //its an action
            TakeAction(sequence[i], sequence[i-1].id, currentActionBlock.childNodes[sequence[i]], true);
        }

    }
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

function PlayScenario(scenarioData, instant) {

    const scenario = scenarioData.text;
    currentScenarioID = scenarioData.id;
    addContentBlock.style.display = 'none';
    ScrollDown();

    //setup termination tracking
    let printTerminated = false;
    addEventListener('terminatePrint', () => { printTerminated = true });

    //start the print!
    const scenarioTextBlock = document.createElement('div');
    scenarioTextBlock.className = 'scenarioText';

    if (instant) {
        scenarioTextBlock.textContent = scenario;
        ScrollDown();
    }
    else {
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
    }

    //Create the container
    const scenarioBlock = document.createElement('div');
    scenarioBlock.className = 'scenarioContainer';
    scenarioBlock.appendChild(scenarioTextBlock);
    scenariosContainer.appendChild(scenarioBlock);

    const actionBlock = document.createElement('div');
    currentActionBlock = actionBlock;
    scenarioBlock.appendChild(actionBlock);

    ScrollDown();

    //create the action butons
    if (instant) {
        LoadActionButtons(scenarioData.actions);
    }
    else {
        const timeBeforePrintDone = Array.from(scenario).length * timeBetweenLetters;
        setTimeout(() => {
            if (printTerminated) return;
            LoadActionButtons(scenarioData.actions);
        }, timeBeforePrintDone + delayAfterPrintFinished);
    }
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
                TryBacktrack(scenarioIdForButton, plusButton.parentNode);
                SetHighlight(plusButton, true);
            }
            else {
                addContentBlock.style.display = 'none';
                SetHighlight(plusButton, false);
            }
        });
    }
}

function CreateActionButton(actionObject, actionID) {

    //CREATE THE BUTTON ELEMENT
    const actionButton = document.createElement('button');
    currentActionBlock.appendChild(actionButton);
    actionButton.className = 'actionButton';
    actionButton.textContent = actionObject.action;

    //ASSIGN THE ONCLICK FUNCTION
    const scenarioIdForThisAction = currentScenarioID;
    actionButton.onclick = (async () => {
        TakeAction(actionID, scenarioIdForThisAction, actionButton, false);
    });

    return actionButton;

}

function TryBacktrack(scenarioID, actionBlock) {

    const scenarioContainer = actionBlock.parentNode;
    if (!scenarioContainer.parentNode.childNodes) {
        console.log('no child nodes for the parent of the scenario container');
        return;
    }
    const allScenarioContainers = Array.from(scenarioContainer.parentNode.childNodes);
    const scenarioContainerId = allScenarioContainers.indexOf(scenarioContainer);

    for (let i = scenarioContainerId + 1; i < allScenarioContainers.length; i++) {
        allScenarioContainers[i].remove();
    }

    SetScenario(scenarioID);
}

function TakeAction(actionID, scenarioID, buttonPressed, instant) { //improvement: all of these params could be containted within the same obj.

    dispatchEvent(terminatePrint);
    if (contentIsBeingAdded) return;
    TryBacktrack(scenarioID, buttonPressed.parentNode);

    if (buttonPressed.className === 'actionButton highlightedButton') {

        addContentBlock.style.display = 'none';

        Array.from(buttonPressed.parentNode.childNodes).forEach(button => {
            const firstWord = button.className.split(' ')[0];
            if (firstWord === 'actionButton') button.className = 'actionButton';
            else if (firstWord === 'plusButton') button.className = 'plusButton';
        })

    }
    else {

        const nextScenario = MoveToNextScenario(actionID);
        if (nextScenario) PlayScenario(nextScenario, instant);
        else ReachEndpointAction(actionID);
        SetHighlight(buttonPressed, true);

    }

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

    ShowContentAddLoadText(true);
    contentIsBeingAdded = true;
    if (type === 'action') AddAction();
    else if (type === 'scenario') AddScenario();

    function ShowContentAddLoadText(show) {

        if (show) {
            contentAddConfirmBlock.style.display = 'none';
            addContentTextField.value = '';
            addingContentBlock.style.display = 'block';
            addingContentStatusText.textContent = 'Adding your content to Unwritten...';
        }
        else {
            addingContentBlock.style.display = 'none';
        }

    }

    async function AddAction() {
        CreateAction(contentText)
            .then(newActionID => {

                if (newActionID === -1) {
                    addingContentStatusText.textContent = 'ERROR - your action could not be added.';
                    return;
                }
                //ConfirmContentAddition('action', contentText, null, newActionID);

                contentIsBeingAdded = false;
                //hideAddContentBlock();
                const newActionObj = {
                    scenarioCount: 0,
                    action: contentText,
                }
                const actionButton = CreateActionButton(newActionObj, newActionID);
                SetHighlight(actionButton, true);
                ReshuffleActionButtons(actionButton.parentNode);
                TakeAction(newActionID, GetCurrentScenarioID(), actionButton, false);
                ShowContentAddLoadText(false);

            });
    }

    async function AddScenario() {
        CreateScenario(contentText, actionIndex)
            .then(response => {

                if (response.status === -1) {
                    addingContentStatusText.textContent = 'Failed to add the scenario to Unwritten. Please try again.';
                    return;
                }

                if (response.status === -2) {
                    addingContentStatusText.textContent = 'Another player just added a scenario to this action! Keep playing to see what it was';
                    return;
                }

                //ConfirmContentAddition('scenario', contentText, response.newDocID, 0);
                contentIsBeingAdded = false;
                //hideAddContentBlock();
                PlayScenario(GetLastScenarioAdded(), false);
                ShowContentAddLoadText(false);

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
            const newActionObj = {
                scenarioCount: 0,
                action: contentText,
            }
            const actionButton = CreateActionButton(newActionObj, newActionID);
            SetHighlight(actionButton, true);
            ReshuffleActionButtons(actionButton.parentNode);
            TakeAction(newActionID, GetCurrentScenarioID(), actionButton, false);
        }
    }
    else if (type === 'scenario') {
        continueButton.textContent = 'Keep playing this scenario';
        continueButton.onclick = () => {
            hideAddContentBlock();
            PlayScenario(GetLastScenarioAdded(), false);
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