import { GetStoryIntro, SetupData, MoveToNextScenario, SetScenario, CreateAction, CreateScenario, GetCurrentScenarioID, GetLastScenarioAdded, GetCurrentScenario, GetCurrentStoryTitle } from "/scripts/storyData.js?v=0.11";
import { GetExample } from "/scripts/examples.js?v=0.11";

//BALANCING
const timeBetweenLetters = 10; //ms
const delayAfterPrintFinished = 500; //ms
const maxChars = {
    action: 40,
    scenario: 250
}

//DOC VARABLE DECLARATIONS
const storyBlock = document.getElementById('story');
const beginButton = document.getElementById('beginPlay');
const addContentBlock = document.getElementById('addContentBlock');
const tryAddContentButton = document.getElementById('tryAddContentButton');
const addContentTextField = document.getElementById('addContentTextField');
const addingContentBlock = document.getElementById('addingContent');
const addingContentStatusText = document.getElementById('addContentStatus');
const keepPlayButton = document.getElementById('keepPlayButton');
const charCounter = document.getElementById('charCounter');
const introDiv = document.getElementById('ingress')
const scenariosContainer = document.createElement('div');
storyBlock.append(scenariosContainer);

//TRACKING VARIABLES
let currentScenarioId;
let onEnterPress;
let contentIsBeingAdded = false;
let currentActionBlock;
let maxNumOfChars = maxChars.action;
let terminatePrint;

//RUN AT START
SetupStory();
function SetupStory() {
    SetDisplayOnStart();
    SetPlayingField();
    AssignButtonsAndEvents();

    function AssignButtonsAndEvents() {
        beginButton.onclick = () => {
            PlayScenario(MoveToNextScenario(), false);
            beginButton.style.display = 'none';
        };
        document.addEventListener("keypress", event => {
            if (event.key != 'Enter')
                return;
            if (!onEnterPress)
                return;
            onEnterPress();
        });
        addContentTextField.addEventListener('input', CountCharactersInTextField);
        terminatePrint = new Event('terminatePrint');
    }
    function SetDisplayOnStart() {
        keepPlayButton.style.display = 'none';
        addingContentBlock.style.display = 'none';
        introDiv.style.display = 'none';
        DisplayAddContentBlock(false);
        document.getElementById("contentAddConfirmBlock").style.display = 'none';
        beginButton.style.display = 'none';
    }
    async function SetPlayingField() {

        let sequence;
        let introText;
        let title;
        
        await Promise.all([
            sequence = await SetupData(),
            introText = await GetStoryIntro(),
            title = await GetCurrentStoryTitle()
        ]);

        introText = introText.replace(/\\n/g, "\n\n");
        introDiv.textContent = introText;
        introDiv.style.display = 'block';
        document.getElementById('titleHeading').textContent = title;
        beginButton.style.display = 'block';

        RunStartSequence(sequence);
    }
    function RunStartSequence(sequence) {
        if (!sequence) return;
        PlayScenario(MoveToNextScenario(), true);
        beginButton.remove();
        for (let i = 0; i < sequence.length; i++) {
            PressActionButton(sequence[i], currentActionBlock.childNodes[sequence[i]], true);
        }
    }
}

