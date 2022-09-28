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
    const { room_id } = useParams();
    const [clients, setClients] = useState([
        {socketId: 1, username: "ABC"},
        {socketId: 2, username: "XYZ"},
    ]);
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
            // socketRef.current.emit(ACTIONS.JOIN, {
            //     room_id: location.room_id,
            //     username: location.state?.username
            // });
            console.log(socketRef);
        }
        init();
    }, []);

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
            <button className="btn copyBtn">Copy Room ID</button>
            <button className="btn leaveBtn">Leave the Room</button>
        </div>
        <div className='editorWrap'>
            {console.log("Here")}
            <Editor />
        </div>
    </div>
  )
}

export default EditorPage;