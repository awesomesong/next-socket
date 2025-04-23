const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

let onlineUsersList = [];

const addUser = (useremail, socketId, userId) => {
  const isExist = onlineUsersList.some((u) => 
    u.userId === userId && u.socketId === socketId
  );

  console.log("isExist: ", isExist);
  if (!isExist) {
    onlineUsersList.push({ useremail, socketId, userId });
    console.log(useremail + " added!");
  }
};

const removeUser = (socketId) => {
  const leavingUser = onlineUsersList.find((u) => u.socketId === socketId);
  if (!leavingUser) return null;

  // 제거
  onlineUsersList = onlineUsersList.filter((u) => u.socketId !== socketId);

  // 동일 유저가 여전히 남아 있는지 확인
  const isLastSocket = !onlineUsersList.some((u) => u.userId === leavingUser.userId);

  return {
    ...leavingUser, // userId, useremail, socketId
    isLastSocket
  };
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
  socket.on("online:user", ({ useremail, userId }) => {
    addUser(useremail, socket.id, userId);
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
    const { existingUsers, conversationId, userIds } = data;
    
    // 대화방에 남아있는 유저들에게 exit:user 전송
    existingUsers.forEach(user => {
      const userSockets = onlineUsersList.filter((u) => u.useremail === user.email);
      userSockets.forEach(userSocket => {
        io.to(userSocket.socketId).emit('exit:user', {conversationId, userIds});
      });
    });

    // 현재 브라우저(socket) 제외하고, 같은 유저의 나머지 소켓들에 전송
    userIds.forEach(uid => {
      const otherSockets = onlineUsersList.filter((u) =>
        u.userId === uid && u.socketId !== socket.id
      );
      otherSockets.forEach(userSocket => {
        io.to(userSocket.socketId).emit('exit:user', { conversationId, userIds });
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
      userSockets.forEach(userSocket => {
        io.to(userSocket.socketId).emit('receive:conversation', newMessage, userSocket.useremail);
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
    const { seenMessageUser, userEmail } = data;
    const conversationId = seenMessageUser.conversationId;

    const emitted = new Set();

    seenMessageUser.conversation.users.forEach((user) => {
      const sockets = onlineUsersList.filter((u) => u.useremail === user.email);
      sockets.forEach(({ socketId }) => {
        if (!emitted.has(socketId)) {
          io.to(socketId).emit("seen:user", {
            conversationId,
            seen: seenMessageUser.seen,
            userEmail,
          });
          emitted.add(socketId);
        }
      });
    });
  });

  socket.on("disconnect", () => {
    const result = removeUser(socket.id);

    if (result) {
      const { useremail, userId, isLastSocket } = result;
  
      console.log("User disconnected:", socket.id);
  
      if (isLastSocket) {
        console.log(`📤 ${useremail} 전체 로그아웃 처리됨`);
        io.emit("leave:user", useremail);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`> Server running on PORT ${PORT}`);
});
