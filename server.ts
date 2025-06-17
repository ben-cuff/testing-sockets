import { createServer } from "http";
import { Server } from "socket.io";

const http = createServer();

const io = new Server(http, {
  cors: {
    origin: "*",
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 5 * 60 * 1000,
    skipMiddlewares: true,
  },
});

io.use((socket, next) => {
  const socketKey = socket.handshake.auth["x-socket-key"];

  if (socketKey !== "123456") {
    return next(new Error("Invalid socket key"));
  }

  next();
});

io.use((socket, next) => {
  const userId = socket.handshake.auth.userId;

  // would validate userId here, e.g., check if it exists in the database
  // For this example, we'll just check if it's a non-empty string

  if (typeof userId !== "string" || userId.trim() === "") {
    return next(new Error("Invalid user ID"));
  }

  socket.data.userId = userId;

  console.log(`User ID ${userId} connected with socket ID: ${socket.id}`);

  next();
});

io.on("connection", (socket) => {
  socket.on("join_room", (room) => {
    const roomObj = io.sockets.adapter.rooms.get(room);
    const numClients = roomObj ? roomObj.size : 0;
    const role = socket.handshake.auth.role;

    if (numClients === 0) {
      socket.join(room);
      socket.data.role = role;
      socket.emit("join_success", `Joined room: ${room} as ${role}`);
    } else if (numClients === 1) {
      const existingSocketId = roomObj && Array.from(roomObj)[0];
      const existingSocket = existingSocketId
        ? io.sockets.sockets.get(existingSocketId)
        : undefined;
      const existingRole = existingSocket?.data.role;

      if (existingRole === role) {
        socket.emit("join_error", `Room already has an ${role}`);
        return;
      }

      socket.join(room);
      socket.data.role = role;
      socket.emit("join_success", `Joined room: ${room} as ${role}`);
    } else {
      socket.emit("room_full", "Room is full. Only 2 clients allowed.");
      socket.disconnect();
    }
  });

  if (socket.recovered) {
    console.log(`Recovered connection for user ID: ${socket.data.userId}`);
  } else {
    console.log(
      `New connection established with user ID: ${socket.data.userId}`
    );
  }

  socket.broadcast.emit(
    "message",
    `A new user has joined: ${socket.data.userId}`
  );

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });

  socket.on("message", (msg) => {
    console.log("Message received:", msg);
    io.emit("message", `${socket.data.userId} said ${msg}`);
  });
});

http.listen(8080, () => {
  console.log("Server is listening on port 8080");
});
