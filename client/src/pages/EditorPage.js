import React, { useEffect, useRef } from 'react'
import Client from '../components/Client'
import { useState } from 'react'
import Editor from '../components/Editor'
import { initSocket } from '../socket'
import ACTIONS from "../Actions";
import { useLocation, useNavigate, Navigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';
import FileSaver from 'file-saver';
import { mimeTypes } from './mimeTypes'

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
            socketRef.current.emit('join', {
                room_id: room_id,
                username: location.state?.username
            });
            toast.success("Aftermath");

            // Toast after a user joins in
            socketRef.current.on('joined', ({clients, username, socket_id}) => {
                if (username!==location.state.username){
                    toast.success(`${username} has joined the room`);
                }
                setClients(clients);
                socketRef.current.emit('sync code', {
                    socket_id: socket_id,
                    code: codeRef.current
                });
            });

            // For disconnecting
            socketRef.current.on('disconnected', ({socket_id, username}) => {
                toast.success(`${username} has left the room`);
                setClients((prev) => {
                    return prev.filter(
                        (client) => client.socket_id!==socket_id
                    )
                })
            })

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
        }
        init();
        // Always clear the listeners, else it causes memory leak
        return () => {
            socketRef.current.disconnect();
            socketRef.current.off('joined');
            socketRef.current.off('disconnected');
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

    function leaveRoom(){
        reactNavigator("/");
    }

    function _onSelect (option) {
        setMode(option.label);
        const newMode = option.label;
        console.log(option.label);
        socketRef.current.emit('mode change', {newMode, room_id, codeRef});
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
            socketRef.current.emit('filename change', {room_id, fileName});
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
                {clients.map((client) => {
                    return <Client key={client.socketId} username={client.username}/>
                })}
            </div>
            <Dropdown options={options} value={mode} onChange={_onSelect} placeholder="Select an option" />
            <button className="btn copyBtn" onClick={copyRoomID}>Copy Room ID</button>
            <button className="btn leaveBtn" onClick={leaveRoom}>Leave the Room</button>
            <button className="btn" onClick={downloadCode}>Download</button>
        </div>
        <div className='editorWrap'>
            {console.log("Here")}
            <Editor socketRef={socketRef} room_id={room_id} onCodeChange={(code) => {codeRef.current = code}} mode={mode}/>
        </div>
    </div>
  )
}

export default EditorPage;