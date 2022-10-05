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
import { Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import {getIt, getRef, doTransaction, addUser, doTransactionForAce, updateCode, updateLine, initSession, updateSessions, setDelta, getQuery} from '../firebase';
import { disableNetwork, onSnapshot, serverTimestamp, Timestamp, orderBy, getDoc } from 'firebase/firestore';
import { runTransaction } from 'firebase/firestore';
import ace from "../../node_modules/ace-builds/src-noconflict/ace";
import { Range } from 'ace-builds';
import Button from '@mui/material/Button';
import ScrollableTabsButtonAuto from './Tabs';
import { onLog } from 'firebase/app';
import { query, where } from "firebase/firestore";

function FireBase(){
    // getMessages();
}

const Editor = ({isNew, room_id, onCodeChange, mode, onModeChange, user_id, username, onLineHeightChange, fileName, onFileNameChange, cM, onSessionChange}) => {
    // Initialize CodeMirror
    const editor = useRef(null);
    const text = useRef(null);
    const aceEditor = useRef(null);
    const lastUpdated = useRef(null);
    const applyingChanges = useRef(false);
    const timer = useRef(null);
    const isSet = useRef(null);
    const deltas = useRef([]);
    const prevLineNumber = useRef(0);
    const markerMap = useRef({});
    const [sessions, setSessions] = useState({'key':-1});
    const sessionID = useRef(0);
    // const [sessionID, setSessionID] = useState(0);

    // const style = {
    //     borderLeft: "6px solid green",
    //     height: `32px`,
    //     left: `4px`,
    //     top: `24px`,
    //     position: "absolute",
    //     zIndex: 10
    // }

    useEffect(() => {
        // FireBase();
        lastUpdated.current = Timestamp.fromDate(new Date(2022, 8, 2));
        // putIt();
        var unsubscribe;
        
        async function get(){
            // const ref = await getRef("temp", room_id);
            // const ref = await getRef("newTemp", room_id);
            const roomCode = (await getDoc(await(getRef("users", room_id)))).data();
            const ref = await getRef("users", room_id);
            unsubscribe = onSnapshot(ref, (doc) => {
                // 2.0: const c = doc.data()[0];
                // 3.0
                const c = doc.data();
                let maxTime = lastUpdated.current;
                // Get all user deltas and update them
                applyingChanges.current = true;
                Object.keys(c).forEach((uid, index) => {
                    const user_info = c[uid];
                    console.log(user_info);
                    const time = user_info.timeStamp;
                    if (!time){
                        return
                    }
                    if (time>maxTime){
                        maxTime = time;
                    }
                    console.log(lastUpdated.current<time);
                    if (uid!==user_id && isNew===false && lastUpdated.current<time){
                        if (true){
                            try{
                                user_info.delta.sort((a, b) => {
                                    if (a.time<b.time){
                                        return -1;
                                    } else if (a.time>b.time){
                                        return 1;
                                    } else{
                                        return 0;
                                    }
                                })
                                user_info.delta.forEach((d) => {
                                    if (lastUpdated.current<d.time){
                                        const tee = d.time;
                                        delete d.time;
                                        var rev = editor.current.session.$undoManager.startNewGroup();
                                        editor.current.session.doc.applyDelta(d);
                                        editor.current.session.$undoManager.markIgnored(rev);
                                        console.log(d.lines);
                                        lastUpdated.current = tee;
                                    }
                                })
                            } catch(err){
                                console.log(err);
                            }
                        }
                    } else if (uid!==user_id && isNew==true){
                        editor.current.session.setValue(roomCode.code);
                        lastUpdated.current = Timestamp.fromDate(new Date());
                        isNew = false;
                    }
                })
                applyingChanges.current = false;
            })
        }
        get();
        async function init(){
            editor.current = ace.edit("editor-ace");
            const mainSession = ace.createEditSession("");
            editor.current.setSession(mainSession);
            setSessions((prev) => {
                const key = prev.key+1;
                return {
                    ...prev,
                    [key]: mainSession,
                    key: key,
                };
            })

            async function applyDeltas(){
                console.log(deltas.current);
                await editor.current.session.doc.applyDeltas(deltas.current);
                deltas.current = [];
            }

            async function callTransForAce(delta){
                // single
                // await doTransactionForAce(room_id, delta, user_id);
                // multi
                if (delta===null){
                    alert("Delta is null");
                }
                await doTransactionForAce(room_id, delta, user_id, sessionID.current);
                // await setDelta(room_id, delta, user_id);
                updateCode(room_id, 0, editor.current.getSession().getValue());
            }

            editor.current.on('change', (e) => {
                onCodeChange(editor.current.getSession().getValue());
                if (applyingChanges.current===false){
                    const time = Timestamp.fromDate(new Date());
                    e.time = time;
                    callTransForAce(e);
                }
            })
        }

        init();
        return () => unsubscribe();
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
        const y = pos.pageY-84.5;
        if (user_id in markerMap.current){
            // console.log(markerMap);
            // console.log(user_id);
            // console.log(markerMap.current[user_id]);
            b.style.borderLeft = `4.2px solid #${markerMap.current[user_id]}`;
            c.style.backgroundColor = `#${markerMap.current[user_id]}`;
            // console.log("Already present");
        } else{
            var randomColor = Math.floor(Math.random()*16777215).toString(16);
            markerMap.current[user_id] = randomColor;
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

    // // useEffect for listening to a code change
    // useEffect(() => {
    //     if (socketRef.current!==null){
    //         socketRef.current.on('code change', ({code}) => {
    //             if (code!==null){
    //                 // Why the condition?
    //                 // If code was null by any chance, then
    //                 // entire user code would be overwritten
    //                 // set the code in current editor
    //                 editor.current.setValue(code);
    //             }
    //         })
    //     }

    //     return () => {
    //         socketRef.current.off('code change');
    //     }
    // }, [socketRef.current])

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

  return (
    <div>
        <ScrollableTabsButtonAuto className="tabs" sessions={sessions} editor={editor}/>
        <Button variant="contained" onClick={addNewSession}>+</Button>
        <div id="editor-ace">
            {/* <textarea id="realtime-editor">
            </textarea> */}
            {/* {update()} */}
        </div>
    </div>
  )
}

export default Editor;