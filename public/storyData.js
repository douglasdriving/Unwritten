//loads with the play page
//handles all the story data on the client side
//data is loaded from the dbHandler
//after it has been loaded, a client representation of the data is created here.

import { setStory, getStoryData } from "/dbHandler.js?v=0.276";
let storyData;
let currentScenario;

export async function SetupData() {

  const storyCollectionId = CheckForCollectionID();
  setStory(storyCollectionId);
  storyData = await getStoryData(storyCollectionId);
  console.log('data was set up: ');
  console.log(storyData);

}

function CheckForCollectionID() {

  var url_string = window.location.href;
  var url = new URL(url_string);
  var ID = url.searchParams.get("storyCollectionID");

  if (ID) {
    setStory(ID); //not sure if needed. Might delete later.
    return ID;
  }
  else {
    console.error('no collection id could be found. cannot load any story')
  }

}

export function getIntro() {
  return storyData.intro;
}

export function GetNextScenario(actionID) {

  if (!currentScenario) currentScenario = storyData.start;
  else currentScenario = currentScenario.actions[actionID].scenario;
  return currentScenario;

}

export function GetCurrentActionOptions() {

  return currentScenario.actions;

}

export function SetScenario(id) {
  currentScenario = FindScenario(id);
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