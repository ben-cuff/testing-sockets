"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export default function Home() {
  const [messages, setMessages] = useState(["message here to get started"]);

  const [socket, setSocket] = useState<Socket>();
  const [inputMessage, setInputMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io("http://localhost:8080");
    setSocket(newSocket);
    setIsConnected(true);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("message", (newMessage) => {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      });

      socket.on("connect", () => {
        if (socket.recovered) {
          console.log(`Recovered connection for socket ID: ${socket.id}`);
        } else {
          console.log(
            `New connection established with socket ID: ${socket.id}`
          );
        }
      });

      return () => {
        socket.off("message");
      };
    }
  }, [socket]);

  return (
    <>
      {isConnected ? (
        <div className="p-4">
          <h1 className="text-xl font-bold mb-4">Socket.IO Messages</h1>
          <ul className="space-y-2">
            {messages.map((message, index) => (
              <li key={index} className="p-2 bg-gray-100 rounded text-gray-800">
                {message}
              </li>
            ))}
          </ul>
          <form
            className="mt-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (inputMessage.trim()) {
                socket?.emit("message", inputMessage);
                setInputMessage("");
              }
            }}
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 p-2 border rounded"
                placeholder="Type a message..."
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
                disabled={!inputMessage.trim()}
              >
                Send
              </button>
            </div>
          </form>
        </div>
      ) : (
        <h1>Not connected</h1>
      )}
    </>
  );
}
