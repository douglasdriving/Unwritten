import { setStory, getStoryData, addAction, addScenario, monitorScenario, getScenario, NotifyPlayer } from "/scripts/dbHandler.js?v=0.11";
import { GetCurrentPlayerId } from '/scripts/authHandler.js?v=0.11';

let storyData;
let currentScenario;
let lastScenarioAdded;
let currentStoryId;

//SET DATA
export async function SetupData() {

  currentStoryId = CheckForURLParam("storyCollectionID")
  setStory(currentStoryId);
  storyData = await getStoryData(currentStoryId);
  MonitorAllScenarios();

  //SET UP A SEQUENCE OF ACTIONS TO TAKE
  const scenarioID = CheckForURLParam('scenarioID');
  const actionID = CheckForURLParam('actionID');

  if (!scenarioID) return;

  const sequence = [];
  if (actionID && actionID != 'undefined') {
    sequence.push(actionID);
  }

  AddActionSequence(FindScenario(scenarioID));
  sequence.reverse();
  return sequence;

  function AddActionSequence(scenario) {
    if (scenario.parentActionIndex != undefined) sequence.push(scenario.parentActionIndex);
    if (scenario.parentScenarioID) AddActionSequence(FindScenario(scenario.parentScenarioID));
  }

}
export function SetScenario(id) {

  if (currentScenario.id === id) return;

  currentScenario = FindScenario(id);

  // console.log('setting scenario with id ' + id);
  // console.log('current scenario was set to ');
  // console.log(currentScenario);

}
export function MoveToNextScenario(actionID) {

  let nextScenario;

  if (!currentScenario) nextScenario = storyData.start;
  else if (currentScenario.actions && currentScenario.actions[actionID] && currentScenario.actions[actionID].scenario) {
    nextScenario = currentScenario.actions[actionID].scenario;
  }

  if (!nextScenario) {
    return false;
  }
  else {
    currentScenario = nextScenario;

    //console.log('moving to next scenario using action id ' + actionID);
    //console.log('current scenario was set to ');
    //console.log(currentScenario);

    return currentScenario;
  }

}

//GET DATA 
export function getIntro() {
  return storyData.intro;
}
export function GetCurrentScenarioID() {
  return currentScenario.id;
}
export function GetLastScenarioAdded() {
  return lastScenarioAdded;
}
export function GetCurrentScenario(){
  return currentScenario;
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
    if (!currentScenario.actions) currentScenario.actions = [];
    currentScenario.actions.push(newAction);
  }

  NotifyAllPlayersOnBranch();

  return newAction;

}
export async function CreateScenario(text, actionID) {

  const response = await addScenario(text, currentScenario.id, actionID)

  if (response.status === 0) {
    const newScenario = response.newDocData;
    newScenario.id = response.newDocID;
    currentScenario.actions[actionID].scenario = newScenario;
    lastScenarioAdded = newScenario;
    currentScenario = newScenario;
  }
  else {
    console.error('there was an error in adding the new scenario! The response looks like this:');
    console.log(response);
  }

  NotifyAllPlayersOnBranch();

  return response;

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
      const scenarioAbove = FindScenario(scenario.parentScenarioID);

      if (!scenarioAbove) {
        console.error(
          'tried to find the scenario above with id: ' + scenario.parentScenarioID,
          'but it did not return a valid scenario it returned: ',
          scenarioAbove,
          'story data is:',
          storyData
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
function FindScenario(id) {

  if (id === 'start') return storyData.start;

  let foundScenario;
  searchScenario(storyData.start);
  return foundScenario;

  function searchScenario(scenario) {

    if (scenario && (typeof foundScenario === 'undefined')) {
      if (scenario.id === id) {
        foundScenario = scenario;
      }
      else if (scenario.actions) {
        const actions = scenario.actions;
        actions.forEach(action => {
          if (action.scenario) searchScenario(action.scenario);
        })
      }
    }
  }
}
function MonitorAllScenarios() {

  Monitor(storyData.start);

  function Monitor(scenario) {

    if (!scenario) return;

    //start monitr of this scenario using dbhandler, and give it a function
    monitorScenario(scenario.id, newData => { ScenarioUpdated(newData); });
    let fired = false;

    if (!scenario.actions) return;

    scenario.actions.forEach(action => {
      Monitor(action.scenario);
    })

    async function ScenarioUpdated(newData) {

      if (!fired) {
        fired = true;
        return;
      }

      scenario.text = newData.text;

      if (!newData.actions) return;
      for (let i = 0; i < newData.actions.length; i++) {

        const updatedAction = newData.actions[i];

        if (!scenario.actions) {
          scenario.actions = [updatedAction];
        }

        if (scenario.actions.length < (i - 1)) {
          scenario.actions.push(updatedAction);
          return;
        }

        let clientSideAction = scenario.actions[i];
        clientSideAction.action = updatedAction.action; //updates text
        const newScenarioID = updatedAction.scenarioID

        if (!newScenarioID) return;
        if (clientSideAction.scenarioID === newScenarioID) return;

        const newScenarioData = await getScenario(newScenarioID);
        clientSideAction.scenarioID = newScenarioID;
        clientSideAction.scenario = newScenarioData;
        clientSideAction.scenario.id = newScenarioID;

      }

    }

  }

}
