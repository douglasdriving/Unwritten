import { GetPlayerContributions } from "/scripts/dbHandler.js?v=0.01"; //import functions for getting player branches
import { AttachToSignIn } from '/scripts/authHandler.js?v=0.01';

const listDiv = document.getElementById('contributions');

AttachToSignIn(user => {

  if (user) {
    document.getElementById('profileName').textContent = 'Profile for ' + user.email;
    ListAllContributions(user.uid);
  }

})

//TESTCODE
/*
const dummyContributions = [];
dummyContributions.push({
  text: 'Chug the tea',
  story: 'Moving to Berlin',
  type: 'Action',
  time: new Date("2022-03-17T14:24:00")
})
dummyContributions.push({
  text: 'The road fades into the darkness. You dont know where it leads. You can hear footsteps approaching from behind, and the man yelling "Where the fuck are you, you bastard!?"',
  story: 'The Mysteries of Yellowseed',
  type: 'Scenario',
  time: new Date("2022-12-17T03:24:00")
})
dummyContributions.push({
  text: 'Bake a birthday cake',
  story: 'Example Story',
  type: 'Action',
  time: new Date("1995-12-17T03:24:00")
})
*/

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
    ListSingleContribution(c.text, c.story, c.type, date);
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

  function AddRow(str) {
    const element = document.createElement('p');
    element.className = 'white noMargin';
    element.textContent = str;
    contributionDiv.append(element);
    return element;
  }

}