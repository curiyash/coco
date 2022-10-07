import React, { useEffect, useRef, useState } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import "./Editor.css"

// Language modes
import 'codemirror/mode/javascript/javascript.js'
import 'codemirror/mode/ruby/ruby.js'
import 'codemirror/mode/swift/swift.js'
import 'codemirror/mode/clojure/clojure.js'
import 'codemirror/mode/python/python.js'
import 'codemirror/mode/php/php.js'
import 'codemirror/mode/erlang/erlang.js'
import 'codemirror/mode/coffeescript/coffeescript.js'
import 'codemirror/mode/crystal/crystal.js'

import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import toast from 'react-hot-toast';
import {getIt, getRef, doTransaction, addUser, doTransactionForAce, updateCode, updateLine, initSession, updateSessions, setDelta, getQuery, getCode, updateUser} from '../firebase';
import { disableNetwork, onSnapshot, serverTimestamp, Timestamp, orderBy, getDoc } from 'firebase/firestore';
import { runTransaction } from 'firebase/firestore';
import ace from "../../node_modules/ace-builds/src-noconflict/ace";
import { Range, require } from 'ace-builds';
import Button from '@mui/material/Button';
import ScrollableTabsButtonAuto from './Tabs';
import { onLog } from 'firebase/app';
import { query, where } from "firebase/firestore";
import { off, onValue, get, update } from 'firebase/database';
import Dropdown from 'react-dropdown';
import "ace-builds/src-noconflict/theme-dracula";
import { Stack, TextField } from '@mui/material';

const themes = ['ambiance', 'chaos', 'chrome', 'cloud9_day', 'cloud9_night', 'cloud9_night_low_color', 'clouds', 'clouds_midnight', 'cobalt', 'crimson_editor', 'dawn', 'dracula', 'dreamweaver', 'eclipse', 'github', 'gob', 'gruvbox', 'gruvbox_dark_hard', 'gruvbox_light_hard', 'idle_fingers', 'iplastic', 'katzenmilch', 'kr_theme', 'kuroir', 'merbivore', 'merbivore_soft', 'monokai', 'mono_industrial', 'nord_dark', 'one_dark', 'pastel_on_dark', 'solarized_dark', 'solarized_light', 'sqlserver', 'terminal', 'textmate', 'tomorrow', 'tomorrow_night', 'tomorrow_night_blue', 'tomorrow_night_bright', 'tomorrow_night_eighties', 'twilight', 'vibrant_ink', 'xcode']

themes.forEach((theme) => {
    require(`ace-builds/src-noconflict/theme-${theme}`);
})

