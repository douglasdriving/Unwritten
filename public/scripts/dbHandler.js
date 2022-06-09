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
        console.error(`no doc data found for the given scenario`);
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

    await updateDoc(scenarioDocRef, { actions: actions })
    await AddPlayerContribution('Action', actionText, scenarioId, actionIndex);

    action.id = actionIndex;
    return action;

}
export async function addScenario(scenarioText, parentId, parentActionIndex) {

    //check to make sure parent is not already referencing a scenario
    const parentDocRef = await doc(db, ScenarioDocPath(parentId));
    const parentDoc = await getDoc(parentDocRef);
    const parentDocData = parentDoc.data();

    if (!parentDocData) {
        console.error('could not find the parent doc to add a ref to the new ID, so cant add a new one');
        return ({ status: -1 });
    }

    const parentActionList = parentDocData.actions;

    if (parentActionList[parentActionIndex].scenarioID) {
        console.error('the action already has an attached scenario ID! cant add a new one');
        return ({ status: -2, newDocID: parentActionList[parentActionIndex].scenarioID });
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
    await AddPlayerContribution('Scenario', scenarioText, newDocId);

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
async function AddPlayerContribution(type, text, scenarioDocId, actionId) {

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

    //old code - can remove later
    let storyData = {};
    let iterations = 0;

    scenarioDocs.forEach(doc => {
        if (doc.id === 'start') storyData.start = doc.data();;
    })

    storyData.intro = await getIntro(storyId);
    storyData.start.id = 'start';

    //ALL THIS WILL BE REMANUFACTURED ANYWAYS
    AttachScenariosBelow(storyData.start);
    console.log('number of iterations: ' + iterations);

    return storyData;

    function AttachScenariosBelow(scenario) {

        if (!scenario.actions) return;
        scenario.actions.forEach(a => {
            if (!a.scenarioID) return;
            const scenario = FindDocData(a.scenarioID);
            if (scenario) {
                a.scenario = scenario;
                a.scenario.id = a.scenarioID
                AttachScenariosBelow(scenario);
            }
        })

    }

    function FindDocData(id) {
        let scenario;
        scenarioDocs.forEach(doc => {
            iterations++;
            if (doc.id === id) scenario = doc.data();
        })
        return scenario;
    }
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

    const querySnapshot = await getDocs(collection(db, "players/" + playerId + "/contributions"));

    let contributions = [];
    querySnapshot.forEach((doc) => {
        contributions.push(doc.data());
    });

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