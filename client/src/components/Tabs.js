import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { onLog } from 'firebase/app';

export default function ScrollableTabsButtonAuto({sessions, editor}) {
  const [value, setValue] = React.useState(0);
  console.log(sessions);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  function IWasClicked(session){
    if (!editor.current){
        alert("An error occurred. Hang on for a while and retry");
    }
    editor.current.setSession(session);
  }

  return (
    <Box sx={{ bgcolor: 'background.paper' }}>
      <Tabs
        value={value}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="scrollable auto tabs example"
      >
        {Object.entries(sessions).map(([key, session]) => {
            if (key!=='key'){
                return <Tab label={`Item ${key}`} onClick={(e) => {IWasClicked(session)}}/>
            }
        })}
        {/* <Tab label="Item One" />
        <Tab label="Item Two" />
        <Tab label="Item Three" />
        <Tab label="Item Four" />
        <Tab label="Item Five" />
        <Tab label="Item Six" />
        <Tab label="Item Seven" /> */}
      </Tabs>
    </Box>
  );
}
