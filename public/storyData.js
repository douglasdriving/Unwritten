//loads with the play page
//handles all the story data on the client side
//data is loaded from the dbHandler
//after it has been loaded, a client representation of the data is created here.

import { setStory, getStoryData } from "/dbHandler.js?v=0.275";
let storyData;
let currentScenario;

export async function SetupData() {

  const storyCollectionId = CheckForCollectionID();
  setStory(storyCollectionId);
  storyData = await getStoryData(storyCollectionId); //this will be async though
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