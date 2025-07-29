const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

// 사용자 정보를 담는 배열. 각 요소는 { useremail: string, socketId: string, userId: string } 형태
let onlineUsersList = [];

/**
 * 사용자 소켓을 onlineUsersList에 추가합니다.
 * 동일한 useremail과 userId를 가진 socketId가 이미 존재하면 추가하지 않습니다.
 * @param {string} useremail - 사용자의 이메일
 * @param {string} socketId - 현재 접속한 소켓의 ID
 * @param {string} userId - 사용자의 고유 ID (인증 시스템의 ID)
 */
const addUser = (useremail, socketId, userId) => {
  // 이미 동일한 useremail과 socketId, userId 조합이 존재하는지 확인
  const isExist = onlineUsersList.some((u) => 
    u.useremail === useremail && u.socketId === socketId && u.userId === userId
  );

  if (!isExist) {
    onlineUsersList.push({ useremail, socketId, userId });
    console.log(`✅ User ${useremail} (ID: ${userId}) added with socket ${socketId}. Total online: ${onlineUsersList.length}`);
  } else {
    console.log(`ℹ️ User ${useremail} (ID: ${userId}) with socket ${socketId} already exists. Skipping add.`);
  }
};

/**
 * 사용자 소켓을 onlineUsersList에서 제거합니다.
 * @param {string} socketId - 연결 해제된 소켓의 ID
 * @returns {{useremail: string|null, userId: string|null, isLastSocket: boolean}} - 해당 소켓의 useremail, userId, 그리고 해당 사용자의 마지막 소켓인지 여부
 */
const removeUser = (socketId) => {
  const leavingUserIndex = onlineUsersList.findIndex((u) => u.socketId === socketId);
  
  if (leavingUserIndex === -1) {
    console.log(`⚠️ Socket ${socketId} not found in onlineUsersList for removal.`);
    return null;
  }

  const [leavingUser] = onlineUsersList.splice(leavingUserIndex, 1); // 배열에서 제거하고 정보 가져오기

  // 제거 후, 동일한 userId를 가진 다른 소켓이 남아있는지 확인
  const isLastSocket = !onlineUsersList.some((u) => u.userId === leavingUser.userId);

  console.log(`🗑️ Socket ${socketId} for ${leavingUser.useremail} removed. Total online: ${onlineUsersList.length}`);

  return {
    useremail: leavingUser.useremail,
    userId: leavingUser.userId,
    isLastSocket: isLastSocket
  };
};

/**
 * 특정 이메일을 가진 모든 온라인 사용자의 소켓 ID를 배열로 반환합니다.
 * @param {string} useremail - 찾을 사용자의 이메일
 * @returns {string[]} 해당 이메일을 가진 모든 소켓 ID의 배열
 */
const getUserSocketIdsByEmail = (useremail) => {
  return onlineUsersList
    .filter(u => u.useremail === useremail)
    .map(u => u.socketId);
};

/**
 * 특정 유저 ID를 가진 모든 온라인 사용자의 소켓 ID를 배열로 반환합니다.
 * @param {string} userId - 찾을 사용자의 ID
 * @returns {string[]} 해당 ID를 가진 모든 소켓 ID의 배열
 */
const getUserSocketIdsById = (userId) => {
  return onlineUsersList
    .filter(u => u.userId === userId)
    .map(u => u.socketId);
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
  // 연결 상태 감지를 위한 heartbeat/ping 설정
  pingInterval: 25000, // 클라이언트에 ping을 보내는 간격(ms)
  pingTimeout: 60000,  // pong 응답을 기다리는 최대 시간(ms)
  // upgradeTimeout: 10000, // (선택) 업그레이드 타임아웃
  // allowEIO3: true, // (선택) 구버전 클라이언트 허용
});

app.get("/", (req, res) => {
  res.send("Socket.IO server is running!");
});

