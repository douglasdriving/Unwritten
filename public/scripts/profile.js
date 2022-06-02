import { GetPlayerContributions } from "/scripts/dbHandler.js?v=0.01"; //import functions for getting player branches
import { AttachToSignIn } from '/scripts/authHandler.js?v=0.01';

//VARIABLES
const listDiv = document.getElementById('contributions');

//RUN AT START
AttachToSignIn(user => {
  if (user) {
    document.getElementById('profileName').textContent = 'Profile for ' + user.email;
    ListAllContributions(user.uid);
  }
})

//FUNCTIONS
async function ListAllContributions(playerID) {

  //Get the data
  const contributionsData = await GetPlayerContributions(playerID);

  //sort contributions according to time.
  contributionsData.sort(function (a, b) {
    if (a.time < b.time) return 1;
    if (a.time > b.time) return -1;
    return 0;
  });

  //list the contributions
  contributionsData.forEach(c => {
    var date = new Date(c.time.seconds * 1000);
    const contributionDiv = ListSingleContribution(c.text, c.story, c.type, date);

    contributionDiv.onclick = () => {
      if (c.actionId) OpenStoryAtLocation(c.storyCollectionID, c.scenarioDocID, c.actionId);
      else OpenStoryAtLocation(c.storyCollectionID, c.scenarioDocID);
    }

  })

}

function ListSingleContribution(text, story, type, time) {

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
  window.location.href = `/pages/play.html?v=0.02&storyCollectionID=${storyID}&scenarioID=${scenarioID}&actionID=${actionID}`;
}