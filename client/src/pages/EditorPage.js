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
    <div className="editor-main">
        <div className='aside'>
            <div className='inner'>
                <div className='logo'>
                    Logo Goes Here
                </div>
            </div>
            <h3>Connected</h3>
            <div className='client-list'>
                {clients.map((client) => {
                    return <Client key={client.socketId} username={client.username}/>
                })}
            </div>
            <button id="copy-btn">Copy Room ID</button>
            <button id="leave-btn">Leave the Room</button>
        </div>
        <div className='editor'>
            <Editor />
        </div>
    </div>
  )
}

export default EditorPage