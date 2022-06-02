import { setStory, getStoryData, addAction, addScenario, monitorScenario, getScenario } from "/scripts/dbHandler.js?v=0.02";

let storyData;
let currentScenario;
let lastScenarioAdded;

//SET DATA
export async function SetupData() {

  const storyCollectionId = CheckForURLParam("storyCollectionID")
  setStory(storyCollectionId);
  storyData = await getStoryData(storyCollectionId);
  MonitorAllScenarios();

  //if there are params in the url telling us where to start, we should return a sequence of clicks to the play function to execute automatically.
  const scenarioID = CheckForURLParam('scenarioID');
  if(!scenarioID) return;

  //create a sequence of clicks that takes user down to the scenario
  const startSequence = []; 
  //gotta use the data here to move upwards. maybe just build it in reverse and then flip it?

  const actionID = CheckForURLParam('actionID');
  if(!actionID);

  //add the final action id as the last part of the sequence

}
export function SetScenario(id) {
  currentScenario = FindScenario(id);
}
export function MoveToNextScenario(actionID) {

  let nextScenario;

  if (!currentScenario) nextScenario = storyData.start;
  else nextScenario = currentScenario.actions[actionID].scenario;

  if (!nextScenario) {
    return false;
  }
  else {
    currentScenario = nextScenario;
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

  //adding an action to the current scenario in the database
  const newActionID = await addAction(currentScenario.id, text)

  //also - add to the local data
  if (newActionID != -1) {
    if (!currentScenario.actions) currentScenario.actions = [];
    currentScenario.actions.push({
      action: text
    })
  }

  return newActionID;

}
export async function CreateScenario(text, actionID) {

  const response = await addScenario(text, currentScenario.id, actionID)

  if (response.status === 0) {
    //successfully added the scenario to the db, add it locally as well
    const newScenario = response.newDocData;
    newScenario.id = response.newDocID;
    currentScenario.actions[actionID].scenario = newScenario;
    lastScenarioAdded = newScenario;
    currentScenario = newScenario;
  }

  return response;

}

//HELPER FUNCTIONS
function CheckForURLParam(param){

  var url_string = window.location.href;
  var url = new URL(url_string);
  var str = url.searchParams.get(param);

  if (str) {
    return str;
  }
  else {
    console.log(`no ${param} could be found`)
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
