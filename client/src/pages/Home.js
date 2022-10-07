import React, { useState } from 'react'
import {v4 as uuid} from "uuid";
import toast from 'react-hot-toast';
import { createRoutesFromChildren, Navigate, useNavigate } from 'react-router-dom';
import { createRoom } from '../firebase';

const Home = () => {
    const [room_id, setRoom_id] = useState("");
    const [user_id, setUserID] = useState(uuid());
    const [username, setUsername] = useState("");
    const navigate = useNavigate();

    const createNewRoom = (e) => {
        e.preventDefault();
        const id = uuid();
        setRoom_id(id);
        // console.log(id);
        createRoom(id);
        toast.success("Created a new room");
    }

    const joinRoom = (e) => {
        if (!room_id || !username) {
            toast.error("Username and Room ID is required");
            return;
        }

        // Can be done with DB - Redux Store, MongoDB
        const isNew = true;
        navigate(`/editor/${room_id}`, {
            state: {
                username,
                user_id,
                isNew
            }
        })
    }

    const handleInputEnter = (e) => {
        if (e.code==="Enter") {
            joinRoom();
        }
    }

    return (
        <div className="homePageWrapper">
            <div className='formWrapper'>
                {/* TODO Add favicon and Home page image */}
                <h4 className='mainLabel'>Room ID</h4>
                <div className='inputGroup'>
                    <input 
                        type="text"
                        className='inputBox'
                        placeholder='Enter Room ID'
                        value={room_id}
                        onChange={(e) => {setRoom_id(e.target.value)}}
                        onKeyUp={handleInputEnter}
                    >
                    </input>
                    <input
                        type="text"
                        className='inputBox'
                        placeholder='Username'
                        value={username}
                        onChange={(e) => {setUsername(e.target.value)}}
                        onKeyUp={handleInputEnter}
                    >
                    </input>
                    <button onClick={joinRoom} className='btn joinBtn'>Join</button>
                    <span className='createInfo'>
                        <a onClick={createNewRoom} href="" className="createNewBtn">
                            Create New Room &nbsp;
                        </a>
                    </span>
                </div>
            </div>
            <footer>
                <h4>Built by curiyash</h4>
            </footer>
        </div>
    )
}

export default Home