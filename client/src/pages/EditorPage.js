import React, { useEffect, useRef } from 'react'
import Client from '../components/Client'
import { useState } from 'react'
import Editor from '../components/Editor'
import {v4 as uuid} from "uuid";
import ACTIONS from "../Actions";
import { useLocation, useNavigate, Navigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';
import FileSaver from 'file-saver';
import { mimeTypes } from './mimeTypes';
import { addUser, getRef, leftUser } from '../firebase'
import { onSnapshot } from 'firebase/firestore';
import AceEditor from "react-ace";
import { updateLang, updateNameOfFile } from '../firebase';

import ace from "../../node_modules/ace-builds/src-noconflict/ace";
import "../../node_modules/ace-builds/src-noconflict/ext-modelist";

import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/ext-language_tools";
import { onValue } from 'firebase/database';

const options = ['abap', 'abc', 'actionscript', 'ada', 'alda', 'apache_conf', 'apex', 'applescript', 'aql', 'asciidoc', 'asl', 'assembly_x86', 'autohotkey', 'batchfile', 'c9search', 'cirru', 'clojure', 'cobol', 'coffee', 'coldfusion', 'crystal', 'csharp', 'csound_document', 'csound_orchestra', 'csound_score', 'csp', 'css', 'curly', 'c_cpp', 'd', 'dart', 'diff', 'django', 'dockerfile', 'dot', 'drools', 'edifact', 'eiffel', 'ejs', 'elixir', 'elm', 'erlang', 'forth', 'fortran', 'fsharp', 'fsl', 'ftl', 'gcode', 'gherkin', 'gitignore', 'glsl', 'gobstones', 'golang', 'graphqlschema', 'groovy', 'haml', 'handlebars', 'haskell', 'haskell_cabal', 'haxe', 'hjson', 'html', 'html_elixir', 'html_ruby', 'ini', 'io', 'ion', 'jack', 'jade', 'java', 'javascript', 'json', 'json5', 'jsoniq', 'jsp', 'jssm', 'jsx', 'julia', 'kotlin', 'latex', 'latte', 'less', 'liquid', 'lisp', 'livescript', 'logiql', 'logtalk', 'lsl', 'lua', 'luapage', 'lucene', 'makefile', 'markdown', 'mask', 'matlab', 'maze', 'mediawiki', 'mel', 'mips', 'mixal', 'mushcode', 'mysql', 'nginx', 'nim', 'nix', 'nsis', 'nunjucks', 'objectivec', 'ocaml', 'partiql', 'pascal', 'perl', 'pgsql', 'php', 'php_laravel_blade', 'pig', 'plain_text', 'powershell', 'praat', 'prisma', 'prolog', 'properties', 'protobuf', 'puppet', 'python', 'qml', 'r', 'raku', 'razor', 'rdoc', 'red', 'redshift', 'rhtml', 'robot', 'rst', 'ruby', 'rust', 'sac', 'sass', 'scad', 'scala', 'scheme', 'scrypt', 'scss', 'sh', 'sjs', 'slim', 'smarty', 'smithy', 'snippets', 'soy_template', 'space', 'sparql', 'sql', 'sqlserver', 'stylus', 'svg', 'swift', 'tcl', 'terraform', 'tex', 'text', 'textile', 'toml', 'tsx', 'turtle', 'twig', 'typescript', 'vala', 'vbscript', 'velocity', 'verilog', 'vhdl', 'visualforce', 'wollok', 'xml', 'xquery', 'yaml', 'zeek']

options.forEach((option) => {
    require(`ace-builds/src-noconflict/mode-${option}`);
})

const EditorPage = () => {
    // useLocation: Like useState but for current URL
    // Just for grabbing info from current URL
    var modelist = ace.require("ace/ext/modelist")
    const location = useLocation();
    const codeRef = useRef(null);
    const { room_id } = useParams();
    const [clients, setClients] = useState([]);
    const [mode, setMode] = useState('text');
    const [fileName, setFileName] = useState("Untitled.txt");
    const reactNavigator = useNavigate();
    const left = useRef(263);
    const top = useRef(24);
    const line = useRef(0);
    const session = useRef(0);
    let createMarker = null;
    const lineHeightRef = useRef("24px");

    // useRef: does not rerender component when state changes
    // available on rerender
    useEffect(() => {
        const init = async() => {
            // Ask to join in
            // We had passed username in state of location from Home
            addUser(room_id, location.state?.user_id, location.state?.username, line.current)
            toast.success("Joined the room successfully!");

            window.addEventListener('beforeunload', async function(e){
                e.preventDefault();
                await leftUser(room_id, location.state?.user_id);
            })
        }

        async function setMarkers(c){
            // const markers = document.getElementsByClassName('vl');
            // console.log(markers);
            // if (markers){
            //     Array.from(markers).forEach((marker) => {
            //         marker.remove();
            //     })
            // }
            if (createMarker!==null){
                // console.log("Setting markers");
                for (const uid in c){
                    const marker = document.getElementById(uid);
                    const scroller = document.getElementsByClassName("ace_scroller")[0];
                    try{
                        scroller.removeChild(marker);
                    } catch{
                        // console.log("Not there");
                    }
                    // console.log(marker);
                    const user = c[uid];
                    // console.log(uid);
                    // console.log(user);
                    if (location.state?.user_id!==uid){
                        await createMarker(user, uid);
                    }
                }
            }
        }

        let unsubscribe;
        async function getUsers(){
            // const ref = await getRef("users", room_id);
            const ref = await getRef(`roomies/${room_id}`);
            // if (username!==location.state.username){
            //     toast.success(`${username} has joined the room`);
            // }
            // console.log("Ref");
            // console.log(ref);

            unsubscribe = onValue(ref, (snapshot) => {
                const data = snapshot.val();
                const uids = Object.values(data);
                uids.sort((a, b) => {
                    if (a<=b){
                        return 1;
                    } else{
                        return -1;
                    }
                })
                setClients(uids);
            })

            // unsubscribe = onSnapshot(ref, (doc) => {
            //     const c = doc.data();
            //     console.log(c);
            //     // c.sort((a, b) => {
            //     //     const u1 = a.username.toLowerCase();
            //     //     const u2 = b.username.toLowerCase();
            //     //     if (u1<u2){
            //     //         return 1;
            //     //     } else if (u1>=u2){
            //     //         return -1;
            //     //     }
            //     // })
            //     const users = Object.values(c);
            //     users.sort((a, b) => {
            //         const u1 = a.username.toLowerCase();
            //         const u2 = b.username.toLowerCase();
            //         if (u1<=u2){
            //             return -1;
            //         } else if (u1>u2){
            //             return 1;
            //         } 
            //     })
            //     setClients(users);
            // })
        }
        init();
        getUsers();
        // Always clear the listeners, else it causes memory leak
        return () => {
            window.removeEventListener('beforeunload', () => {
                console.log("Successfully exited");
            })
            unsubscribe();
        }
    }, []);

    async function copyRoomID(){
        try {
            await navigator.clipboard.writeText(room_id);
            toast.success("Copied Room ID");
        } catch (err){
            toast.error("Could not copy Room ID");
            console.error(err);
        }
    }

    async function leaveRoom(){
        await leftUser(room_id, location.state?.user_id);
        reactNavigator("/");
    }

    function _onSelect (option) {
        setMode(option.label);
        // Send to Firebase
        updateLang(room_id, option.label, session.current);
    }

    if (!location.state) {
        return <Navigate to="/"></Navigate>
    }

    function downloadCode(e){
        e.preventDefault();
        // console.log(fileName);
        const code = codeRef.current;
        if (code===null || code===""){
            toast.error("There is no code!");
            return;
        }

        const mime = mimeTypes[mode];
        let blob = "";
        if (mime!==undefined){
            blob = new Blob([code], {type: `application/octet-stream;charset=utf-8`});
        } else{
            // console.log(`Downloading as ${mimeTypes[mode]}`);
            blob = new Blob([code], {type: `${mimeTypes[mode]};charset=utf-8`});
        }
        FileSaver.saveAs(blob, fileName);
    }

    function updateFileName(e){
        setFileName(e.target.value);
    }

    function emitFileName(e){
        if (e.key==='Enter' || e.keyCode===13){
            // Emit the event
            var mode = modelist.getModeForPath(fileName).mode.split('/')[2];
            setMode(mode);
            updateLang(room_id, mode, session.current);
            updateNameOfFile(room_id, fileName, session.current);
        }
    }

    <Navigate></Navigate>

  return (
    <div className="mainWrap">
        <div className='aside'>
            <div className='asideInner'>
                <div className='logo'>
                    Logo Goes Here
                </div>
                <input type="text" value={fileName} onChange={updateFileName} onKeyUp={emitFileName}></input>
            </div>
            <h3>Connected</h3>
            <div className='clientsList'>
                {clients.map((client, id) => {
                    return <Client key={id} username={client}/>
                })}
            </div>
            <Dropdown options={options} value={mode} onChange={_onSelect} placeholder="Select an option" />
            <button className="btn copyBtn" onClick={copyRoomID}>Copy Room ID</button>
            <button className="btn leaveBtn" onClick={leaveRoom}>Leave the Room</button>
            <button className="btn" onClick={downloadCode}>Download</button>
        </div>
        <div className='editorWrap'>
            {/* {console.log("Here")} */}
            <Editor isNew={location.state?.isNew} room_id={room_id} onCodeChange={(code) => {codeRef.current = code}} mode={mode} onModeChange={(mode) => {setMode(mode)}} user_id={location.state?.user_id} username={location.state?.username} onLineHeightChange={(height) => {lineHeightRef.current = height}} fileName={fileName} onFileNameChange={(fName) => {setFileName(fName)}} cM={(crm) => createMarker=crm} onSessionChange={(sessionID) => {session.current=sessionID}}/>
        </div>
    </div>
  )
}

export default EditorPage;