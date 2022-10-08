import { initializeApp } from "firebase/app";
import { arrayUnion, deleteDoc, getFirestore, orderBy, query, Timestamp } from "firebase/firestore";
import { doc, getDoc, setDoc, deleteField, updateDoc } from "firebase/firestore";
import { collection, addDoc, getDocs } from "firebase/firestore"; 
import { runTransaction, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import { getDatabase, set, ref, update, remove, push, get, child } from "firebase/database";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
    apiKey: process.env.REACT_APP_APIKEY,
    authDomain: process.env.REACT_APP_AUTHDOMAIN,
    projectId: process.env.REACT_APP_PROJECTID,
    storageBucket: process.env.REACT_APP_STORAGEBUCKET,
    messagingSenderId: process.env.REACT_APP_MESSAGINGSENDERID,
    appId: process.env.REACT_APP_APPID,
    databaseURL: "https://coco-b36fd-default-rtdb.asia-southeast1.firebasedatabase.app/",
};

// const firebaseConfig = {
//     apiKey: "AIzaSyBmxFiRlRhoKatjPCh4PVTmd2Ve9QMkHtg",
//     authDomain: "coco2-c74a6.firebaseapp.com",
//     projectId: "coco2-c74a6",
//     storageBucket: "coco2-c74a6.appspot.com",
//     messagingSenderId: "156157178312",
//     appId: "1:156157178312:web:092d5245e1a09a7df3d0fd"
// };  

// const firebaseConfig = {
//   apiKey: "AIzaSyAnV3eDipX3IYxPubRY_TRUT7DGmPdQ-kY",
//   authDomain: "coco-b36fd.firebaseapp.com",
//   projectId: "coco-b36fd",
//   storageBucket: "coco-b36fd.appspot.com",
//   messagingSenderId: "766920222383",
//   appId: "1:766920222383:web:585e829e0e30452c36d65a"
// };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);
const realtimeDB = getDatabase(app);

// async function addUser(room_id, user_id, username, line){
//     const userRef = doc(db, "users", room_id);
//     await setDoc(userRef, {[user_id]: {username: username, line: line, delta: [], timeStamp: null}}, {merge: true});
// }

// async function leftUser(room_id, user_id){
//     const userRef = doc(db, "users", room_id);
//     const userData = (await getDoc(userRef)).data().username
//     // console.log(user_id);
//     // console.log("Deleting field");
//     toast.success(`Left the room`);
//     await updateDoc(userRef, {
//         [user_id]: deleteField()
//     });
// }

async function getIt(room_id){
    // const querySnapshot = await getDocs(collection(db, "temp"));
    //     querySnapshot.forEach((doc) => {
    //     console.log(`${doc.id} => ${doc.data()}`);
    // });
    const docRef = doc(db, "temp", room_id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        // console.log("Document data:", docSnap.data());
        return docSnap.data();
    } else {
        // doc.data() will be undefined in this case
        // console.log("No such document!");
    }
}

// async function getRef(collection_name, room_id){
//     const docRef = doc(db, collection_name, room_id);
//     return docRef;
// }

// async function updateCode(room_id, sessionID, code, time){
//     console.log(code);
//     const roomRef = doc(db, "newTemp", room_id);
//     await updateDoc(roomRef, {
//         [`${sessionID}.code`]: code,
//         [`${sessionID}.timeStamp`]: time,
//     })
// }

async function doTransaction(room_id, code, who, line, text){
    try {
        await runTransaction(db, async (transaction) => {
            const docRef = doc(db, "temp", room_id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()){
                console.error("Document does not exist");
            }
            const data = docSnap.data();
            data.code = code;
            data.who = who;
            // console.log(line, text, text[String(line)]);
            data.text[line] = text;
            // console.log(data);
            transaction.update(docRef, data);
        });
        // alert("Transaction completed successfully");
    } catch(e){
        console.error(e);
    }
}

