import React from 'react'

const Client = ({username}) => {
    console.log(username);
  return (
    <div className='client'>
        {/* Avatar and username */}
        <span className='username'>{username}</span>
    </div>
  )
}

export default Client