import io from "socket.io-client";
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const page_origin = window.location.origin
const socket = io(page_origin, {path: "/ws/socket.io"})


/*
  ---->>> EVENTS
*/
export const EVENT_AUTHENTICATION = 'event-authentication'
export const EVENT_PBX_CALL_SESSION = 'event-pbx-call-session'
export const EVENT_SUBSCRIBE_SESSION = 'event-subscribe-session'
export const EVENT_SUBSCRIBE_CHANNEL = 'event-subscribe-channel'
export const EVENT_NEW_PBX_CALL_SESSION_DATA = 'event-new-pbx-call-session-data'
export const EVENT_ACK = 'event-ack'

/*
  ---->>> CHANNEL
*/
const TOKEN = 'ws-bypass-font-end'



function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastMessage, setLastMessage] = useState(null);
  const [authID, setAuthID] = useState(uuidv4())
  useEffect(() => {
    socket.on('connect', () => {
      
      if (!isConnected){
        // authenticate when connected
        let authenticationData = {
          id: authID,
          token: TOKEN,
        }
        socket.emit(EVENT_AUTHENTICATION, authenticationData) // send jwt token
      }     

      // server response when get a request from client
      socket.on(EVENT_ACK, (data) => {
        console.log("ACK", data)

        // check if authenticated
        if (data.id === authID && data.success){
          console.log('ACK', 'Authenticated Success', socket.id)
          setIsConnected(true);
        }
      })
      
      // pbx-call-session data
      socket.on(EVENT_PBX_CALL_SESSION, (data)=>{
        console.log(EVENT_PBX_CALL_SESSION, data)
        setLastMessage(JSON.stringify(data))
      })
    })

    socket.on('disconnect', (reason)=>{
      console.log('socket on disconnect reason ', reason)
      setIsConnected(false);
      setLastMessage(reason)
    })

    return () => {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('chat-message');
    }
  })

  const disconnect = () => {
    try {
      socket.disconnect()
      // setLastMessage('disconnected')
    } catch (error) {
      setLastMessage(`disconnect error ${error}`)
    }
  }

  const reconnect = () =>{
    try {
      socket.connect()
    } catch (error) {
      setLastMessage(`reconnect error ${error}` )
    }
  }

  const subcribeAChannel = () => {
    socket.emit(EVENT_SUBSCRIBE_SESSION, {id: uuidv4(), sessions: ['sessionA']})
  }

  const subcribeBChannel = () => {
    socket.emit(EVENT_SUBSCRIBE_SESSION, {id: uuidv4(), sessions: ['sessionB']})
  }

  const subcribeLogChannel = () => {
    socket.emit(EVENT_SUBSCRIBE_CHANNEL, {id: uuidv4(), channels: ['channel-log']})
  }

  const emitToAChannel = () => {
    socket.emit(EVENT_NEW_PBX_CALL_SESSION_DATA, {id: uuidv4(), sessionId: "sessionA", data: "Hello this is data of sessionA"})
  }

  const emitToBChannel = () => {
    socket.emit(EVENT_NEW_PBX_CALL_SESSION_DATA, {id: uuidv4(), sessionId: "sessionB", data: "Hello this is data of sessionB"})
  }

  return (
    <div className="App">
      <header className="App-header">
        <p>Connected: {"" + isConnected } </p>
        <p>Last Message: {lastMessage || '-' }</p>
        <button onClick={disconnect}>Disconnect</button>
        <button onClick={reconnect}>Reconnect</button>
        <button onClick={subcribeAChannel}>Subcribe SessionID A Channel</button>
        <button onClick={subcribeBChannel}>Subcribe SessionID B Channel</button>
        <button onClick={subcribeLogChannel}>Subcribe Log Channel</button>
        <button onClick={emitToAChannel}>Emit to SessionA Channel</button>
        <button onClick={emitToBChannel}>Emit to SessionB Channel</button>
      </header>
    </div>
  );
}

export default App;
