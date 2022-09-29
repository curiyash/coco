import React, { useEffect, useRef } from 'react'
import Client from '../components/Client'
import { useState } from 'react'
import Editor from '../components/Editor'
import { initSocket } from '../socket'
import ACTIONS from "../Actions";
import { useLocation, useNavigate, Navigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const EditorPage = () => {
    // useLocation: Like useState but for current URL
    // Just for grabbing info from current URL
    const location = useLocation();
    const codeRef = useRef(null);
    const { room_id } = useParams();
    const [clients, setClients] = useState([]);
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

    if (!location.state) {
        return <Navigate to="/"></Navigate>
    }

    <Navigate></Navigate>

  return (
    <div className="mainWrap">
        <div className='aside'>
            <div className='asideInner'>
                <div className='logo'>
                    Logo Goes Here
                </div>
            </div>
            <h3>Connected</h3>
            <div className='clientsList'>
                {clients.map((client) => {
                    return <Client key={client.socketId} username={client.username}/>
                })}
            </div>
            <button className="btn copyBtn" onClick={copyRoomID}>Copy Room ID</button>
            <button className="btn leaveBtn" onClick={leaveRoom}>Leave the Room</button>
        </div>
        <div className='editorWrap'>
            {console.log("Here")}
            <Editor socketRef={socketRef} room_id={room_id} onCodeChange={(code) => {codeRef.current = code}}/>
        </div>
    </div>
  )
}

export default EditorPage;