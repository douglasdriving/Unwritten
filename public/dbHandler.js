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
const scenarioCollection = collection(firestore, 'scenarios');

export async function getScenario(scenarioID) {
    const docRef = await doc(firestore, `scenarios/${scenarioID}`);
    const document = await getDoc(docRef);
    if (document.exists()) {
        const docData = document.data();
        return docData;
    }
    else {
        return 'the requested document does not exist';
    }
}

export async function addAction(scenarioID, actionText) {
    const docRef = await doc(firestore, `scenarios/${scenarioID}`);
    let actionIndex;
    await getScenario(scenarioID)
        .then(data => {
            let actions = data.actions || [];
            const action = { action: actionText };
            actions.push(action);
            updateDoc(docRef, { actions: actions });
            actionIndex = actions.length - 1;
        })
    return (actionIndex);
}

export async function addScenario(scenarioText, parentID, parentActionIndex) {
    //add the new scenario as a document
    const newDocData = {
        text: scenarioText,
        parentScenarioID: parentID,
        parentActionIndex: parentActionIndex,
        time: new Date()
    }
    const newDoc = await addDoc(scenarioCollection, newDocData);

    //update the parent document so that action refs to new scenario
    const parentDocRef = await doc(firestore, `scenarios/${parentID}`);
    const parentDoc = await getDoc(parentDocRef);
    const parentActionList = parentDoc.data().actions;
    parentActionList[parentActionIndex].scenarioID = newDoc.id;
    updateDoc(parentDocRef, { actions: parentActionList });

    return newDoc;

    //what happens if the parent already has a child ID???? now it would be overwritten
    //this function needs to be upgraded so that the scenario can only be added if it does not already exist
    //if it does already exist it should provide info about this as an error.
}

export async function monitorScenario(scenarioID, onUpdateFunction) {

    const docRef = await doc(firestore, `scenarios/${scenarioID}`);
    let unsubscribe;
    unsubscribe = await onSnapshot(docRef, document => {
        onUpdateFunction(document.data()); //adds the document as a param to the callback function passed in
    });
    return unsubscribe; //return the unsubscribe function as a promise to "monitorscenario"

}