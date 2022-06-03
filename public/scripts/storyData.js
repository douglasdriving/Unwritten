import { setStory, getStoryData, addAction, addScenario, monitorScenario, getScenario, NotifyPlayer } from "/scripts/dbHandler.js?v=0.02";

let storyData;
let currentScenario;
let lastScenarioAdded;
let storyId;

//SET DATA
export async function SetupData() {

  storyCollectionId = CheckForURLParam("storyCollectionID")
  setStory(storyCollectionId);
  storyData = await getStoryData(storyCollectionId);
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

    // console.log('successfully added a new scenario. The response looks like this:');
    // console.log(response);

    const newScenario = response.newDocData;
    newScenario.id = response.newDocID;
    currentScenario.actions[actionID].scenario = newScenario;
    lastScenarioAdded = newScenario;
    currentScenario = newScenario;

    // console.log('current scenario was set to: ');
    // console.log(currentScenario);

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

    if (scenario.player && !playersNotified.includes(scenario.player)){
      NotifyPlayer(scenario.player, storyId, scenario.id)
      playersNotified.push(scenario.player);
    }

    if (scenario.parent && scenario.parent.parent && scenario.parent.parent.parent) {
      const scenarioAbove = scenario.parent.parent.parent;
      const actionAbove = scenarioAbove.actions[scenario.parentActionIndex];
      if (actionAbove.player && !playersNotified.includes[actionAbove.player]) NotifyPlayer(actionAbove.player, storyId, scenarioAbove.id)
      NotifyUpwards(scenarioAbove);
    }

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
  else return searchChildScenarios(storyData.start);

  function searchChildScenarios(scenario) {

    if (!scenario) return false;
    if (!scenario.actions) return false;

    const actions = scenario.actions;

    for (let i = 0; i < actions.length; i++) {

      const action = actions[i];
      if (action.scenarioID === id) return action.scenario;
      const scenaroBelow = searchChildScenarios(action.scenario);
      if (scenaroBelow) return scenaroBelow;
      //if there is no scenario below that returns true (i.e. has the right id), the loop will just keep going

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
