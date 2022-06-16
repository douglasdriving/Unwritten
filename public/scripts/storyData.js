import { setStory, addAction, addScenario, monitorScenario, getScenario, NotifyPlayer, GetScenarios, getIntro, GetTitle } from "/scripts/dbHandler.js?v=0.11";
import { GetCurrentPlayerId } from '/scripts/authHandler.js?v=0.11';

let scenarios;
let currentScenario;
let lastScenarioAdded;
let currentStoryId;
let introText
let currentlyWritingScenarioOn;
const printedScenarios = [];

//SET DATA
export async function SetupData() {

  currentStoryId = CheckForURLParam("storyCollectionID")
  setStory(currentStoryId);
  scenarios = await GetScenarios(currentStoryId);
  introText = await getIntro(currentStoryId);
  MonitorAllScenarios();

  //SET UP A SEQUENCE OF ACTIONS TO TAKE
  const scenarioId = CheckForURLParam('scenarioID');
  const actionId = CheckForURLParam('actionID');

  if (!scenarioId) return;

  const sequence = [];
  if (actionId && actionId != 'undefined') {
    sequence.push(actionId);
  }

  AddActionSequence(GetScenario(scenarioId));
  sequence.reverse();
  return sequence;

  function AddActionSequence(scenario) {
    if (typeof scenario.parentActionIndex !== 'undefined') {
      sequence.push(scenario.parentActionIndex);
    }
    if (scenario.parentScenarioID) AddActionSequence(GetScenario(scenario.parentScenarioID));
  }

}
export function SetScenario(id) {
  if (currentScenario.id === id) return;
  else currentScenario = GetScenario(id);
}
export function MoveToNextScenario(actionId) {
  if (!currentScenario) {
    currentScenario = GetScenario('start');
    return currentScenario;
  }
  else if (currentScenario.actions && currentScenario.actions[actionId] && currentScenario.actions[actionId].scenarioID) {
    const nextScenario = GetScenario(currentScenario.actions[actionId].scenarioID);
    currentScenario = nextScenario;
    return currentScenario;
  }
  else {
    return false;
  }
}

//GET DATA 
export function GetStoryIntro() {
  return introText;
}
export function GetCurrentScenarioID() {
  return currentScenario.id;
}
export function GetLastScenarioAdded() {
  return lastScenarioAdded;
}
export function GetCurrentScenario() {
  return currentScenario;
}
export function GetScenario(id) {
  let returnScenario;
  scenarios.forEach(scenario => {
    if (scenario.id === id) {
      returnScenario = scenario;
    }
  })
  return returnScenario;
}
export async function GetCurrentStoryTitle() {
  const title = await GetTitle(currentStoryId);
  return title;
}

//ADD CONTENT
export async function CreateAction(text) {

  if (!currentScenario) {
    console.error('could not find the current scenario, and therefore not create a new action. Current scenario var is set to: ');
    console.log(currentScenario);
    return;
  }

  //adding an action to the current scenario in the database
  const newAction = await addAction(currentScenario.id, text);

  //also - add to the local data
  if (newAction.id != -1) {
    let actionAlreadyAdded = false;
    if (!currentScenario.actions) currentScenario.actions = [];
    else {
      currentScenario.actions.forEach(action => {
        if (action.action === newAction.action) actionAlreadyAdded = true;
      })
    }
    if (!actionAlreadyAdded) {
      currentScenario.actions.push(newAction);
    }
  }

  NotifyAllPlayersOnBranch();

  return newAction;

}
export async function CreateScenario(text, actionID) {

  const response = await addScenario(text, currentScenario.id, actionID)

  if (response.status === 0) {
    MoveToNewlyAddedScenario();
    NotifyAllPlayersOnBranch();
  }
  else if (response.status === -2) {
    MoveToNewlyAddedScenario();
  }

  return response;

  function MoveToNewlyAddedScenario() {
    const newScenario = response.newDocData;
    newScenario.id = response.newDocID;
    currentScenario.actions[actionID].scenarioID = newScenario.id;
    scenarios.push(newScenario);
    lastScenarioAdded = newScenario;
    currentScenario = newScenario;
    Monitor(newScenario.id, newScenario);
  }
}
function NotifyAllPlayersOnBranch() {

  const playersNotified = [];
  NotifyUpwards(currentScenario);

  function NotifyUpwards(scenario) {

    const playerToNotify = scenario.player;
    if (playerToNotify) {
      Notify(playerToNotify, scenario.text, scenario.id);
    }

    if (scenario.parentScenarioID) {
      const scenarioAbove = GetScenario(scenario.parentScenarioID);

      if (!scenarioAbove) {
        console.error(
          'tried to find the scenario above with id: ' + scenario.parentScenarioID,
          'but it did not return a valid scenario it returned: ',
          scenarioAbove,
          'story data is:',
          scenarios
        );
        return;
      }

      if (scenarioAbove.actions) {
        const actionAbove = scenarioAbove.actions[scenario.parentActionIndex];
        if (actionAbove.player) Notify(actionAbove.player, actionAbove.action, scenarioAbove.id, scenario.parentActionIndex);
      }
      else {
        console.error(
          'tried to notify players in the action above this scenario: ' + scenario,
          'that has this scenario ID: ' + scenario.parentScenarioID,
          'it showed this scenario: ' + scenarioAbove,
          'but could not find any ACTIONS on that scenario.'
        );
      }

      NotifyUpwards(scenarioAbove);
    }

  }

  function Notify(playerToNotify, text, scenarioId, actionId) {

    if (playersNotified.includes(playerToNotify)) return;
    if (playerToNotify === GetCurrentPlayerId()) return;

    NotifyPlayer(playerToNotify, currentStoryId, text, scenarioId, actionId);
    playersNotified.push(playerToNotify);

  }

}

