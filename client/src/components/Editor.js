import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';

const Editor = () => {
    // Initialize CodeMirror
    const editor = useRef(null);

    useEffect(() => {
        async function init(){
            editor.current = Codemirror.fromTextArea(
                document.getElementById('realtime-editor'),
                {
                    mode: { name: 'javascript', json: true },
                    theme: 'dracula',
                    autoCloseTags: true,
                    autoCloseBrackets: true,
                    lineNumbers: true,
                }
            );
        }
        init();
    }, []);
  return <textarea id="realtime-editor"></textarea>
}

export default Editor;