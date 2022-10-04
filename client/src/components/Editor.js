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
import {getIt, getRef, doTransaction, addUser, doTransactionForAce, updateCode, updateLine} from '../firebase';
import { disableNetwork, onSnapshot, serverTimestamp, Timestamp, orderBy } from 'firebase/firestore';
import { runTransaction } from 'firebase/firestore';
import ace from "../../node_modules/ace-builds/src-noconflict/ace";
import { Range } from 'ace-builds';
import Button from '@mui/material/Button';
import ScrollableTabsButtonAuto from './Tabs';

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
            const ref = await getRef("newTemp", room_id);
            unsubscribe = onSnapshot(ref, (doc) => {
                const c = doc.data()[0];
                // console.log(c);
                if (c.who!==user_id && isNew===false){
                    if (c.language!==mode){
                        onModeChange(c.language);
                        editor.current.session.setMode(`ace/mode/${c.language}`);
                    }
                    if (c.filename!==fileName){
                        onFileNameChange(c.filename);
                    }
                    // const prev = editor.current.getScrollInfo();
                    // console.log(prev);
                    // const prevCursor = editor.current.getCursor();
                    // console.log(prevCursor);
                    // editor.current.setValue(c.code);
                    // editor.current.scrollTo(prev.left, prev.top);
                    // editor.current.setCursor({line: prevCursor.line, ch: prevCursor.ch});
                    applyingChanges.current = true;
                    if (lastUpdated.current<c.timestamp){
                        // if (c.delta!==null && lastUpdated.current<c.timestamp){
                        try{
                            // c.deltas.forEach((delta) => {
                            //     console.log(lastUpdated.current, delta.time);
                            //     console.log(lastUpdated.current<delta.time);
                            //     if (lastUpdated.current<delta.time<delta.user_id!==user_id){
                            //         console.log(delta);
                            //         console.log(lastUpdated.current);
                            //         delete delta.time;
                            //         delete delta.user_id;
                            //         editor.current.session.doc.applyDelta(delta);
                            //     }
                            // })
                            if (lastUpdated.current<c.delta.time<c.delta.user_id!==user_id){
                                delete c.delta.time;
                                delete c.delta.user_id;
                                var rev = editor.current.session.$undoManager.startNewGroup();
                                editor.current.session.doc.applyDelta(c.delta);
                                editor.current.session.$undoManager.markIgnored(rev);
                            }
                            // editor.current.getSession().setValue(c.code);
                            // console.log(editor.current.getSession().getValue());
                            updateCode(ref, editor.current.getSession().getValue());
                            lastUpdated.current = c.timestamp;
                        } catch(err){
                            console.log(err);
                        }
                    }
                } else if (c.who!==user_id && isNew==true){
                    onModeChange(c.language);
                    editor.current.session.setMode(`ace/mode/${c.language}`);
                    applyingChanges.current = true;
                    editor.current.session.setValue(c.code);
                    applyingChanges.current = false;
                    isNew = false;
                }
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
            // onSetupEditor(editor);

            // editor.setTheme("ace/theme/monokai");
            // editor.current.session.setMode("ace/mode/javascript");
            // const prev = document.getElementsByClassName('CodeMirror')[0];
            // if (prev!==undefined){
            //     prev.remove();
            // }
            // editor.current = Codemirror.fromTextArea(
            //     document.getElementById('realtime-editor'),
            //     {
            //         mode: { name: mode, json: true },
            //         theme: 'dracula',
            //         autoCloseTags: true,
            //         autoCloseBrackets: true,
            //         lineNumbers: true,
            //     }
            // );
            // onLineHeightChange(editor.current.defaultTextHeight());
            // editor.current.on('cursorActivity', (instance, obj) => {
            //     console.log(instance.doc.listSelections())
            //     const coords = instance.cursorCoords()
            //     addUser(room_id, user_id, username, coords.left, coords.top)
            // })

            editor.current.session.selection.on('changeCursor', (e) => {
                console.log(e);
                const lineNumber = editor.current.getCursorPosition().row;
                // if (prevLineNumber.current!==lineNumber){
                if (true){
                    addUser(room_id, user_id, username, lineNumber);
                    prevLineNumber.current = lineNumber;
                }
            })

            // editor.current.on('change', (instance, changes) => {
            //     // origin represents the kind of action
            //     const { origin } = changes;
            //     console.log(changes);
            //     const line = changes.from.line;
            //     const text = instance.getLine(line);
            //     // get the current code in editor
            //     const code = instance.getValue();
            //     onCodeChange(code);
            //     // If origin isn't setValue, then and then only
            //     // Why? Else this causes an infinite loop!

            //     async function callTransaction(code){
            //         await doTransaction(room_id, code, user_id, line, text);
            //     }
            //     if (origin!=='setValue'){
            //     //     // Emit this code
            //     //     socketRef.current.emit('code change', {
            //     //         room_id: room_id,
            //     //         code: code,
            //     //     })
            //         callTransaction(code);
            //     }
            // })

            async function applyDeltas(){
                console.log(deltas.current);
                await editor.current.session.doc.applyDeltas(deltas.current);
                deltas.current = [];
            }

            async function callTransForAce(delta){
                // single
                // await doTransactionForAce(room_id, delta, user_id);
                // multi
                await doTransactionForAce(room_id, delta, user_id, sessionID.current);
                // await updateLine(room_id, user_id, editor.getCursorPosition().row);
                // isSet.current = null;
                // await applyDeltas();
                // const text = await editor.current.getSession().getValue();
                // await doTransactionForAce(room_id, text, user_id);
                // isSet.current = null;
            }

            // function keyDownEvent(e){
            //     console.log(e);
            //     if (e.ctrlKey) {//Alt+c, Alt+v will also be disabled sadly.
            //         console.log("Control was pressed");
            //     }
            //     console.log("Keydown");
            // }

            // editor.current.container.addEventListener("keydown", keyDownEvent, true)

            // Marker
            // var range = new Range(0, 0, 1, 0);
            // console.log(range);
            // var marker = editor.current.session.addMarker(range, 'MyCursorClass');
            // console.log(marker);


            // Cursor line
            console.log(editor.current.getCursorPosition());
            // console.log(editor.current.getCursorPosition());
            // const cursor = editor.current.getCursorPosition();
            // const coords = editor.current.renderer.textToScreenCoordinates(cursor.row-270, cursor.column);
            // console.log(coords);
            // editor.current.renderer.setHighlightGutterLine(true)

            editor.current.on('change', (e) => {
                const time = Timestamp.fromDate(new Date());
                e.time = time;
                e.user_id = user_id;
                onCodeChange(editor.current.getSession().getValue());
                // console.log(editor.current.curOp.command.name!==undefined);
                // console.log(editor.current.curOp.args);
                // console.log(editor.current.curOp.args===undefined);
                // console.log(isSet, applyingChanges.current);
                if (applyingChanges.current===false){
                    // deltas.current.push(e);
                    // if (isSet.current===null){
                    //     // isSet.current = true;
                    //     // console.log("timeout set");
                    //     // timer.current = setTimeout(() => {
                    //     //     console.log("I timed out");
                    //     //     callTransForAce(deltas);
                    //     // }, 1000);
                    //     callTransForAce(e);
                    // }

                    // Apply the previous deltas, until then don't accept any strings
                    // Send the entire code to firebase
                    // const ref = await getRef("temp", room_id);
                    // updateCode(ref, editor.current.getSession().getValue());
                    callTransForAce(e);
                } else if (editor.current.curOp.args!==undefined){
                    deltas.current.push(e);
                    // callTransForAce(e);
                    console.log("This should be it");
                }
            })
        }

        init();
        return () => unsubscribe();
    }, []);

    console.log(sessions);
    async function createMarker(user, id){
        console.log(user);
        const gutter = document.getElementsByClassName('ace_scroller')[0];
        const b = document.createElement('div');
        b.id = id;
        b.classList.add('vl');
        const c  = document.createElement('div');
        c.classList.add('tooltip');
        c.innerText = user.username;
        const pos = editor.current.renderer.textToScreenCoordinates(user.line, 0);
        const y = pos.pageY-84.5;
        if (user_id in markerMap.current){
            b.style.borderLeft = `4.2px solid #${markerMap.current[user_id]}`;
            c.style.backgroundColor = `#${markerMap.current[user_id]}`;
        } else{
            var randomColor = Math.floor(Math.random()*16777215).toString(16);
            markerMap.current[user_id] = randomColor;
            console.log(markerMap.current);
            b.style.borderLeft = `4.2px solid #${randomColor}`;
            c.style.backgroundColor = `#${randomColor}`;
        }
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