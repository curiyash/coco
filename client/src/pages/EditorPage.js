import React from 'react'
import Client from '../components/Client'
import { useState } from 'react'
import Editor from '../components/Editor'

const EditorPage = () => {
    const [clients, setClients] = useState([
        {socketId: 1, username: "ABC"},
        {socketId: 2, username: "XYZ"},
    ]);

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