import React from 'react'
import "./client.css";
import Avatar from 'react-avatar';

const Client = ({username, underline}) => {
  if (underline===true){
    return (
      <div className='client'>
          <Avatar name={username} size="42" className="avatar"/>
          <span className='username' style={{"textDecoration": "underline"}}>{username}</span>
      </div>
    )
  } else{
    return (
      <div className='client'>
          <Avatar name={username} size="42" className="avatar"/>
          <span className='username'>{username}</span>
      </div>
    )
  }
}

export default Client