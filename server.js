const express = require("express");
const next = require("next");
const http = require("http");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

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
  const leaveUser = onlineUsersList.filter((user) => user.socketId === socketId)[0]?.useremail;
  onlineUsersList = onlineUsersList.filter((user) => user.socketId !== socketId);

  return leaveUser;
};

app.prepare().then(() => {
  const server = express();
  const httpServer = http.createServer(server);
  const io = new Server(httpServer, {
    cors: {
      origin: `http://${hostname}:${port}`, // Next.js의 주소 허용
      methods: ["GET", "POST"],
    },
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

  // Next.js 페이지 및 API 핸들링
  server.all("*", (req, res) => {
    return handle(req, res);
  });

  const PORT = 3001;
  httpServer
  .once("error", (err) => {
    console.error(err);
    process.exit(1);
  })
  .listen(PORT, () => {
    console.log(`> Ready on http://${hostname}:${PORT}`);
  });
});
