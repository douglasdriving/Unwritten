//IMPORT FIREBASE METHODS
import { StartFirebase } from "/scripts/firebaseConfig.js?v=0.11";
import { getFirestore, collection, addDoc, doc, getDoc, getDocs, updateDoc, onSnapshot, setDoc, query, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-analytics.js";
import { GetCurrentPlayerId, GetPlayerDisplayName } from '/scripts/authHandler.js?v=0.11';

//VARIABLES
const app = StartFirebase();
const analytics = getAnalytics(app);
const db = getFirestore(app);

let currentStoryId;
let scenarioColl;
let currentStoryTitle;
let unsubscribe;
let currentScenarioCollPath;
let playerHasAddedToThisStory = false;

//RUN ON LOAD
logEvent(analytics, 'started_app');

//SETUP DATA FOR PLAY
function CheckForCollectionID() {
    var url_string = window.location.href;
    var url = new URL(url_string);
    var id = url.searchParams.get("storyCollectionID");
    if (id) setStory(id.replace(/\s+/g, ''));
}
export async function setStory(id) {

    currentStoryId = id;
    currentScenarioCollPath = '/stories/' + currentStoryId + '/scenarios';
    scenarioColl = collection(db, currentScenarioCollPath);

    //set title
    const storyDocPath = `/stories/${currentStoryId}`
    const storyDocRef = await doc(db, storyDocPath);
    const storyDoc = await getDoc(storyDocRef);

    if (storyDoc.exists()) {
        currentStoryTitle = storyDoc.data().title;
    }
    else {
        console.error(`could not set story title. no doc data found for the given path: ` + storyDocPath);
    }

    //check to see if player has added to this story already
    const docPath = `players/` + GetCurrentPlayerId();
    const docRef = await doc(db, docPath);
    const playerDoc = await getDoc(docRef);

    if (playerDoc.exists()) {
        if (playerDoc.data().stories.includes(currentStoryId)) playerHasAddedToThisStory = true;
    }

}

//UPDATE THE STORY DATABASE
export async function addAction(scenarioId, actionText) {

    let scenarioData;

    const scenarioDocRef = await doc(db, ScenarioDocPath(scenarioId));
    const scenarioDoc = await getDoc(scenarioDocRef);

    if (scenarioDoc.exists()) {
        scenarioData = scenarioDoc.data();
    }
    else {
        return -1;
    }

    let actions = scenarioData.actions || [];
    const action = {
        action: actionText,
        player: GetCurrentPlayerId(),
        playerDisplayName: GetPlayerDisplayName()
    };
    actions.push(action);
    let actionIndex = actions.length - 1;

    await Promise.all([
        updateDoc(scenarioDocRef, { actions: actions }),
        AddStoryToPlayersList(),
        // AddPlayerContribution('Action', actionText, scenarioId, actionIndex); oldie system - remove
    ]);

    action.id = actionIndex;
    return action;

}
export async function addScenario(scenarioText, parentId, parentActionIndex) {

    //check to make sure parent is not already referencing a scenario
    const parentDocRef = await doc(db, ScenarioDocPath(parentId));
    const parentDoc = await getDoc(parentDocRef);
    const parentDocData = parentDoc.data();

    if (!parentDocData) {
        return ({ status: -1 });
    }

    const parentActionList = parentDocData.actions;

    if (parentActionList[parentActionIndex].scenarioID) {
        const newScenarioId = parentActionList[parentActionIndex].scenarioID;
        const newScenario = await getScenario(newScenarioId);
        return ({
            status: -2,
            newDocData: newScenario,
            newDocID: newScenarioId
        });
    }

    //add the new scenario as a document
    const newDocData = {
        text: scenarioText,
        parentScenarioID: parentId,
        parentActionIndex: parentActionIndex,
        time: new Date(),
        player: GetCurrentPlayerId(),
        playerDisplayName: GetPlayerDisplayName()
    }
    const docData = await addDoc(scenarioColl, newDocData)
    const newDocId = docData.id;

    if (!newDocId) {
        console.error('new scenario could not be added. "adddoc" firebase function return false');
        return ({ status: -1 });
    }

    //update the parent document so that action refs to new scenario
    parentActionList[parentActionIndex].scenarioID = newDocId;
    updateDoc(parentDocRef, { actions: parentActionList });

    //Update player data
    //await AddPlayerContribution('Scenario', scenarioText, newDocId); //old system - replace with story list
    await AddStoryToPlayersList(); // could run in parrallell for speed?

    //return a "success" response
    const response = {
        status: 0,
        newDocID: newDocId,
        newDocData: newDocData
    }
    return (response);

}
/*
export async function updateContentCounters(actionArray) {

    let promiseArray = [];

    actionArray.forEach(actionRef => {

        const promise = new Promise(async () => {

            const scenarioID = actionRef.scenarioID;
            const actionID = actionRef.actionID;
            const docRef = await doc(db, `${storyId}/${scenarioID}`)

            const currentScenarioData = await getScenario(scenarioID);
            let actions = currentScenarioData.actions;

            if (actions[actionID].scenarioCount) actions[actionID].scenarioCount++;
            else actions[actionID].scenarioCount = 1;

            await updateDoc(docRef, { actions: actions }) //gillar inte att man måste ersätta hela arrayen. Det vore smidigare om man bara kunde uppdatera en action.

        });

        promiseArray.push(promise);

    });

    Promise.all(promiseArray).
        then(() => {
            console.log('all actions updated');
        });

}
*/
export async function createNewStory(title, description, introduction, initialscenario) {

    const storyDocId = title.replace(/\s+/g, '');
    const scenarioCollPath = 'stories/' + storyDocId + '/scenarios';
    const storyColl = collection(db, scenarioCollPath);

    //check to make sure the story does not allready exist
    const querySnapshot = await getDocs(storyColl);
    if (querySnapshot.size > 0) {
        console.error('could not add the new story, name already exists');
        return -1;
    }

    //setup docs
    await Promise.all([
        setDoc(doc(db, scenarioCollPath, "start"), {
            text: initialscenario
        }),
        setDoc(doc(db, 'stories', storyDocId), {
            title: title,
            description: description,
            intro: introduction
        })
    ])
        .catch(err => {
            console.error('story could not be created, db gave an error:');
            console.error(err);
            return -2;
        })

    console.log('new story was created');

    return 0;
}

//UPDATE THE PLAYER DATABASE
async function AddPlayerContribution(type, text, scenarioDocId, actionId) { //old, can be removed

    //create doc data
    const newDocData = {
        text: text,
        story: currentStoryTitle,
        type: type,
        time: new Date(),
        storyCollectionID: currentStoryId,
        scenarioDocID: scenarioDocId,
    }

    if (typeof actionId !== 'undefined' && query) {
        newDocData.actionId = actionId;
    }

    //add to player contributions collection
    const coll = collection(db, '/players/' + GetCurrentPlayerId() + '/contributions');
    const docData = await addDoc(coll, newDocData)
    const newDocID = docData.id;

    //return error if it could not be added
    if (!newDocID) {
        console.error('data could not be added to the player profile');
        return ({ status: -1 });
    }

    //else return a "success" response
    const response = {
        status: 0,
        newDocID: newDocID,
        newDocData: newDocData
    }
    return (response);

}
export async function NotifyPlayer(playerId, storyId, text, scenarioId, actionId) {

    //make sure player is not already notified
    let notificationExist = false;
    const existingNotifications = await GetPlayerNotifications(playerId);
    if (existingNotifications) existingNotifications.forEach(notification => { //could remake into a for-loop that can break once we find a matching notification

        if (notification.storyId !== storyId) return;
        if (notification.scenarioId !== scenarioId) return;
        if (typeof actionId !== 'undefined' && typeof notification.actionId !== 'undefined') {
            if (notification.actionId === actionId) notificationExist = true;
        }
        else {
            notificationExist = true;
        }

    })

    if (notificationExist) return;

    //create doc data
    const newNotificationData = {
        storyId: storyId,
        time: new Date(),
        scenarioId: scenarioId,
        text: text,
        storyTitle: currentStoryTitle
    }
    if (typeof actionId !== 'undefined') newNotificationData.actionId = actionId;

    //add to player notifications collection
    const coll = collection(db, '/players/' + playerId + '/notifications');
    const docData = await addDoc(coll, newNotificationData)
    const newDocID = docData.id;

    //return error if it could not be added
    if (!newDocID) {
        console.error('notification could not be added to player: ' + playerId);
        return ({ status: -1, message: 'notification could not be added to player ' + playerId });
    }

    //else return a "success" response
    const response = {
        status: 0,
        newDocID: newDocID,
        newDocData: newNotificationData,
        message: 'notification successfully added to player with id=' + playerId
    }
    return (response);

}
export async function RemoveNotification(playerId, notificationId) {
    const response = await deleteDoc(doc(db, `players/${playerId}/notifications`, notificationId));
}
async function AddStoryToPlayersList() {

    if (playerHasAddedToThisStory) return;
    playerHasAddedToThisStory = true;

    //get current list
    const docRef = await doc(db, 'players/' + GetCurrentPlayerId());
    const playerDoc = await getDoc(docRef);

    let storyList = false;
    if (playerDoc.exists() && playerDoc.data().stories) {
        storyList = playerDoc.data().stories;
    }

    //Check if story its alread in the list
    if (storyList && storyList.includes(currentStoryId)) {
        return;
    }

    //Create an updated list
    let updatedStoryList
    if (storyList) {
        updatedStoryList = storyList;
        updatedStoryList.push(currentStoryId);
    }
    else {
        updatedStoryList = [currentStoryId];
    }

    //then set the doc with the new list
    await setDoc(doc(db, "players", GetCurrentPlayerId()), { stories: updatedStoryList });
}

//MONITOR
export async function monitorScenario(scenarioId, updateFunction) {

    const docRef = await doc(db, `${currentScenarioCollPath}/${scenarioId}`);
    await onSnapshot(docRef, doc => { updateFunction(doc.data()) });

}
export async function tryUnsubscribe() {
    if (unsubscribe) {
        await unsubscribe();
    }
}

//GET DATA - STORY
export async function GetScenarios(storyId) {

    const scenarioDocs = await getDocs(collection(db, ScenarioCollPath(storyId)));
    const scenarios = [];
    scenarioDocs.forEach(scenarioDoc => {
        const scenarioData = scenarioDoc.data();
        scenarioData.id = scenarioDoc.id;
        scenarios.push(scenarioData);
    })

    return scenarios;
}
export async function getScenario(scenarioId) {

    const docPath = `${currentScenarioCollPath}/${scenarioId}`;
    const docRef = await doc(db, docPath);
    const scenarioDoc = await getDoc(docRef);

    if (scenarioDoc.exists()) {
        return scenarioDoc.data();
    }
    else {
        console.error(`no doc data found for the given path ${docPath}`);
        return false;
    }

}
export async function getIntro(storyId) {

    if (currentStoryId === null) CheckForCollectionID();
    if (!storyId || typeof storyId === 'undefined') storyId = currentStoryId;

    const docRef = await doc(db, 'stories/' + storyId);
    const storyDoc = await getDoc(docRef);

    if (storyDoc.exists()) {
        return storyDoc.data().intro;
    }
    else {
        console.error(`no intro doc data found for story id ${storyId}`);
        return false;
    }

}
export async function getStories() {

    const querySnapshot = await getDocs(collection(db, "stories"));
    let stories = [];
    querySnapshot.forEach((storyDoc) => {
        if (storyDoc.id === 'TestStory' && (GetCurrentPlayerId() !== ('nTyZYjH3UXM1aIu4JoX5A5PaHXs2')) && (GetCurrentPlayerId() !== 'wc82MrqkQgU1wInBwiT9nogLVWH3')) return;
        stories.push(storyDoc);
    });
    return stories;

}
export async function getScenarioCount(scenarioId) {

    const coll = collection(db, ScenarioCollPath(scenarioId));
    const querySnapshot = await getDocs(coll);
    return querySnapshot.size;

}
export async function GetTitle(storyId) {

    const docRef = await doc(db, ('stories/' + storyId));
    const scenarioDoc = await getDoc(docRef);

    if (scenarioDoc.exists()) {
        return scenarioDoc.data().title;
    }
    else {
        console.error(`no doc data found for the given id ` + storyId);
        return false;
    }

}

//GET DATA - PLAYER
export async function GetPlayerContributions(playerId) {

    //JUST AN EXAMPLE
    const exampleEntry = {
        actionId: 0,
        scenarioDocID: 'start',
        story: 'TestStory',
        storyCollectionID: 'TestStory',
        text: 'Hello World!',
        time: 2022 - 03 - 14,
        type: 'Action'
    }

    //ADD THE CODE HERE
    //get list of stories that the player has contributed to
    const docRef = doc(db, "players", playerId);
    const docSnap = await getDoc(docRef);
    const storyList = [];
    if (docSnap.exists()) {
        if (docSnap.data().stories) {
            storyList = docSnap.data.stories();
        }
    }

    if (storyList.length === 0) return;

    const contributions = [];
    //iterate through every story
    await Promise.all(storyList.map(async (storyId) => {

        //Get the scenarios and the title of the story
        let scenarios;
        let title;
        await Promise.all([
            scenarios = await GetScenarios(storyId),
            title = await GetTitle(storyId)
        ])

        //iterate through each document in the story data
        scenarios.forEach(scenario => {
            //whenever a scenario occurs that has this players name on it - add it to the contributions list
            if (scenario.player === playerId){
                contributions.push({
                    scenarioDocID: scenario.id,
                    story: title,
                    storyCollectionID: storyId,
                    text: scenario.text,
                    time: scenario.time,
                    type: 'scenario'
                })
            }
            //do the same with action
            scenario.actions.forEach((action, actionId) => {
                if (action.player === playerId){
                    contributions.push({
                        actionId: actionId,
                        scenarioDocID: scenario.id,
                        story: title,
                        storyCollectionID: storyId,
                        text: action.action,
                        time: scenario.time, //This is wrong!!!! This is not when the ACTION was added. But this is not saved yet. So we have to start saving that
                        type: 'action'
                    })
                }
            })
        })
    }))

    return contributions;
}
export async function GetPlayerNotifications(playerId) {

    if (!playerId) console.error('You need to provide a player id in order to get their notifications');

    const querySnapshot = await getDocs(collection(db, "players/" + playerId + "/notifications"));

    let notifications = [];
    querySnapshot.forEach((doc) => {
        const notification = doc.data();
        notification.id = doc.id;
        notifications.push(notification);
    });

    return notifications;

}

//HELPER FUNCTIONS
function ScenarioCollPath(storyId) {
    return ('stories/' + storyId + '/scenarios');
}
function ScenarioDocPath(scenarioId) {
    return currentScenarioCollPath + '/' + scenarioId;
}