import React from 'react'
import "./client.css";

const Client = ({username, tooltip, left, top, height}) => {
  return (
    <div className='client'>
        <span className='username'>{username}</span>
    </div>
  )
}

export default Client