//HELPER FUNCTIONS
function CheckForURLParam(param) {

  var url_string = window.location.href;
  var url = new URL(url_string);
  var str = url.searchParams.get(param);

  if (str) {
    return str;
  }
  else {
    return false;
  }

}
export function AddPrintedScenario(id, UpdatePrintedActions) {
  printedScenarios.push({
    id: id,
    UpdatePrintedActions: UpdatePrintedActions
  })
}

//MONITORING
function MonitorAllScenarios() {

  MonitorEachScenarioDownwards(GetScenario('start'));
  function MonitorEachScenarioDownwards(scenario) {

    if (!scenario) return;
    Monitor(scenario.id, scenario);
    if (!scenario.actions || typeof scenario.actions === 'undefined') return;
    scenario.actions.forEach(action => {
      if (action.scenarioID) MonitorEachScenarioDownwards(GetScenario(action.scenarioID));
    })

  }
}
function Monitor(scenarioId, scenarioData) {

  let initialFire = true;
  monitorScenario(scenarioId, newData => { ScenarioUpdated(newData, scenarioData); }); //fires directly on assign, which is a problem

  async function ScenarioUpdated(newData, oldData) {

    if (initialFire){
      initialFire = false;
      console.log('initial fire called');
      return;
    }
    
    if (typeof newData.actions === 'undefined') return;
    if (typeof oldData.actions === 'undefined') {
      AddNewAction(newData.actions[0], 0);
      return;
    }

    for (let i = 0; i < newData.actions.length; i++) {
      const updatedAction = newData.actions[i];

      if (oldData.actions.length < i + 1) {
        AddNewAction(updatedAction, i);
      }
      else if (typeof oldData.actions[i].scenarioID === 'undefined' && typeof updatedAction.scenarioID !== 'undefined') {
        const newScenarioID = updatedAction.scenarioID
        const clientSideAction = oldData.actions[i];
        clientSideAction.scenarioID = newScenarioID;

        if (currentlyWritingScenarioOn.scenarioId === oldData.id && currentlyWritingScenarioOn.actionId === i) {
          document.dispatchEvent(currentlyWritingScenarioOn.interruptionEvent);
        }

        const newScenario = await getScenario(newScenarioID);
        newScenario.id = newScenarioID;
        scenarios.push(newScenario);
        Monitor(updatedAction.scenarioID, newScenario);
      }
    }

    function AddNewAction(newAction, newActionId) {
      if (typeof oldData.actions === 'undefined') oldData.actions = [newAction];
      else oldData.actions.push(newAction);
      printedScenarios.forEach(printedScenario => {
        if (printedScenario.id === scenarioId) {
          printedScenario.UpdatePrintedActions(newAction, newActionId);
        }
      });
    }
  }
}

export function SetScenarioBeingWritten(scenarioId, actionId, interruptionEvent) {
  currentlyWritingScenarioOn = {
    scenarioId: scenarioId,
    actionId: actionId,
    interruptionEvent: interruptionEvent
  }
}