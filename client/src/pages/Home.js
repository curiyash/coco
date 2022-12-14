import React, { useState } from 'react'
import {v4 as uuid} from "uuid";
import toast from 'react-hot-toast';
import { Navigate, useNavigate } from 'react-router-dom';

const Home = () => {
    const [room_id, setRoom_id] = useState("");
    const [username, setUsername] = useState("");
    const navigate = useNavigate();

    const createNewRoom = (e) => {
        e.preventDefault();
        const id = uuid();
        setRoom_id(id);
        // console.log(id);
        toast.success("Created a new room");
    }

    const joinRoom = (e) => {
        if (!room_id || !username) {
            toast.error("Username and Room ID is required");
            return;
        }

        // Can be done with DB - Redux Store, MongoDB
        navigate(`/editor/${room_id}`, {
            state: {
                username,
            }
        })
    }

    const handleInputEnter = (e) => {
        if (e.code==="Enter") {
            joinRoom();
        }
    }

    return (
        <div className="homepage-wrapper">
            <div className='form-wrapper'>
                {/* TODO Add favicon and Home page image */}
                <h4 className='label-room'>Room ID</h4>
                <div>
                    <input 
                        type="text"
                        className='input-text'
                        placeholder='Enter Room ID'
                        value={room_id}
                        onChange={(e) => {setRoom_id(e.target.value)}}
                        onKeyUp={handleInputEnter}
                    >
                    </input>
                    <input
                        type="text"
                        className='input-text'
                        placeholder='Username'
                        value={username}
                        onChange={(e) => {setUsername(e.target.value)}}
                        onKeyUp={handleInputEnter}
                    >
                    </input>
                    <button onClick={joinRoom} className='btn join-btn'>Join</button>
                    <span className='create-info'>
                        <a onClick={createNewRoom} href="" className="create-new-room">
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