import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = "http://localhost:4000";
const DOCUMENT_ID = "my-document"; // Use any id or dynamic id here

function App() {
  const [socket, setSocket] = useState(null);
  const [content, setContent] = useState("");
  const textAreaRef = useRef();

  useEffect(() => {
    const s = io(SOCKET_SERVER_URL);
    setSocket(s);

    s.emit('get-document', DOCUMENT_ID);

    s.on('load-document', (documentContent) => {
      setContent(documentContent);
    });

    s.on('receive-changes', (delta) => {
      setContent(delta);
    });

    return () => {
      s.disconnect();
    };
  }, []);

  const handleChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (socket) {
      socket.emit('send-changes', newContent);
      socket.emit('save-document', newContent);
    }
  };

  return (
    <div>
      <h1>Real-Time Collaborative Editor</h1>
      <textarea
        ref={textAreaRef}
        value={content}
        onChange={handleChange}
        rows={20}
        cols={80}
        placeholder="Start typing..."
      />
    </div>
  );
}

export default App;
