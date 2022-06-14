import { setStory, addAction, addScenario, monitorScenario, getScenario, NotifyPlayer, GetScenarios, getIntro, GetTitle } from "/scripts/dbHandler.js?v=0.11";
import { GetCurrentPlayerId } from '/scripts/authHandler.js?v=0.11';

let scenarios;
let currentScenario;
let lastScenarioAdded;
let currentStoryId;
let introText

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
function GetScenario(id) {
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
function MonitorAllScenarios() {

  Monitor(GetScenario('start'));

  function Monitor(scenario) {

    if (!scenario) return;

    monitorScenario(scenario.id, newData => { ScenarioUpdated(newData); });
    let fired = false;

    if (!scenario.actions) return;

    scenario.actions.forEach(action => {
      if (action.scenarioID) Monitor(GetScenario(action.scenarioID));
    })

    async function ScenarioUpdated(newData) {
      if (!fired) {
        fired = true;
        return;
      }
      console.log('a scenario was updated! New data: ', newData);
      scenario.text = newData.text;
      if (!newData.actions) return;
      for (let i = 0; i < newData.actions.length; i++) {

        const updatedAction = newData.actions[i];
        let clientSideAction = scenario.actions[i];

        if (!scenario.actions) scenario.actions = [updatedAction];
        else if (typeof clientSideAction === 'undefined') {
          console.log('new action was added: ', updatedAction);
          scenario.actions.push(updatedAction);
          return;
        }
        else if (!clientSideAction.scenarioID && updatedAction.scenarioID) {
          console.log('a scenario was added to this action: ', updatedAction);
          const newScenarioID = updatedAction.scenarioID
          const newScenario = await getScenario(newScenarioID);
          console.log('it points to this scenario: ', newScenario);
          clientSideAction.scenarioID = newScenarioID;
          newScenario.id = newScenarioID;
          scenarios.push(newScenario);
        }
      }
    }
  }
}
