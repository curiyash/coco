import React, { useEffect, useRef } from 'react'
import Client from '../components/Client'
import { useState } from 'react'
import Editor from '../components/Editor'
import {v4 as uuid} from "uuid";
import { initSocket } from '../socket'
import ACTIONS from "../Actions";
import { useLocation, useNavigate, Navigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';
import FileSaver from 'file-saver';
import { mimeTypes } from './mimeTypes';
import { addUser, getRef, leftUser } from '../firebase'
import { onSnapshot } from 'firebase/firestore';
import AceEditor from "react-ace";
import { updateLang, updateNameOfFile } from '../firebase';

import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-dracula";
import "ace-builds/src-noconflict/ext-language_tools";

const EditorPage = () => {
    // useLocation: Like useState but for current URL
    // Just for grabbing info from current URL
    const options = [
        'textfile', 'javascript', 'python', 'erlang'
    ];
    const defaultOption = options[0];
    const location = useLocation();
    const codeRef = useRef(null);
    const { room_id } = useParams();
    const [clients, setClients] = useState([]);
    const [mode, setMode] = useState('textfile');
    const [fileName, setFileName] = useState("Untitled.txt");
    const reactNavigator = useNavigate();
    const left = useRef(263);
    const top = useRef(24);
    const line = useRef(0);
    let createMarker = null;
    const lineHeightRef = useRef("24px");

    // Initialize socket
    // useRef: does not rerender component when state changes
    // available on rerender
    const socketRef = useRef(null);
    useEffect(() => {
        const init = async() => {
            console.log("Trying to connect");
            socketRef.current = await initSocket();
            socketRef.current.on('connect_error', (err) => handleError(err));
            socketRef.current.on('connect_failed', (err) => handleError(err));

            function handleError(err){
                console.log(`Socket error: ${err}`);
                toast.error('Socket connection failed, try again later');
                reactNavigator("/");
            }

            // Ask to join in
            // We had passed username in state of location from Home
            addUser(room_id, location.state?.user_id, location.state?.username, line.current)
            socketRef.current.emit('join', {
                room_id: room_id,
                username: location.state?.username
            });
            toast.success("Aftermath");

            // Toast after a user joins in
            // POTENTIAL ISSUE
            // getUsers();
            // socketRef.current.on('joined', ({clients, username, socket_id}) => {
            //     if (username!==location.state.username){
            //         toast.success(`${username} has joined the room`);
            //     }
            //     setClients(clients);
            //     socketRef.current.emit('sync code', {
            //         socket_id: socket_id,
            //         code: codeRef.current
            //     });
            // });

            // For disconnecting
            // socketRef.current.on('disconnected', ({socket_id, username}) => {
            //     toast.success(`${username} has left the room`);
            //     setClients((prev) => {
            //         return prev.filter(
            //             (client) => client.socket_id!==socket_id
            //         )
            //     })
            // })

            // On mode change
            socketRef.current.on('mode change', ({newMode, code}) => {
                toast.success(`Switched to ${newMode}`);
                setMode(newMode);
                socketRef.current.emit('sync code after mode change', {
                    room_id,
                    code
                });
            })

            // On filename change
            socketRef.current.on('filename change', ({fileName}) => {
                toast.success(`Filename changed to ${fileName}`);
                setFileName(fileName);
            })

            window.addEventListener('beforeunload', async function(e){
                console.log("Refreshed");
                await leftUser(room_id, location.state?.user_id);
                e.preventDefault();
            })
        }

        async function setMarkers(c){
            // const markers = document.getElementsByClassName('vl');
            // console.log(markers);
            // if (markers){
            //     Array.from(markers).forEach((marker) => {
            //         marker.remove();
            //     })
            // }
            if (createMarker!==null){
                console.log("Setting markers");
                for (const uid in c){
                    const marker = document.getElementById(uid);
                    const scroller = document.getElementsByClassName("ace_scroller")[0];
                    try{
                        scroller.removeChild(marker);
                    } catch{
                        console.log("Not there");
                    }
                    console.log(marker);
                    const user = c[uid];
                    console.log(uid);
                    console.log(user);
                    if (location.state?.user_id!==uid){
                        await createMarker(user, uid);
                    }
                }
            }
        }

        let unsubscribe;
        async function getUsers(){
            const ref = await getRef("users", room_id);
            // if (username!==location.state.username){
            //     toast.success(`${username} has joined the room`);
            // }
            console.log("Ref");
            console.log(ref);
            unsubscribe = onSnapshot(ref, (doc) => {
                const c = doc.data();
                setMarkers(c);
                setClients(c);
            })
        }

        init();
        getUsers();
        // Always clear the listeners, else it causes memory leak
        return () => {
            socketRef.current.disconnect();
            socketRef.current.off('joined');
            socketRef.current.off('disconnected');
            unsubscribe();
        }
    }, []);

    async function copyRoomID(){
        try {
            await navigator.clipboard.writeText(room_id);
            toast.success("Copied Room ID");
        } catch (err){
            toast.error("Could not copy Room ID");
            console.error(err);
        }
    }

    async function leaveRoom(){
        await leftUser(room_id, location.state?.user_id);
        reactNavigator("/");
    }

    function _onSelect (option) {
        setMode(option.label);
        const newMode = option.label;
        console.log(option.label);
        // Send to Firebase
        updateLang(room_id, option.label);
        // socketRef.current.emit('mode change', {newMode, room_id, codeRef});
    }

    if (!location.state) {
        return <Navigate to="/"></Navigate>
    }

    function downloadCode(e){
        e.preventDefault();
        console.log(fileName);
        const code = codeRef.current;
        if (code===null || code===""){
            toast.error("There is no code!");
            return;
        }

        const mime = mimeTypes[mode];
        let blob = "";
        if (mime!==undefined){
            blob = new Blob([code], {type: `application/octet-stream;charset=utf-8`});
        } else{
            console.log(`Downloading as ${mimeTypes[mode]}`);
            blob = new Blob([code], {type: `${mimeTypes[mode]};charset=utf-8`});
        }
        FileSaver.saveAs(blob, fileName);
    }

    function updateFileName(e){
        setFileName(e.target.value);
    }

    function emitFileName(e){
        if (e.key==='Enter' || e.keyCode===13){
            // Emit the event
            // socketRef.current.emit('filename change', {room_id, fileName});
            updateNameOfFile(room_id, fileName);
        }
    }

    <Navigate></Navigate>

  return (
    <div className="mainWrap">
        <div className='aside'>
            <div className='asideInner'>
                <div className='logo'>
                    Logo Goes Here
                </div>
                <input type="text" value={fileName} onChange={updateFileName} onKeyUp={emitFileName}></input>
            </div>
            <h3>Connected</h3>
            <div className='clientsList'>
                {Object.entries(clients).map((client, id) => {
                    console.log(client[0]);
                    const c = client[1];
                    console.log(c);
                    if (client[0]!==location.state?.user_id){
                        return <Client key={id} username={c.username} tooltip={true} line={c.line} top={c.top}/>
                    } else{
                        return <Client key={id} username={c.username} tooltip={false} left={c.left} top={c.top} height={lineHeightRef.current}/>
                    }
                })}
            </div>
            <Dropdown options={options} value={mode} onChange={_onSelect} placeholder="Select an option" />
            <button className="btn copyBtn" onClick={copyRoomID}>Copy Room ID</button>
            <button className="btn leaveBtn" onClick={leaveRoom}>Leave the Room</button>
            <button className="btn" onClick={downloadCode}>Download</button>
        </div>
        <div className='editorWrap'>
            {console.log("Here")}
            <Editor isNew={location.state?.isNew} room_id={room_id} onCodeChange={(code) => {codeRef.current = code}} mode={mode} onModeChange={(mode) => {setMode(mode)}} user_id={location.state?.user_id} username={location.state?.username} onLineHeightChange={(height) => {lineHeightRef.current = height}} fileName={fileName} onFileNameChange={(fName) => {setFileName(fName)}} cM={(crm) => createMarker=crm}/>
        </div>
    </div>
  )
}

export default EditorPage;