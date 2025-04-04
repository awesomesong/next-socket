const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

let onlineUsersList = [];

const addUser = (useremail, socketId) => {
  const isExist = onlineUsersList.find((user) => user.socketId === socketId);

  console.log("isExist: ", isExist);
  if (!isExist) {
    onlineUsersList.push({ useremail, socketId });
    console.log(useremail + " added!");
  }
};

const removeUser = (socketId) => {
  const leaveUser = onlineUsersList.find((user) => user.socketId === socketId)?.useremail;
  onlineUsersList = onlineUsersList.filter((user) => user.socketId !== socketId);

  return leaveUser;
};

const app = express();
const httpServer = http.createServer(app);
require("dotenv").config();

const allowedOrigins = process.env.CLIENT_ORIGIN?.split(",") ?? [];
console.log("✅ allowedOrigins:", allowedOrigins);

const io = new Server(httpServer, {
  cors: {
      origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("Blocked origin:", origin); 
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.send("Socket.IO server is running!");
});

io.on("connection", (socket) => {
  console.log("A user connected: ", socket.data.user);
  
  // 로그인한 사용자의 소켓 아이디를 저장
  socket.on("online:user", (useremail) => {
    addUser(useremail, socket.id);
    io.emit('register:user', useremail);
    socket.emit('get:onlineUsers', onlineUsersList);
  });

  // 대화방 생성
  socket.on("conversation:new", (data) => {
    data.users.forEach(user => {
      const userSockets = onlineUsersList.filter((u) => u.useremail === user.email);
      userSockets.forEach(userSocket => {
        io.to(userSocket.socketId).emit('conversation:new', data);
      });
    });
  });

  // 사용자가 채팅방에 입장할 때 (접속O)
  socket.on("join:room", (roomId) => {
    socket.join(roomId);
    // 채팅방에 입장한 모든 사용자에게 알림 전송 (선택사항)
    // io.to(roomId).emit("join:user", socket.data.user);
  });

  // 사용자가 채팅방에서 나갈 때 (접속X)
  socket.on("leave:room", (roomId) => {
    socket.leave(roomId);
    // 채팅방에 있는 사용자에게 알림 전송 (선택사항)
    // io.to(roomId).emit("leave:room");
  });

  // 사용자가 채팅방을 삭제하고 나감 (다시 접속 안됨)
  socket.on("exit:room", (data) => {
    const { existingUsers, conversationId, userId } = data;
    
    existingUsers.forEach(user => {
      const userSockets = onlineUsersList.filter((u) => u.useremail === user.email);
      userSockets.forEach(userSocket => {
        io.to(userSocket.socketId).emit('exit:user', {conversationId, userId: userId});
      });
    });
  })

  socket.on("send:message", (data) => {
    const { newMessage, conversationUsers } = data;
    // 대화방에 들어온 사용자들에게 메시지 전송
    io.to(newMessage.conversationId).emit('receive:message', newMessage);

    // 채팅방에 참여한 사용자들에게 메시지 전송
    conversationUsers.users.forEach(user => {
      const userSockets = onlineUsersList.filter((u) => u.useremail === user.email);
      // !!userSocket?.useremail && io.to(userSocket.socketId).emit('receive:message', newMessage);
      userSockets.forEach(userSocket => {
        io.to(userSocket.socketId).emit('receive:conversation', newMessage);
      });
    });
  });

  socket.on("read:messages", (data) => {
    const { conversationId } = data;
    io.to(conversationId).emit('read:message');
    // const userSockets = onlineUsersList.filter((u) => u.useremail === useremail);
    // userSockets.forEach(userSocket => {
    //   io.to(userSocket.socketId).emit('read:message');
    // });
  });

  socket.on("seen:message", (data) => {
    const { seenMessageUser } = data;
    io.to(seenMessageUser.conversationId).emit("seen:user", seenMessageUser);
  });

  socket.on("disconnect", () => {
    const leaveUser = removeUser(socket.id);
    io.emit('leave:user', leaveUser);
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`> Server running on PORT ${PORT}`);
});