//LOADING A SCENARIO
function PlayScenario(scenarioData, instant) {

    const scenarioText = scenarioData.text;
    currentScenarioId = scenarioData.id;
    DisplayAddContentBlock(false);
    let printTerminated = StartScenarioPrint();
    CreateActionButtons();
    ScrollDown();

    function CreateActionButtons() {
        if (instant) {
            LoadActionButtons(scenarioData.actions);
        }
        else {
            const timeBeforePrintDone = Array.from(scenarioText).length * timeBetweenLetters;
            setTimeout(() => {
                if (printTerminated)
                    return;
                LoadActionButtons(scenarioData.actions);
            }, timeBeforePrintDone + delayAfterPrintFinished);
        }
    }
    function StartScenarioPrint() {

        let printTerminated = CreatePrintTerminationEvent();
        const scenarioTextBlock = Print();
        CreateScenarioContainer();
        return printTerminated;

        function CreatePrintTerminationEvent() {
            let printTerminated = false;
            addEventListener('terminatePrint', () => { printTerminated = true; });
            return printTerminated;
        }
        function CreateScenarioContainer() {
            const scenarioBlock = document.createElement('div');
            scenarioBlock.className = 'scenarioContainer';
            scenarioBlock.appendChild(scenarioTextBlock);
            scenariosContainer.appendChild(scenarioBlock);
            const actionBlock = document.createElement('div');
            currentActionBlock = actionBlock;
            scenarioBlock.appendChild(actionBlock);
        }
        function Print() {
            const scenarioTextBlock = document.createElement('div');
            scenarioTextBlock.className = 'scenarioText';

            if (instant) {
                scenarioTextBlock.textContent = scenarioText;
                ScrollDown();
            }
            else {
                let delayForNextLetter = 0;
                let printedText = '';
                Array.from(scenarioText).forEach(char => {
                    setTimeout(() => {
                        if (!scenarioTextBlock)
                            return;
                        if (printTerminated)
                            scenarioTextBlock.remove();
                        printedText += char;
                        scenarioTextBlock.textContent = printedText;
                        ScrollDown();
                    }, delayForNextLetter);
                    delayForNextLetter += timeBetweenLetters;
                });
            }
            return scenarioTextBlock;
        }
    }
}
function LoadActionButtons(actions) {

    ClearButtonBlock();
    CreateActionButtons();
    CreatePlusButton();
    ScrollDown();

    function CreateActionButtons() {
        if (actions) {
            actions.forEach((actionElement, actionID) => {
                CreateActionButton(actionElement, actionID);
            });
        }
        function CreateActionButton(actionObject, actionID) {

            //CREATE THE BUTTON ELEMENT
            const actionButton = document.createElement('button');
            currentActionBlock.appendChild(actionButton);
            actionButton.className = 'actionButton';
            actionButton.textContent = actionObject.action;

            //ASSIGN THE ONCLICK FUNCTION
            const scenarioIdForThisAction = currentScenarioId;
            actionButton.onclick = (async () => {
                PressActionButton(actionID, actionButton, false, scenarioIdForThisAction);
            });

            return actionButton;
        }
    }
    function ClearButtonBlock() {
        if (currentActionBlock.childNodes.length > 0) {
            Array.from(currentActionBlock.childNodes).forEach(button => {
                button.remove();
            });
        }
    }
    function CreatePlusButton() {
        if (contentIsBeingAdded) return;

        const plusButton = document.createElement('button');
        plusButton.className = 'plusButton';
        currentActionBlock.appendChild(plusButton);
        plusButton.textContent = '+';

        const scenarioIdForButton = currentScenarioId;
        const priorScenarios = Array.from(scenariosContainer.childNodes)

        plusButton.onclick = (() => {

            dispatchEvent(terminatePrint);
            currentActionBlock = plusButton.parentNode;
            if (plusButton.className != 'plusButton highlightedButton') {
                ActivateAddContentBlock('write a new action...', 'Add Action', -1);
                TryBacktrack(scenarioIdForButton, plusButton.parentNode);
                SetButtonHighlighting(plusButton, true);
            }
            else {
                DisplayAddContentBlock(false);
                SetButtonHighlighting(plusButton, false);
            }

        });
    }

}
function PressActionButton(actionId, buttonPressed, instant, scenarioId) {
    dispatchEvent(terminatePrint);
    if (contentIsBeingAdded) return;
    if (scenarioId) TryBacktrack(scenarioId, buttonPressed.parentNode);
    if (buttonPressed.className === 'actionButton highlightedButton') {
        DisplayAddContentBlock(false);
        SetAllButtonsToNoHighlight();
    }
    else {
        const nextScenario = MoveToNextScenario(actionId);
        if (nextScenario) {
            PlayScenario(nextScenario, instant);
        }
        else {
            ActivateAddContentBlock('What happens next?', 'Add Scenario', actionId);
            ScrollDown();
        }
        SetButtonHighlighting(buttonPressed, true);
    }

    function SetAllButtonsToNoHighlight() {
        Array.from(buttonPressed.parentNode.childNodes).forEach(button => {
            const firstWord = button.className.split(' ')[0];
            if (firstWord === 'actionButton')
                button.className = 'actionButton';
            else if (firstWord === 'plusButton')
                button.className = 'plusButton';
        });
    }
}
function TryBacktrack(scenarioID, actionBlock) {

    const scenarioContainer = actionBlock.parentNode;
    if (!scenarioContainer || !scenarioContainer.parentNode || !scenarioContainer.parentNode.childNodes) {
        console.log('no child nodes for the parent of the scenario container');
        return false;
    }
    const allScenarioContainers = Array.from(scenarioContainer.parentNode.childNodes);
    const scenarioContainerId = allScenarioContainers.indexOf(scenarioContainer);

    for (let i = scenarioContainerId + 1; i < allScenarioContainers.length; i++) {
        allScenarioContainers[i].remove();
    }

    SetScenario(scenarioID);
    return true;
}