// async function doTransactionForAce(room_id, delta, who){
//     try {
//         await runTransaction(db, async (transaction) => {
//             const docRef = doc(db, "temp", room_id);
//             const docSnap = await getDoc(docRef);
//             if (!docSnap.exists()){
//                 console.error("Document does not exist");
//             }
//             const data = docSnap.data();
//             // data.code = code;
//             data.delta = delta;
//             data.who = who;
//             const timestamp = serverTimestamp();
//             data.timestamp = timestamp;
//             // console.log(line, text, text[String(line)]);
//             // data.text[line] = text;
//             // console.log(data);
//             transaction.update(docRef, data);
//         });
//         // alert("Transaction completed successfully");
//     } catch(e){
//         console.error(e);
//     }
// }

// async function doTransactionForAce(room_id, delta, who, sessionID){
//     try {
//         await runTransaction(db, async (transaction) => {
//             const docRef = doc(db, "newTemp", room_id);
//             const docSnap = await getDoc(docRef);
//             if (!docSnap.exists()){
//                 console.error("Document does not exist");
//             } else{
//                 console.log("Document exists");
//             }
//             const data = docSnap.data()[sessionID];
//             console.log(data);
//             // data.code = code;
//             data.delta = delta;
//             data.who = who;
//             const timestamp = serverTimestamp();
//             data.timestamp = timestamp;
//             // console.log(line, text, text[String(line)]);
//             // data.text[line] = text;
//             // console.log(data);
//             transaction.update(docRef, {
//                 [sessionID]: data,
//             });
//         });
//         // alert("Transaction completed successfully");
//     } catch(e){
//         console.error(e);
//     }
// }

// Schema for concurrent users
// async function doTransactionForAce(room_id, delta, who, sessionID){
//     try {
//         await runTransaction(db, async (transaction) => {
//             const docRef = doc(db, "users", room_id);
//             // const docRef = doc(db, "newTemp", room_id);
//             const docSnap = await getDoc(docRef);
//             if (!docSnap.exists()){
//                 console.error("Document does not exist");
//             } else{
//                 // console.log("Document exists");
//             }
//             const data = docSnap.data();
//             // const data = docSnap.data()[0];
//             const user = data[who]["delta"];
//             // const user = data["deltas"];
//             // console.log(user);
//             user.push(delta);
//             // console.log(user);
//             const timestamp = serverTimestamp();
//             transaction.update(docRef, {
//                 [`${who}.delta`]: user,
//                 [`${who}.timeStamp`]: timestamp,
//             });
//         });
//     } catch(e){
//         console.error(e);
//     }
// }

// Schema for concurrent users with batch of delta
// async function doTransactionForAce(room_id, deltas, who, time){
//     try {
//         await runTransaction(db, async (transaction) => {
//             const docRef = doc(db, "users", room_id);
//             // const docRef = doc(db, "newTemp", room_id);
//             const docSnap = await getDoc(docRef);
//             if (!docSnap.exists()){
//                 console.error("Document does not exist");
//             } else{
//                 // console.log("Document exists");
//             }
//             const data = docSnap.data();
//             // const data = docSnap.data()[0];
//             const user = data[who]["delta"];
//             // const user = data["deltas"];
//             // console.log(user);
//             console.log(deltas);
//             const toAdd = {time: time, deltas: deltas};
//             user.push(toAdd);
//             // console.log(user);
//             const timestamp = serverTimestamp();
//             transaction.update(docRef, {
//                 [`${who}.delta`]: user,
//                 [`${who}.timeStamp`]: timestamp,
//             });
//         });
//     } catch(e){
//         console.error(e);
//     }
// }

