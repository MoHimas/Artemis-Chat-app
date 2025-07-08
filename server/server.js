import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";
import { Socket } from "dgram";

//create express app and http server
const app = express();
const server = http.createServer(app);

//initialise socket.io server setup
export const io = new Server(server, {
  cors: { origin: "*" },
});

//store online users
export const userSocketMap = {}; //{userId: socketId}

//socket.io connection handler
io.on("connection", (Socket) => {
  const userId = Socket.handshake.query.userId;
  console.log("user connected:", userId);

  if (userId) userSocketMap[userId] = Socket.id;

  //emit online users to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  Socket.on("disconnect", () => {
    console.log("user disconnected:", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

//middleware setup
app.use(express.json({ limit: "4mb" }));
app.use(cors());

//routes setup
app.use("/api/status", (req, res) => {
  res.send("server is running");
});
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

//connect to mangodb
await connectDB();

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5001;
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

//export server for vercel deployment
export default server;
