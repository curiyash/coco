import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import { Socket } from 'socket.io-client';

const Editor = ({socketRef, room_id}) => {
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

            editor.current.on('change', (instance, changes) => {
                // origin represents the kind of action
                const { origin } = changes;
                // get the current code in editor
                const code = instance.getValue();
                // If origin isn't setValue, then and then only
                // Why? Else this causes an infinite loop!
                if (origin!=='setValue'){
                    // Emit this code
                    socketRef.current.emit('code change', {
                        room_id: room_id,
                        code: code
                    })
                }
            })
        }
        init();
    }, []);

    // useEffect for listening to a code change
    useEffect(() => {
        if (socketRef.current!==null){
            socketRef.current.on('code change', ({code}) => {
                if (code!==null){
                    // Why the condition?
                    // If code was null by any chance, then
                    // entire user code would be overwritten
                    // set the code in current editor
                    editor.current.setValue(code);
                }
            })
        }

        return () => {
            socketRef.current.off('code change');
        }
    }, [socketRef.current])

  return <textarea id="realtime-editor"></textarea>
}

export default Editor;