// Sorting by seconds
// async function doTransactionForAce(room_id, delta, who, time){
//     try {
//         await runTransaction(db, async (transaction) => {
//             const docRef = doc(db, "users", room_id);
//             // const docRef = doc(db, "newTemp", room_id);
//             const docSnap = await getDoc(docRef);
//             if (!docSnap.exists()){
//                 console.error("Document does not exist");
//             } else{
//                 // console.log("Document exists");
//             }
//             const tim = Timestamp.fromDate(new Date());
//             const data = docSnap.data();
//             // const data = docSnap.data()[0];
//             const user = data[who]["delta"];
//             if (!(tim.seconds in user)){
//                 user[tim.seconds] = [];
//             }
//             const toAdd = {
//                 nanoseconds: tim.nanoseconds,
//                 delta: delta,
//             }
//             user[tim.seconds].push(toAdd);
//             const timestamp = serverTimestamp();
//             transaction.update(docRef, {
//                 [`${who}.delta.${tim.seconds}`]: user[tim.seconds],
//                 [`${who}.timeStamp`]: timestamp,
//             });
//         });
//     } catch(e){
//         console.error(e);
//     }
// }

async function setDelta(room_id, delta, who){
    const docRef = doc(db, "users", room_id);
    const data = (await getDoc(docRef)).data();
    // console.log(who);
    const user = data[who]["delta"];
    user.push(delta);
    // delta.time = serverTimestamp();
    // console.log(delta);
    const timestamp = serverTimestamp();
    await updateDoc(docRef, {
        [`${who}.delta`]: user,
        [`${who}.timeStamp`]: timestamp,
    })
}

// async function createRoom(room_id){
//     const roomRef = doc(db, "temp", room_id);
//     const data = {
//         code: "",
//         language: "textfile",
//         queue: [],
//         who: "",
//         delta: null,
//         filename: "Untitled.txt"
//     }
//     await setDoc(roomRef, data);
// }

// async function createRoom(room_id){
//     const roomRef = doc(db, "newTemp", room_id);
//     const time = Timestamp.fromDate(new Date());
//     const data = {
//         0: {
//             code: "",
//             language: "text",
//             queue: [],
//             who: "",
//             deltas: [],
//             filename: "Untitled.txt",
//             key: 0,
//             timeStamp: time,
//         }
//     }
//     await setDoc(roomRef, data);
// }


// async function updateLang(room_id, lang){
//     const roomRef = doc(db, "temp", room_id);
//     await updateDoc(roomRef, {
//         language: lang
//     })
// }

// async function updateLang(room_id, lang, sessionID){
//     const roomRef = doc(db, "newTemp", room_id);
//     await updateDoc(roomRef, {
//         [`${sessionID}.language`]: lang,
//     })
// }

// async function updateNameOfFile(room_id, filename){
//     const roomRef = doc(db, "temp", room_id);
//     console.log("Changing Filename");
//     await updateDoc(roomRef, {
//         filename: filename
//     })
// }

// async function updateNameOfFile(room_id, filename, sessionID){
//     const roomRef = doc(db, "newTemp", room_id);
//     console.log("Changing Filename");
//     await updateDoc(roomRef, {
//         [`${sessionID}.filename`]: filename
//     })
// }

// async function updateCode(room_id, code){
//     const roomRef = doc(db, "temp", room_id);
//     await updateDoc(roomRef, {
//         code: code,
//     })
// }

// async function createSession(room_id, sessionID, session){
//     try {
//         await runTransaction(db, async (transaction) => {
//             const roomRef = doc(db, "newTemp", room_id);
//             const roomSnap = (await getDoc(roomRef)).data();
//             // console.log("Adding new session");s
//             const newKey = roomSnap.key+1;
//             const data = {
//                 code: "",
//                 language: "textfile",
//                 queue: [],
//                 who: "",
//                 delta: null,
//                 filename: "Untitled.txt",
//                 key: newKey
//             }
//             transaction.update(roomRef, {
//                 [newKey]: data,
//             })
//         })
//     } catch (err){
//         console.error(err);
//     }
// }

async function initSession(){

}

async function createSession(){
    
}

