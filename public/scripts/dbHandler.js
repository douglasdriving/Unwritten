//IMPORT FIREBASE METHODS
import { StartFirebase } from "/scripts/firebaseConfig.js?v=0.01";
import { getFirestore, collection, addDoc, doc, getDoc, getDocs, updateDoc, onSnapshot, setDoc, query, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-analytics.js";
import { GetCurrentPlayerId } from '/scripts/authHandler.js?v=0.01';

//VARIABLES
const app = StartFirebase();
const analytics = getAnalytics(app);
const db = getFirestore(app);
let storyCollectionID;
let scenarioCollection;
let currentStoryTitle;
let unsubscribe;

//RUN ON LOAD
logEvent(analytics, 'started_app');

//SETUP DATA FOR PLAY
function CheckForCollectionID() {
    var url_string = window.location.href; //window.location.href
    var url = new URL(url_string);
    var ID = url.searchParams.get("storyCollectionID");
    if (ID) setStory(ID);
}
export function setStory(collectionID) {

    storyCollectionID = collectionID;
    scenarioCollection = collection(db, storyCollectionID);
    setTitle();

    async function setTitle() {

        const storyList = await getStories();
        storyList.forEach(storyDoc => {
            if (storyDoc.collection === collectionID) {
                currentStoryTitle = storyDoc.title;
                return;
            }
        })

    }

}

//UPDATE THE DATABASE
export async function addAction(scenarioID, actionText) {

    const docRef = await doc(db, `${storyCollectionID}/${scenarioID}`)
    if (!docRef) {
        console.error('Attempted to add action, but a docref with the given scenario ID could not be found');
        return -1;
    }

    let actionIndex;
    const scenarioData = await getScenario(scenarioID);
    if (!scenarioData) {
        console.error('Attempted to add action, but a data for the given scenario ID could not be found');
        return -1;
    }

    let actions = scenarioData.actions || [];
    const action = {
        action: actionText,
        player: GetCurrentPlayerId()
    };
    actions.push(action);
    actionIndex = actions.length - 1;

    await updateDoc(docRef, { actions: actions })
    await AddPlayerContribution('Action', actionText, scenarioID, actionIndex);

    action.id = actionIndex;
    return action;

}
export async function addScenario(scenarioText, parentID, parentActionIndex) {

    //check to make sure parent is not already referencing a scenario
    const parentDocRef = await doc(db, `${storyCollectionID}/${parentID}`);
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
        parentScenarioID: parentID,
        parentActionIndex: parentActionIndex,
        time: new Date(),
        player: GetCurrentPlayerId()
    }
    const docData = await addDoc(scenarioCollection, newDocData)
    const newDocID = docData.id;

    if (!newDocID) {
        console.error('new scenario could not be added. "adddoc" firebase function return false');
        return ({ status: -1 });
    }

    //update the parent document so that action refs to new scenario
    parentActionList[parentActionIndex].scenarioID = newDocID;
    updateDoc(parentDocRef, { actions: parentActionList });

    //Update player data
    await AddPlayerContribution('Scenario', scenarioText, newDocID);

    //return a "success" response
    const response = {
        status: 0,
        newDocID: newDocID,
        newDocData: newDocData
    }
    return (response);

}
export async function updateContentCounters(actionArray) {

    /*
    adds +1 to the scenario counter in each action of the given array
    each entry in the array should be in this format:
    {
        scenarioID: [id],
        actionID: [id]
    }
    */

    let promiseArray = [];

    actionArray.forEach(actionRef => {

        const promise = new Promise(async () => {

            const scenarioID = actionRef.scenarioID;
            const actionID = actionRef.actionID;
            const docRef = await doc(db, `${storyCollectionID}/${scenarioID}`)

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
export async function createNewStory(title, description, introduction, initialscenario) {

    const collId = title;
    collId.replace(/\s+/g, '');

    const storyCollection = collection(db, collId);
    const querySnapshot = await getDocs(storyCollection);
    if (querySnapshot.size > 0) {
        console.error('could not add the new story, name already exists');
        return -1;
    }

    await Promise.all([
        setDoc(doc(db, collId, "start"), {
            text: initialscenario
        }),
        setDoc(doc(db, collId, "intro"), {
            text: introduction
        }),
        setDoc(doc(db, 'stories', collId), {
            title: title,
            description: description,
            collection: title,
        })
    ])
        .catch(err => {
            console.error('story could not be created, db gave an error:');
            console.error(err);
            return -2;
        })

    return 0;
}
async function AddPlayerContribution(type, text, scenarioDocId, actionId) {

    //create doc data
    const newDocData = {
        text: text,
        story: currentStoryTitle,
        type: type,
        time: new Date(),
        storyCollectionID: storyCollectionID,
        scenarioDocID: scenarioDocId,
    }

    if (typeof actionId !== 'undefined' && query) {
        newDocData.actionId = actionId;
        // console.log('made a contribution with an action index');
        // console.log(newDocData);
    }
    // else{
    //     console.log('action id is: ' + actionId);
    //     console.log('added player contribution without action id')
    // }

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
    const notificationExist = false;
    const existingNotifications = await GetPlayerNotifications();
    if (existingNotifications) existingNotifications.forEach(notification => {

        if (notification.storyId !== storyId) return;
        if (notification.scenarioId !== scenarioId) return;

        if (typeof actionId !== 'undefined') {
            if (notification.actionId === actionId) notificationExist = true;
        }
        else{
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
export async function RemoveNotification(playerId, notificationId){

    const response = await deleteDoc(doc(db, `players/${playerId}/notifications`, notificationId));
    console.log('tried deleting a notification doc. Response was:');
    console.log(response);

}

//MONITOR
export async function monitorScenario(scenarioID, updateFunction) {

    const docRef = await doc(db, `${storyCollectionID}/${scenarioID}`);

    await onSnapshot(docRef, doc => { updateFunction(doc.data()) });

}
export async function tryUnsubscribe() {
    if (unsubscribe) {
        await unsubscribe();
    }
}

//GET DATA
export async function getStoryData(collectionID) {

    const querySnapshot = await getDocs(collection(db, collectionID));

    let storyData = {};
    let iterations = 0;

    querySnapshot.forEach(doc => {
        const data = doc.data();
        if (doc.id === 'intro') storyData.intro = data.text;
        else if (doc.id === 'start') storyData.start = data;
    })

    storyData.start.id = 'start';

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
        querySnapshot.forEach(doc => {
            iterations++;
            if (doc.id === id) scenario = doc.data();
        })
        return scenario;
    }
}
export async function getScenario(scenarioID) {
    const docRef = await doc(db, `${storyCollectionID}/${scenarioID}`);
    const document = await getDoc(docRef);
    if (document.exists()) {
        const docData = document.data();
        return docData;
    }
    else {
        console.error(`no doc data found for the given path ${storyCollectionID}/${scenarioID}`);
        return false;
    }
}
export async function getIntro() {

    if (storyCollectionID === null) CheckForCollectionID();

    const docRef = await doc(db, `${storyCollectionID}/intro`);
    const document = await getDoc(docRef);

    if (document.exists()) {
        const introText = document.data().text;
        return introText;
    }
    else {
        console.error(`no intro doc data found for the current collectionID ${storyCollectionID}`);
        return false;
    }

}
export async function getStories() {
    const querySnapshot = await getDocs(collection(db, "stories"));
    let stories = [];
    querySnapshot.forEach((doc) => {
        stories.push(doc.data());
    });
    return stories;
}
export async function getScenarioCount(collectionID) {

    const coll = collection(db, collectionID);
    const querySnapshot = await getDocs(coll);
    return querySnapshot.size - 1;

}
export async function GetPlayerContributions(playerId) {

    const querySnapshot = await getDocs(collection(db, "players/" + playerId + "/contributions"));

    let contributions = [];
    querySnapshot.forEach((doc) => {
        contributions.push(doc.data());
    });

    return contributions;

}
export async function GetPlayerNotifications(playerId) {

    const querySnapshot = await getDocs(collection(db, "players/" + playerId + "/notifications"));

    let notifications = [];
    querySnapshot.forEach((doc) => {
        const notification = doc.data();
        notifications.id = doc.id;
        notifications.push(notification);
    });

    return notifications;

}