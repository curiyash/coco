import React from 'react'
import "./client.css";

const Client = ({username, tooltip, left, top, height}) => {
    console.log(username);
    const style = {
      borderLeft: "6px solid green",
      height: `${height}px`,
      left: `${left}px`,
      top: `${top}px`,
      position: "absolute",
      zIndex: 10
    }
  if (tooltip){
    return (
      <div className='client'>
          {/* Avatar and username */}
          <div className="vl" style={style}>
            <span className="tooltip">{username}</span>
          </div>
          <span className='username'>{username}</span>
      </div>
    )
  } else{
    return (
      <div className='client'>
          <span className='username'>{username}</span>
      </div>
    )
  }
}

export default Client