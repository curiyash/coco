import * as React from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import ace from "../client/node_modules/ace-builds/src-noconflict/ace";
import { styled } from '@mui/material/styles';
import { useState } from 'react';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

function DirectionStack({editor, onFileNameChange}) {
    const [fileName, setFileName] = useState("Untitled.txt");
    function addNewSession(){
        const newSession = ace.createEditSession("");
        editor.current.setSession(newSession);
        setSessions((prev) => {
            const key = prev.key+1;
            return {
                ...prev,
                [key]: newSession,
                key: key,
            };
        })
        // Send to Firebase
    }
    
    function updateFileName(e){
        setFileName(e.target.value);
    }
    
    function emitFileName(e){
        if (e.key==='Enter' || e.keyCode===13){
            // Emit the event
            // socketRef.current.emit('filename change', {room_id, fileName});
            updateNameOfFile(room_id, fileName, session.current);
        }
    }
  return (
    <div>
      <Stack direction="row" spacing={2}>
        <Item><Button variant="contained" onClick={addNewSession}>+</Button></Item>
        <Item><input type="text" value={fileName} onChange={updateFileName} onKeyUp={emitFileName}></input></Item>
        <Item>Item 3</Item>
      </Stack>
    </div>
  );
}