async function updateSessions(room_id, sessionID, newSession){
    try {
        await runTransaction(db, async (transaction) => {
            const sessionsRef = doc(db, "sessions", room_id);
            const sessionsSnap = (await getDoc(sessionsRef)).data();
            // console.log(sessionsSnap.key);
            const newKey = sessionsSnap.key+1;
            if (!sessionsSnap.exists()){
                console.error("Document does not exist");
            } else{
                // console.log("Document exists");
            }
            transaction.update(sessionsRef, {
                [newKey]: newSession,
                key: newKey
            });
            await createSession(room_id, newKey, newSession);
        });
    } catch(e){
        console.error(e);
    }
}

async function getQuery(room_id, uid){
    const d = doc(db, "users", room_id, uid, "delta");
    const c = query(d, orderBy('time'));
    // console.log(c);
}

async function createRoom(room_id){
    const time = serverTimestamp();
    set(ref(realtimeDB, 'rooms/' + room_id), {
        code: "",
        lastChange: null,
        timeStamp: time,
        filename: "Untitled.txt",
        mode: 'text',
        isUpload: false,
    });
    set(ref(realtimeDB, 'roomies/'+room_id), []);
}

async function addUser(room_id, user_id, username, line){
    const userObj = {
        username: username,
        "line": line,
    }
    update(ref(realtimeDB, 'roomies/'+room_id), {
        [user_id]: userObj,
    });
    const user = {
        "username": username,
        "delta": {},
    }
    set(ref(realtimeDB, `users/${room_id}/${user_id}`), user);
}

async function updateUser(room_id, user_id, line){
    update(ref(realtimeDB, `roomies/${room_id}/${user_id}`), {
        line: line
    });
}

async function getRef(path){
    // console.log(path);
    try{
        const docRef = ref(realtimeDB, path);
        return docRef;
    } catch(err){
        return null;
    }
}

async function leftUser(room_id, user_id){
    const roomRef = ref(realtimeDB, `roomies/${room_id}/${user_id}`);
    const userRef = ref(realtimeDB, `users/${room_id}/${user_id}`);
    // console.log(user_id);
    // console.log("Deleting field");
    // await updateDoc(userRef, {
    //     [user_id]: deleteField()
    // });
    toast.success(`Left the room`);
    try{
        await remove(userRef);
        await remove(roomRef);
    } catch (err){
        // console.log(err);
    }
}

async function doTransactionForAce(room_id, delta, who, sessionID){
    const roomRef = ref(realtimeDB, `users/${room_id}/${who}/delta`);
    const newDelta = push(roomRef);
    // console.log(delta);
    await set(newDelta, delta);
}

async function updateCode(room_id, sessionID, code, time, user_id, isUpload){
    // console.log(code);
    // const roomRef = doc(db, "newTemp", room_id);
    const roomRef = ref(realtimeDB, `rooms/${room_id}`);
    await update(roomRef, {
        code: code,
        timeStamp: time,
        who: user_id,
        isUpload: isUpload,
    })
}

async function getCode(room_id){
    const dbRef = ref(realtimeDB);
    let code = "";
    await get(child(dbRef, `rooms/${room_id}`)).then((snapshot) => {
        if (snapshot.exists()) {
            code = snapshot.val();
        } else {
            // console.log("No data available");
        }
    }).catch((error) => {
        console.error(error);
    });
    return code;
}

async function updateNameOfFile(room_id, filename, sessionID){
    const roomRef = ref(realtimeDB, `rooms/${room_id}`);
    // console.log("Changing Filename");
    await update(roomRef, {
        filename: filename,
    })
}

async function updateLang(room_id, mode, sessionID){
    const roomRef = ref(realtimeDB, `rooms/${room_id}`);
    // console.log("Changing Mode");
    await update(roomRef, {
        mode: mode,
    })
}

export {updateUser, getCode, getQuery, setDelta, getIt, getRef, doTransaction, addUser, leftUser, createRoom, doTransactionForAce, updateCode, updateLang, updateNameOfFile, updateSessions, initSession};
