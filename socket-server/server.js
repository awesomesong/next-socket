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

  // 연결 시 한 번: 현재 io의 소켓 목록과 비교하여 stale socket 엔트리 정리
  try {
    const activeSocketIds = new Set([...io.sockets.sockets.keys()]);
    const before = onlineUsersList.length;
    onlineUsersList = onlineUsersList.filter((u) => activeSocketIds.has(u.socketId));
    const after = onlineUsersList.length;
    if (before !== after) {
      console.log(`🧹 Pruned stale socket entries: ${before - after} removed. Active: ${after}`);
    }
  } catch (e) {
    console.log('Prune on connection failed:', e);
  }
  
  // 클라이언트가 로그인하여 온라인 사용자 목록에 등록될 때 호출됩니다.
  socket.on("online:user", ({ useremail, userId }) => {
    // 소켓 연결 시 해당 소켓에 사용자 정보를 저장 (disconnect 시 활용)
    socket.data.useremail = useremail;
    socket.data.userId = userId; // userId도 저장하여 removeUser에서 활용

    // 이미 온라인으로 감지된 유저인지(이메일 기준) 확인 → 최초 온라인 진입일 때만 브로드캐스트
    const wasKnownUser = onlineUsersList.some((u) => u.useremail === useremail);

    // online 진입 시에도 한번 더 정리 (네트워크 스파이크/지연 대비)
    try {
      const activeSocketIds = new Set([...io.sockets.sockets.keys()]);
      onlineUsersList = onlineUsersList.filter((u) => activeSocketIds.has(u.socketId));
    } catch {}

    addUser(useremail, socket.id, userId);

    if (!wasKnownUser) {
      io.emit('register:user', useremail); // 모든 클라이언트에게 '신규 온라인 유저' 알림
    }

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

  // 사용자가 채팅방을 삭제/나갈 때: 남아있는 사용자에게만 알림
  socket.on("exit:room", (data) => {
    const { conversationId, userIds } = data; // userIds: 남아있는 사용자들의 userId 배열

    // 남아있는 사용자들의 모든 소켓만 수집 (현재 보낸 소켓/나간 사용자는 제외됨)
    const recipientSocketIds = new Set();
    userIds.forEach((uid) => {
      const sockets = getUserSocketIdsById(uid);
      sockets.forEach((sid) => {
        if (sid !== socket.id) recipientSocketIds.add(sid);
      });
    });

    recipientSocketIds.forEach((sid) => {
      io.to(sid).emit('exit:user', { conversationId, userIds });
    });

    console.log(`Exit room event for conversation ${conversationId}. Sent to ${recipientSocketIds.size} sockets. recipients=`, Array.from(recipientSocketIds));
  });

  // 메시지 전송 시
  socket.on("send:message", (data) => {
    const { newMessage, conversationUsers } = data;
    
    // 1) 현재 대화방에 참여 중인 소켓(내가 보낸 소켓 제외)에게만 메시지 이벤트 전송
    socket.to(newMessage.conversationId).emit('receive:message', newMessage);
    console.log(`Message sent to room ${newMessage.conversationId}.`);

    // 2) 모든 참여자 소켓에 대화 목록 갱신 이벤트 전송 (receive:conversation)
    conversationUsers.users.forEach(user => {
      const userSockets = getUserSocketIdsByEmail(user.email);
      userSockets.forEach((userSocketId) => {
        io.to(userSocketId).emit('receive:conversation', newMessage, user.email);
      });
    });
  });

  // 메시지 읽음 처리 시
  socket.on("read:messages", (data) => {
    const { conversationId } = data;
    // 해당 대화방에 있는 사용자(보낸 소켓 제외)에게 메시지 읽음 알림
    socket.to(conversationId).emit('read:message');
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
        // 현재 보낸 소켓으로는 다시 보내지 않음 (본인 탭 중복 방지)
        if (socketId === socket.id) return;
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
    try {
      // socket.io는 disconnect 시 자동으로 모든 room에서 소켓을 제거합니다.
      // 안전 로그: 남아있는 room 목록을 출력하여 디버깅에 도움을 줍니다.
      const joinedRooms = [...socket.rooms].filter((r) => r !== socket.id);
      if (joinedRooms.length > 0) {
        console.log(`ℹ️ Disconnect cleanup for ${socket.id}, rooms still referenced:`, joinedRooms);
      }
    } catch (e) {
      console.log('Room cleanup inspection failed:', e);
    }
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