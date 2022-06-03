import { GetPlayerNotifications } from "/scripts/dbHandler.js?v=0.01"; //import functions for getting player branches
import { AttachToSignIn } from '/scripts/authHandler.js?v=0.01';

//VARIABLES
const listDiv = document.getElementById('updatesContainer');

//RUN AT START
AttachToSignIn(user => {
  if (user) {
    ListAllUpdates(user.uid);
  }
})

//FUNCTIONS
async function ListAllUpdates(playerID) {

  //Get the data
  const updatesData = await GetPlayerNotifications(playerID);

  //sort notifications according to time.
  updatesData.sort(function (a, b) {
    if (a.time < b.time) return 1;
    if (a.time > b.time) return -1;
    return 0;
  });

  //list the updates
  updatesData.forEach(entry => {
    var date = new Date(entry.time.seconds * 1000);
    
    const type = 'scenario';
    if (typeof entry.actionId !== undefined) type='action';

    const updateDiv = ListSingleUpdate(date, entry.storyTitle, type, entry.text); 
    updateDiv.onclick = () => {
      if (type==='action') OpenStoryAtLocation(entry.storyId, entry.scenarioId, entry.actionId);
      else OpenStoryAtLocation(entry.storyId, entry.scenarioId);
    }

  })

}
//fix from here
function ListSingleUpdate(text, story, type, time) {

  const contributionDiv = document.createElement('div');
  contributionDiv.className = "inverted bordered";
  listDiv.append(contributionDiv);

  const textElement = AddRow('"' + text + '"');
  textElement.className = 'white bold noMargin';

  contributionDiv.append(document.createElement('hr'));

  AddRow(type);
  AddRow(story);
  AddRow(time.toLocaleString().slice(0, -3));

  return contributionDiv;

  function AddRow(str) {
    const element = document.createElement('p');
    element.className = 'white noMargin';
    element.textContent = str;
    contributionDiv.append(element);
    return element;
  }

}

function OpenStoryAtLocation(storyID, scenarioID, actionID){
  
  let url = `/pages/play.html?v=0.02&storyCollectionID=${storyID}&scenarioID=${scenarioID}`
  if (actionID) url += `&actionID=${actionID}`;
  window.location.href = url;

}