io.on("connection", (socket) => {
  console.log("A user connected: ", socket.data.user);
  
  // 클라이언트가 로그인하여 온라인 사용자 목록에 등록될 때 호출됩니다.
  socket.on("online:user", ({ useremail, userId }) => {
    // 소켓 연결 시 해당 소켓에 사용자 정보를 저장 (disconnect 시 활용)
    socket.data.useremail = useremail;
    socket.data.userId = userId; // userId도 저장하여 removeUser에서 활용

    addUser(useremail, socket.id, userId);
    io.emit('register:user', useremail); // 모든 클라이언트에게 새 유저 등록 알림

    // 현재 접속 중인 모든 온라인 사용자 목록을 전송 (userId, useremail, socketId 포함)
    socket.emit('get:onlineUsers', onlineUsersList); 
  });

  // 새 대화방이 생성되었을 때 관련 사용자들에게 알림
  socket.on("conversation:new", (data) => {
    data.users.forEach(user => {
      const userSockets = getUserSocketIdsByEmail(user.email); 
      userSockets.forEach(socketId => {
        io.to(socketId).emit('conversation:new', data);
      });
    });
  });

  // 사용자가 채팅방에 입장할 때 (room에 join)
  socket.on("join:room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.data.useremail} (Socket: ${socket.id}) joined room: ${roomId}`);
  });

  // 사용자가 채팅방에서 나갈 때 (room에서 leave)
  socket.on("leave:room", (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.data.useremail} (Socket: ${socket.id}) left room: ${roomId}`);
  });

  // 사용자가 채팅방을 삭제하고 나갈 때 (영구적으로)
  socket.on("exit:room", (data) => {
    const { existingUsers, conversationId, userIds } = data; // userIds는 user.id의 배열로 가정

    // 관련된 모든 유저들에게 알림 전송 (existingUsers는 이메일, userIds는 ID)
    const allRelevantUserEmails = new Set();
    existingUsers.forEach(user => allRelevantUserEmails.add(user.email));

    // userIds를 통해 이메일을 찾아 추가 (필요하다면)
    // 이 부분은 클라이언트에서 userEmails를 명시적으로 보내는 것이 더 명확할 수 있습니다.
    // 현재 코드에서는 userId만 가지고 onlineUsersList에서 이메일을 찾아야 하는데,
    // onlineUsersList가 userId-useremail 매핑을 직접 제공하지는 않으므로
    // 모든 onlineUsersList를 순회해야 합니다.
    userIds.forEach(uid => {
      const userSockets = getUserSocketIdsById(uid); // userId로 소켓 찾기
      userSockets.forEach(socketId => {
        const user = onlineUsersList.find(u => u.socketId === socketId);
        if (user) allRelevantUserEmails.add(user.useremail);
      });
    });


    allRelevantUserEmails.forEach(uemail => {
      const socketsToSend = getUserSocketIdsByEmail(uemail); 
      socketsToSend.forEach(socketId => {
        io.to(socketId).emit('exit:user', { conversationId, userIds }); // userIds를 그대로 보냄
      });
    });
    console.log(`Exit room event for conversation ${conversationId}. Notifying ${allRelevantUserEmails.size} relevant users.`);
  });

  // 메시지 전송 시
  socket.on("send:message", (data) => {
    const { newMessage, conversationUsers } = data;
    
    // 1. 해당 대화방에 있는 모든 사용자에게 메시지 전송 (메시지 보기에 사용)
    io.to(newMessage.conversationId).emit('receive:message', newMessage);
    console.log(`Message sent to room ${newMessage.conversationId}.`);

    // 2. 각 대화 참여자의 모든 기기/탭에 'receive:conversation' 전송 (대화 목록 업데이트 등에 사용)
    conversationUsers.users.forEach(user => {
      const userSockets = getUserSocketIdsByEmail(user.email);
      userSockets.forEach(userSocketId => {
          io.to(userSocketId).emit('receive:conversation', newMessage, user.email); 
        });
    });
  });

  // 메시지 읽음 처리 시
  socket.on("read:messages", (data) => {
    const { conversationId } = data;
    // 해당 대화방에 있는 모든 사용자에게 메시지 읽음 알림
    io.to(conversationId).emit('read:message');
    console.log(`Read messages event for room ${conversationId}.`);
  });

  // 메시지 확인(seen) 처리 시
  socket.on("seen:message", (data) => {
    const { seenMessageUser, userEmail } = data;
    const conversationId = seenMessageUser.conversationId;

    const emittedSockets = new Set(); // 중복 전송 방지를 위한 Set

    seenMessageUser.conversation.users.forEach((user) => {
      const sockets = getUserSocketIdsByEmail(user.email); // 해당 유저의 모든 소켓 ID 가져오기
      sockets.forEach((socketId) => { 
        if (!emittedSockets.has(socketId)) { // 이미 전송된 소켓이 아니면
          io.to(socketId).emit("seen:user", {
            conversationId,
            seen: seenMessageUser.seen, // seenMessageUser.seen 배열 그대로 전달
            userEmail, // 메시지를 본 유저의 이메일
          });
          emittedSockets.add(socketId);
        }
      });
    });
    console.log(`Seen message event for conversation ${conversationId} by ${userEmail}.`);
  });

  // 소켓 연결 해제 시
  socket.on("disconnect", () => {
    // socket.data에 저장된 사용자 이메일과 userId 정보를 가져옵니다.
    const disconnectedUserEmail = socket?.data?.useremail; 
    const disconnectedUserId = socket?.data?.userId;

    // onlineUsersList에서 소켓을 제거하고, 해당 사용자의 마지막 소켓인지 확인합니다.
    const result = removeUser(socket.id); // removeUser 함수는 이미 isLastSocket을 반환합니다.
  
    if (result && result.isLastSocket) { 
      console.log(`📤 ${disconnectedUserEmail} (ID: ${disconnectedUserId}) fully disconnected.`);
      io.emit("leave:user", disconnectedUserEmail); // 모든 클라이언트에게 해당 유저의 완전 로그아웃 알림
    } else if (result) {
        console.log(`ℹ️ Socket ${socket.id} for ${disconnectedUserEmail} disconnected, but other sessions remain.`);
    } else {
        console.log(`⚠️ Disconnected socket ${socket.id} not found in user list.`);
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`> Server running on PORT ${PORT}`);
});