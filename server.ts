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
  console.log("A user connected");

  if (socket.recovered) {
    console.log(`Recovered connection for socket ID: ${socket.id}`);
  } else {
    console.log(`New connection established with socket ID: ${socket.id}`);
  }
  socket.emit("message", "Welcome to the Socket.IO server!");
  socket.broadcast.emit("message", `A new user has joined: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });

  socket.on("message", (msg) => {
    console.log("Message received:", msg);
    io.emit("message", `${socket.id} said ${msg}`);
  });
});

http.listen(8080, () => {
  console.log("Server is listening on port 8080");
});