//ADD CONTENT
function ActivateAddContentBlock(instructionText, buttonText, actionIndex) {
    //show the block
    ClearTextField();
    addContentTextField.placeholder = instructionText;
    addContentTextField.style.height = maxChars.type * 250 / window.innerWidth + 'px';
    DisplayAddContentBlock(true);
    tryAddContentButton.textContent = buttonText;

    //assign the "add" function to the button
    if (buttonText === 'Add Scenario') AssignAddButton('scenario');
    else if (buttonText === 'Add Action') AssignAddButton('action');
    else {
        console.error('cant assign a function to the "add content" button because the text was not assigned correctly.');
        onEnterPress = null;
    }

    ScrollDown();

    function AssignAddButton(type) {
        addContentTextField.placeholder = `Write a new ${type}. Example: "${GetExample(type)}"`;
        maxNumOfChars = MaxChars(type);
        CountCharactersInTextField();
        tryAddContentButton.onclick = () => { TryAddNewContent(type, actionIndex); };
        onEnterPress = () => { TryAddNewContent(type, actionIndex); };
    }
}
async function TryAddNewContent(type, actionIndex) {

    const contentText = addContentTextField.value;
    if (!TextIsOk()) return;
    const tryAddContentFunction = onEnterPress;
    onEnterPress = null;
    DisplayAddContentBlock(false);
    ShowConfimationBlock();
    ScrollDown();

    function ShowConfimationBlock() {
        const contentAddConfirmBlock = document.getElementById("contentAddConfirmBlock");
        contentAddConfirmBlock.style.display = 'block';
        const contentToConfirmText = document.getElementById('contentToConfirm');
        if (type === 'action')
            contentToConfirmText.textContent = `> ${contentText}`;
        else if (type === 'scenario')
            contentToConfirmText.textContent = `"${contentText}"`;
        //assign dem buttons
        document.getElementById('addContentButton').onclick = () => {
            AddContent(type, contentAddConfirmBlock, contentText, actionIndex);
        };
        document.getElementById('editContentButton').onclick = () => {
            onEnterPress = tryAddContentFunction;
            DisplayAddContentBlock(true);
            contentAddConfirmBlock.style.display = 'none';
        };
    }
    function AddContent(type, contentAddConfirmBlock, contentText, actionIndex) {
        ShowContentAddLoadText(true);
        contentIsBeingAdded = true;
        if (type === 'action') AddAction();
        else if (type === 'scenario') AddScenario();
        function ShowContentAddLoadText(show) {
            if (show) {
                contentAddConfirmBlock.style.display = 'none';
                ClearTextField();
                addingContentBlock.style.display = 'block';
                addingContentStatusText.textContent = 'Adding your content to Unwritten...';
            }
            else {
                addingContentBlock.style.display = 'none';
            }
        }
        async function AddAction() {
            CreateAction(contentText)
                .then(newAction => {
                    const actionId = newAction.id;
                    if (actionId === -1) {
                        addingContentStatusText.textContent = 'ERROR - your action could not be added.';
                        return;
                    }
                    contentIsBeingAdded = false;
                    const newActionObj = {
                        scenarioCount: 0,
                        action: contentText,
                    }
                    LoadActionButtons(GetCurrentScenario().actions);
                    PressActionButton(actionId, currentActionBlock.childNodes[actionId], false, GetCurrentScenarioID());
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
    function TextIsOk() {
        if (contentText === '') {
            console.error('please write something in the text field!');
            return false;
        }
        else if (contentText.length > maxNumOfChars) {
            console.error('too many characters!');
            return false;
        }
        else if (type != 'action' && type != 'scenario') {
            console.error('type was defined inapropriately to: ' + type);
            return false;
        }
        else return true;
    }
}

//UPDATE PLAYFIELD
function ScrollDown() {
    window.scrollTo(0, document.body.scrollHeight);
}
function SetButtonHighlighting(button, highlight) {
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
function DisplayAddContentBlock(display) {
    if (display) addContentBlock.style.display = 'block';
    else addContentBlock.style.display = 'none';
}
function ClearTextField() {
    addContentTextField.value = '';
}

//HELPER FUNCTIONS
function CountCharactersInTextField() {

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
function MaxChars(type) {
    if (type === 'action') {
        return maxChars.action;
    }
    else if (type === 'scenario') return maxChars.scenario;
    else console.error('max chars does not exist for that type.');
}