const Editor = ({isNew, room_id, onCodeChange, mode, onModeChange, user_id, username, onLineHeightChange, fileName, onFileNameChange, cM, onSessionChange, onUploadInit}) => {
    // Initialize CodeMirror
    const editor = useRef(null);
    const newUser = useRef(true);
    const text = useRef(null);
    const aceEditor = useRef(null);
    const lastUpdated = useRef(Timestamp.fromDate(new Date(2022, 8, 2)));
    const applyingChanges = useRef(false);
    const timer = useRef(false);
    const isSet = useRef(null);
    const deltas = useRef([]);
    const prevLineNumber = useRef(0);
    const markerMap = useRef({});
    const [sessions, setSessions] = useState({'key':-1});
    const sessionID = useRef(0);
    const [theme, setTheme] = useState('dracula');
    const [fontSize, setFontSize] = useState(12);
    // const [sessionID, setSessionID] = useState(0);

    // const style = {
    //     borderLeft: "6px solid green",
    //     height: `32px`,
    //     left: `4px`,
    //     top: `24px`,
    //     position: "absolute",
    //     zIndex: 10
    // }

    function _onSelectTheme(option) {
        setTheme(option.label);
        editor.current.setTheme(`ace/theme/${option.label}`);
    }

    async function onUpload(code){
        const time = Timestamp.fromDate(new Date());
        applyingChanges.current = true;
        editor.current.session.setValue(code);
        updateCode(room_id, 0, editor.current.getSession().getValue(), time, user_id, true);
        applyingChanges.current = false;
    }

    onUploadInit(onUpload);

    useEffect(() => {
        // FireBase();
        // putIt();
        var unsubscribe;
        var unsubscribe2;
        var modeChange;
        var fileNameChange;
        var uploadChange;
        let ref;
        let code;
        let modeRef;
        let fileNameRef;
        let uploadRef;

        async function getUpdates(c){
            let maxTime = lastUpdated.current;
            // console.log("Maxtime initialized", maxTime);
            async function mapUsers(){
                if (c!==null){
                    Object.keys(c).forEach((uid, index) => {
                        const user_info = c[uid];
                        // console.log(user_info);
                        // console.log(uid, user_id);
                        if (uid!==user_id && newUser.current===false){
                            if ("delta" in user_info){
                                try{
                                    Object.values(user_info.delta).forEach((d) => {
                                        let truth = false;
                                        // console.log(lastUpdated.current, d.time);
                                        if (lastUpdated.current.seconds<d.time.seconds){
                                            // console.log("Here1");
                                            truth = true;
                                        } else if (lastUpdated.current.seconds===d.time.seconds && lastUpdated.current.nanoseconds<d.time.nanoseconds){
                                            // console.log("Here2");
                                            truth = true;
                                        }
                                        // console.log(d, truth);
                                        if (truth===true){
                                            const tee = d.time;
                                            delete d.time;
                                            var rev = editor.current.session.$undoManager.startNewGroup();
                                            editor.current.session.doc.applyDelta(d);
                                            editor.current.session.$undoManager.markIgnored(rev);
                                            if (tee.seconds>maxTime.seconds){
                                                maxTime = tee;
                                            } else if (tee.seconds===maxTime.seconds && tee.nanoseconds>maxTime.nanoseconds){
                                                maxTime = tee;
                                            }
                                        }
                                    })
                                } catch(err){
                                    console.log(err);
                                }
                            }
                        }
                    })
                }
            }

            applyingChanges.current = true;
            await mapUsers();
            // console.log("Maxtime updated", maxTime, "lastUpdated", lastUpdated.current);
            lastUpdated.current = maxTime;
            // console.log("lastUpdated updated ", lastUpdated.current);
            applyingChanges.current = false;
        }
        
        // async function get(){
        //     // const ref = await getRef("temp", room_id);
        //     // const ref = await getRef("newTemp", room_id);
        //     const roomCode = (await getDoc(await getRef("newTemp", room_id))).data()[0];
        //     const ref = await getRef("users", room_id);
        //     const roomRef = await getRef("newTemp", room_id);
        //     unsubscribe = onSnapshot(ref, (doc) => {
        //         // 2.0: const c = doc.data()[0];
        //         // 3.0
        //         const c = doc.data();
        //         console.log(c);

        //         if (newUser.current==true){
        //             // console.log(roomCode);
        //             applyingChanges.current = true;
        //             editor.current.session.setValue(roomCode.code);
        //             lastUpdated.current = Timestamp.fromDate(new Date());
        //             applyingChanges.current = false;
        //             newUser.current = false;
        //         } else{
        //             // Get all user deltas and update them
        //             getUpdates(c);
        //         }
        //     })
        // }
        async function getFunc(){
            // const ref = await getRef("temp", room_id);
            // const ref = await getRef("newTemp", room_id);
            ref = await getRef(`users/${room_id}`);
            code = await getCode(room_id);
            modeRef = await getRef(`rooms/${room_id}/mode`);
            fileNameRef = await getRef(`rooms/${room_id}/filename`);
            uploadRef= await getRef(`rooms/${room_id}/isUpload`);

            uploadChange = onValue(uploadRef, (snapshot) => {
                const status = snapshot.val();
                if (status===true){
                    async function gettingUpload(){
                        // console.log("Trying to call");
                        const upload = await getCode(room_id);
                        // console.log(upload);
                        applyingChanges.current = true;
                        editor.current.session.setValue(upload.code);
                        lastUpdated.current = upload.timeStamp;
                        applyingChanges.current = false;
                    }
                    gettingUpload();
                }
            })

            modeChange = onValue(modeRef, (snapshot) => {
                const mode = snapshot.val();
                editor.current.session.setMode(`ace/mode/${mode}`);
                onModeChange(mode);
            })
            fileNameChange = onValue(fileNameRef, (snapshot) => {
                onFileNameChange(snapshot.val());
            })
            unsubscribe = onValue(ref, (snapshot) => {
                if (newUser.current==true){
                    // console.log(roomCode);
                    applyingChanges.current = true;
                    editor.current.session.setValue(code.code);
                    lastUpdated.current = Timestamp.fromDate(new Date());
                    applyingChanges.current = false;
                    newUser.current = false;
                }
                const c = snapshot.val();
                getUpdates(c);
            })
        }
        getFunc();
        async function init(){
            editor.current = ace.edit("editor-ace");
            const mainSession = ace.createEditSession("");
            editor.current.setTheme(`ace/theme/dracula`);
            editor.current.setSession(mainSession);
            setSessions((prev) => {
                const key = prev.key+1;
                return {
                    ...prev,
                    [key]: mainSession,
                    key: key,
                };
            })

            async function callTransForAce(delta){
                // single
                // await doTransactionForAce(room_id, delta, user_id);
                // multi
                if (delta===null){
                    alert("Delta is null");
                    return;
                }
                // console.log("Calling a transaction");
                await doTransactionForAce(room_id, delta, user_id, sessionID.current);
                // await setDelta(room_id, delta, user_id);
                updateCode(room_id, 0, editor.current.getSession().getValue(), delta.time, user_id, false);
            }

            editor.current.session.selection.on('changeCursor', (e) => {
                const lineNumber = editor.current.getCursorPosition().row;
                // if (prevLineNumber.current!==lineNumber){
                if (true){
                    updateUser(room_id, user_id, lineNumber);
                }
            })

            editor.current.on('change', (e) => {
                onCodeChange(editor.current.getSession().getValue());
                if (applyingChanges.current===false){
                    // Create a timestamp, set the timer, add all deltas to that timestamp
                    // e.user_id = user_id;
                    e.time = Timestamp.fromDate(new Date());
                    callTransForAce(e);
                } else{
                    // console.log("This input wasn't logged or was injected");
                }
            })
        }

        init();
        return () => {
            off(ref);
            off(modeRef)
            off(fileNameRef)
            off(uploadRef)
        };
    }, []);

    // console.log(sessions);
    async function createMarker(user, id){
        // console.log(user);
        const gutter = document.getElementsByClassName('ace_scroller')[0];
        const b = document.createElement('div');
        b.id = id;
        b.classList.add('vl');
        const c  = document.createElement('div');
        c.classList.add('tooltip');
        c.innerText = user.username;
        const pos = editor.current.renderer.textToScreenCoordinates(user.line, 0);
        // console.log(pos.pageY);
        const y = pos.pageY-39.2;
        if (id in markerMap.current){
            // console.log(markerMap);
            // console.log(user_id);
            // console.log(markerMap.current[user_id]);
            b.style.borderLeft = `4.2px solid #${markerMap.current[id]}`;
            c.style.backgroundColor = `#${markerMap.current[id]}`;
            // console.log("Already present");
        } else{
            var randomColor = Math.floor(Math.random()*16777215).toString(16);
            markerMap.current[id] = randomColor;
            // console.log(markerMap.current);
            b.style.borderLeft = `4.2px solid #${randomColor}`;
            c.style.backgroundColor = `#${randomColor}`;
            // console.log("Adding to markers");
        }
        window.markerMap = markerMap;
        b.style.height = `${editor.current.renderer.lineHeight}px`;
        b.style.position = "absolute";
        b.style.top = `${y}px`;
        b.style.zIndex = "10";
        b.appendChild(c);
        gutter.appendChild(b);
    }

    cM(createMarker);

    function addNewSession(){
        const newSession = ace.createEditSession("");
        editor.current.setSession(newSession);
        setSessions((prev) => {
            const key = prev.key+1;
            return {
                ...prev,
                [key]: newSession,
                key: key,
            };
        })
        // Send to Firebase
    }

    async function addNewSession(){
        const newSession = ace.createEditSession("");
        editor.current.setSession(newSession);
        setSessions((prev) => {
            const key = prev.key+1;
            return {
                ...prev,
                [key]: newSession,
                key: key,
            };
        })
        // Send to Firebase
        await updateSessions(room_id, sessionID, newSession);
    }

    function changeFontSize(e){
        // console.log("I'm called");
        setFontSize(e.target.value);
        editor.current.setFontSize(`${e.target.value<10?10:e.target.value}px`);
        // setFontSize(e.target.value<10?10:e.target.value);
    }

  return (
    <div>
        <Stack direction="row" spacing={1}>
            <Dropdown options={themes} value={theme} onChange={_onSelectTheme} placeholder="Select an option" className="dropdown"/>
            <input type="number" min={10} value={fontSize} onChange={changeFontSize}></input>
        </Stack>
        {/* <ScrollableTabsButtonAuto className="tabs" sessions={sessions} editor={editor}/> */}
        {/* <Button variant="contained" onClick={addNewSession}>+</Button> */}
        <div id="editor-ace">
        </div>
    </div>
  )
}

export default Editor;