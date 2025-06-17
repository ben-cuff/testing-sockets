"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export default function Home() {
  const [messages, setMessages] = useState(["message here to get started"]);
  const [socket, setSocket] = useState<Socket>();
  const [inputMessage, setInputMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  const connectAsRole = (role: "interviewer" | "interviewee") => {
    if (socket) {
      socket.disconnect();
    }

    const userId = Math.random().toString(36).substring(2, 10);

    // Would do some sort of match making here or have a room select
    const roomId = "interview-room-1";

    const newSocket = io("http://localhost:8080", {
      auth: {
        userId,
        role,
        "x-socket-key": "123456",
      },
    });

    newSocket.on("connect", () => {
      newSocket.emit("join_room", roomId);
    });

    newSocket.on("connect_error", (error) => {
      setErrorMessage(error.message);
    });

    setSocket(newSocket);

    return newSocket;
  };

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

      socket.on("room_full", (msg) => {
        alert(msg);
        setIsConnected(false);
      });

      socket.on("join_success", (msg) => {
        console.log(msg);
        setIsConnected(true);
      });

      socket.on("join_error", (msg) => {
        alert(msg);
        setIsConnected(false);
      });

      return () => {
        socket.off("message");
      };
    }
  }, [socket]);

  return (
    <div className="p-4">
      {!isConnected ? (
        <div className="flex flex-col gap-4 items-center justify-center min-h-[200px]">
          <h1 className="text-xl font-bold">Choose your role</h1>
          <div className="flex gap-4">
            <button
              onClick={() => connectAsRole("interviewer")}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Connect as Interviewer
            </button>
            <button
              onClick={() => connectAsRole("interviewee")}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Connect as Interviewee
            </button>
          </div>
          {errorMessage && <p className="mt-4 text-red-500">{errorMessage}</p>}
        </div>
      ) : (
        <>
          <div>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-bold">Socket.IO Messages</h1>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  Role: {socket?.auth?.role || "Unknown"}
                </span>
                <button
                  onClick={() => {
                    socket?.disconnect();
                    setIsConnected(false);
                    setMessages(["message here to get started"]);
                  }}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>
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
        </>
      )}
    </div>
  );
}
