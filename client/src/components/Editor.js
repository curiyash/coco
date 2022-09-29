import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';

// Language modes
import 'codemirror/mode/javascript/javascript.js'
import 'codemirror/mode/ruby/ruby.js'
import 'codemirror/mode/swift/swift.js'
import 'codemirror/mode/clojure/clojure.js'
import 'codemirror/mode/python/python.js'
import 'codemirror/mode/php/php.js'
import 'codemirror/mode/erlang/erlang.js'
import 'codemirror/mode/coffeescript/coffeescript.js'
import 'codemirror/mode/crystal/crystal.js'

import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import { Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

const Editor = ({socketRef, room_id, onCodeChange, mode}) => {
    // Initialize CodeMirror
    const editor = useRef(null);
    console.log(mode);

    useEffect(() => {
        async function init(){
            const prev = document.getElementsByClassName('CodeMirror')[0];
            if (prev!==undefined){
                prev.remove();
            }
            editor.current = Codemirror.fromTextArea(
                document.getElementById('realtime-editor'),
                {
                    mode: { name: mode, json: true },
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
                onCodeChange(code);
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
    }, [mode]);

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