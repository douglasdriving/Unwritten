import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js";
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCuHFWH47mYRwBWEbPjRgkwJw55-ph7ft4",
    authDomain: "unwritten-19096.firebaseapp.com",
    projectId: "unwritten-19096",
    storageBucket: "unwritten-19096.appspot.com",
    messagingSenderId: "252249876749",
    appId: "1:252249876749:web:cd0c902d44154409b9a844",
    measurementId: "G-R0ED9C7TE4"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore();
const scenarioCollectionID = 'testScenarios';
const scenarioCollection = collection(firestore, scenarioCollectionID);
let unsubscribe;

export async function getScenario(scenarioID) {
    const docRef = await doc(firestore, `${scenarioCollectionID}/${scenarioID}`);
    const document = await getDoc(docRef);
    if (document.exists()) {
        const docData = document.data();
        return docData;
    }
    else {
        return false;
    }
}

export async function addAction(scenarioID, actionText) {

    const docRef = await doc(firestore, `${scenarioCollectionID}/${scenarioID}`)
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
    const action = { action: actionText };
    actions.push(action);
    actionIndex = actions.length - 1;

    await updateDoc(docRef, { actions: actions })

    return actionIndex;
}

export async function addScenario(scenarioText, parentID, parentActionIndex) {
    //check to make sure parent is not already referencing a scenario
    const parentDocRef = await doc(firestore, `${scenarioCollectionID}/${parentID}`);
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
        time: new Date()
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
    const response = {
        status: 0,
        newDocID: newDocID
    }
    return (response);
}

export async function monitorScenario(scenarioID, onUpdateFunction) {

    const docRef = await doc(firestore, `${scenarioCollectionID}/${scenarioID}`);
    unsubscribe = await onSnapshot(docRef, document => {
        onUpdateFunction(document.data()); //adds the document as a param to the callback function passed in
    });
    if (unsubscribe) return true;
    else return false;

}

export async function tryUnsubscribe() {
    if (unsubscribe) {
        await unsubscribe();
    }
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
            const docRef = await doc(firestore, `${scenarioCollectionID}/${scenarioID}`)

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