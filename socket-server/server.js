const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

// ✅ UTF-8 인코딩 설정 (한글 깨짐 방지)
process.stdout.setEncoding('utf8');
process.stderr.setEncoding('utf8');

// ✅ 메시지 큐 저장소 (Connection State Recovery 대신)
const messageQueue = new Map(); // userId -> [{ message, timestamp, conversationId }]

// ✅ 메시지 큐잉 헬퍼 함수
const addToQueue = (userId, message, conversationId) => {
  if (!messageQueue.has(userId)) {
    messageQueue.set(userId, []);
  }
  const queue = messageQueue.get(userId);
  queue.push({
    message,
    timestamp: Date.now(),
    conversationId
  });
  // 큐 크기 제한 (최대 50개)
  if (queue.length > 50) {
    queue.shift();
  }
  console.log(`📦 Message queued for user ${userId}: ${queue.length} messages in queue`);
};

const getQueuedMessages = (userId) => {
  const queue = messageQueue.get(userId) || [];
  console.log(`📤 Delivering ${queue.length} queued messages to user ${userId}`);
  return queue;
};

const clearQueue = (userId) => {
  messageQueue.delete(userId);
  console.log(`🗑️ Queue cleared for user ${userId}`);
};

// ✅ 사용자 정보를 담는 Map (socketId -> { useremail, socketId, userId })
// Map을 사용하여 O(1) 추가/삭제/검색 성능 향상
const onlineUsersMap = new Map(); // socketId -> { useremail, socketId, userId }

// ✅ userId로 빠른 검색을 위한 역인덱스 Map (userId -> Set<socketId>)
// O(1) 검색 성능을 위해 추가
const userIdToSocketsMap = new Map(); // userId -> Set<socketId>

// ✅ 온라인 사용자 스냅샷 생성 유틸
function getOnlineSnapshot() {
  return Array.from(
    new Map(Array.from(onlineUsersMap.values()).map(u => [u.userId, { useremail: u.useremail, userId: u.userId }])).values()
  );
}

// ✅ 프로세스 전역 리비전 Map (다중 탭/인스턴스 대비)
const globalRoomRev = new Map();

// ✅ 방별 멤버 캐시 (권한 체크용) - 유저당 소켓 여러 개 고려
// roomId -> (userId -> Set<socketId>)
const roomMembers = new Map();

// ✅ room.event 레이트 리밋용 (per-socket window)
const lastEvtAt = new WeakMap();

/** 헬퍼 함수들 */
// 유저 고정 룸 이름 생성 (개인 알림용)
const userRoom = (userId) => `user:${userId}`;

function joinRoomMember(roomId, userId, socketId) {
  if (!roomMembers.has(roomId)) roomMembers.set(roomId, new Map());
  const byUser = roomMembers.get(roomId);
  if (!byUser.has(userId)) byUser.set(userId, new Set());
  byUser.get(userId).add(socketId);
}

function leaveRoomMember(roomId, userId, socketId) {
  const byUser = roomMembers.get(roomId);
  if (!byUser) return;
  if (byUser.has(userId)) {
    const set = byUser.get(userId);
    set.delete(socketId);
    if (set.size === 0) byUser.delete(userId);
  }
  if (byUser.size === 0) roomMembers.delete(roomId);
}

function isMember(roomId, userId) {
  const byUser = roomMembers.get(roomId);
  return !!byUser && byUser.has(userId) && byUser.get(userId).size > 0;
}

/**
 * 사용자 소켓을 onlineUsersMap에 추가합니다.
 * 동일한 socketId가 이미 존재하면 추가하지 않습니다.
 * @param {string} useremail - 사용자의 이메일
 * @param {string} socketId - 현재 접속한 소켓의 ID
 * @param {string} userId - 사용자의 고유 ID (인증 시스템의 ID)
 */
const addUser = (useremail, socketId, userId) => {
  const email = String(useremail || "").trim().toLowerCase();
  if (!email || !socketId || !userId) return;

  // 같은 소켓이 이미 있으면 스킵
  if (onlineUsersMap.has(socketId)) {
    console.log(`ℹ️ User ${email} (ID: ${userId}) with socket ${socketId} already exists. Skipping add.`);
    return;
  }

  onlineUsersMap.set(socketId, { useremail: email, socketId, userId });
  
  // ✅ 역인덱스 업데이트: userId -> Set<socketId>
  if (!userIdToSocketsMap.has(userId)) {
    userIdToSocketsMap.set(userId, new Set());
  }
  userIdToSocketsMap.get(userId).add(socketId);
  
  console.log(`✅ User ${email} (ID: ${userId}) added with socket ${socketId}. Total online: ${onlineUsersMap.size}`);
};

/**
 * 사용자 소켓을 onlineUsersMap에서 제거합니다.
 * @param {string} socketId - 연결 해제된 소켓의 ID
 * @returns {{useremail: string|null, userId: string|null, isLastSocket: boolean}} - 해당 소켓의 useremail, userId, 그리고 해당 사용자의 마지막 소켓인지 여부
 */
const removeUser = (socketId) => {
  const leavingUser = onlineUsersMap.get(socketId);
  
  if (!leavingUser) {
    console.log(`⚠️ Socket ${socketId} not found in onlineUsersMap for removal.`);
    return null;
  }

  onlineUsersMap.delete(socketId);

  // ✅ 역인덱스 업데이트: userId -> Set<socketId>
  const socketSet = userIdToSocketsMap.get(leavingUser.userId);
  if (socketSet) {
    socketSet.delete(socketId);
    // Set이 비면 Map에서도 제거
    if (socketSet.size === 0) {
      userIdToSocketsMap.delete(leavingUser.userId);
    }
  }

  // ✅ O(1)로 동일한 userId를 가진 다른 소켓이 남아있는지 확인
  const isLastSocket = !userIdToSocketsMap.has(leavingUser.userId);

  console.log(`🗑️ Socket ${socketId} for ${leavingUser.useremail} removed. Total online: ${onlineUsersMap.size}`);

  return {
    useremail: leavingUser.useremail,
    userId: leavingUser.userId,
    isLastSocket: isLastSocket,
  };
};



const app = express();
const httpServer = http.createServer(app);

// ✅ UTF-8 인코딩 설정 (한글 깨짐 방지)
httpServer.setTimeout(30000);
require("dotenv").config();

// 허용 도메인 정리
const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

// 끝 슬래시 정규화된 허용 도메인 캐시 (서버 시작 시 1회만 계산)
const normalizedAllowedOrigins = allowedOrigins.map(orig => orig.replace(/\/$/, ''));

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      
      // origin 끝 슬래시 정규화
      const normalizedOrigin = origin.replace(/\/$/, '');
      
      if (normalizedAllowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
      } else {
        console.log("Blocked origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
  },
  // ✅ Socket.IO v4만 사용 (EIO3 비활성화)
  allowEIO3: false,
  // 연결 상태 감지를 위한 heartbeat/ping 설정
  pingInterval: 25000, // 클라이언트에 ping을 보내는 간격(ms) - 더 자주 체크
  pingTimeout: 90000, // pong 응답을 기다리는 최대 시간(ms)
  upgradeTimeout: 7000, // 업그레이드 타임아웃
  transports: ["websocket"], // websocket 우선 사용으로 업그레이드 지연 방지
});

// Express REST 엔드포인트용 CORS 헤더 미들웨어
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (!origin) {
    next();
    return;
  }
  
  // origin 끝 슬래시 정규화
  const normalizedOrigin = origin.replace(/\/$/, '');
  
  if (normalizedAllowedOrigins.includes(normalizedOrigin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Vary', 'Origin');
  }
  
  next();
});

app.get("/", (req, res) => {
  res.send("Socket.IO server is running!");
});

  // ✅ HTTP POST로 새 사용자 등록 알림 받기 (웹훅 보안 포함)
  app.post('/api/user-registered', express.json(), (req, res) => {
    // 웹훅 보안 체크
    const webhookSecret = req.get('x-webhook-secret');
    const expectedSecret = process.env.WEBHOOK_SECRET;
    
    if (!expectedSecret) {
      console.warn('[Socket Server] WEBHOOK_SECRET 환경변수가 설정되지 않음');
      return res.status(500).json({ ok: false, message: '서버 설정 오류' });
    }
    
    if (webhookSecret !== expectedSecret) {
      console.warn(`[Socket Server] 잘못된 웹훅 시크릿: ${webhookSecret}`);
      return res.status(401).json({ ok: false, message: '인증 실패' });
    }
    
    const { userId, useremail, name, createdAt } = req.body;
    
    console.log(`[Socket Server] HTTP POST로 새 사용자 등록 알림 수신:`, {
      userId,
      useremail,
      name,
      createdAt,
      totalOnlineUsers: onlineUsersMap.size
    });
  
    // 모든 온라인 사용자에게 새 사용자 등록 알림
    io.emit("registered:user", {
      userId,
      useremail,
      name,
      createdAt
    });
  
    console.log(`[Socket Server] 새 사용자 등록 알림 전송 완료: ${name}`);
    
    res.status(200).json({ ok: true, message: '알림 전송 완료' });
});

// CORS preflight OPTIONS 요청 처리
app.options('*', (req, res) => {
  const origin = req.headers.origin;

  if (!origin) return res.sendStatus(200); // !origin 케이스 안전 처리

  // origin 끝 슬래시 정규화
  const normalizedOrigin = origin.replace(/\/$/, '');

  if (normalizedAllowedOrigins.includes(normalizedOrigin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 
      'Content-Type, Authorization, X-Requested-With, Accept, Origin, x-webhook-secret');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.sendStatus(200);
  }

  return res.sendStatus(403);
});

io.on("connection", (socket) => {
  // 🧩 handshake.auth로 초기 유저 정보 세팅
  const authEmail = String(socket.handshake.auth?.useremail || "").trim().toLowerCase();
  const authUserId = String(socket.handshake.auth?.userId || "");

  // ✅ 디버깅: 인증 정보 로깅
  console.log("🔐 Socket auth info:", {
    useremail: authEmail,
    userId: authUserId,
    rawAuth: socket.handshake.auth,
    socketId: socket.id
  });

  if (authEmail) socket.data.useremail = authEmail;
  if (authUserId) socket.data.userId = authUserId;
  
  // ✅ 디버깅: socket.data 설정 확인
  console.log("🔧 Socket data set:", {
    useremail: socket.data.useremail,
    userId: socket.data.userId,
    authEmail,
    authUserId
  });

  // ✅ 소켓이 참여한 방들을 안전하게 추적
  socket.data.joinedRooms = new Set();
  
  // ✅ 유저 고정 룸 조인 (개인 알림용)
  if (authUserId) {
    socket.join(userRoom(authUserId));
    socket.data.joinedRooms.add(userRoom(authUserId));
    console.log(`User ${authEmail} joined personal room: ${userRoom(authUserId)}`);
  }
  
  // 연결 시 한 번: 현재 io의 소켓 목록과 비교하여 stale socket 엔트리 정리
  try {
    const activeSocketIds = new Set([...io.sockets.sockets.keys()]);
    const before = onlineUsersMap.size;
    for (const [socketId, user] of onlineUsersMap.entries()) {
      if (!activeSocketIds.has(socketId) || !user.useremail) {
        onlineUsersMap.delete(socketId);
        // ✅ 역인덱스도 같이 정리
        if (user.userId) {
          const socketSet = userIdToSocketsMap.get(user.userId);
          if (socketSet) {
            socketSet.delete(socketId);
            if (socketSet.size === 0) {
              userIdToSocketsMap.delete(user.userId);
            }
          }
        }
      }
    }
    const after = onlineUsersMap.size;
    if (before !== after) {
      console.log(`🧹 Pruned stale socket entries: ${before - after} removed. Active: ${after}`);
    }
  } catch (e) {
    console.log("Prune on connection failed:", e);
  }

  // ✅ 새로 접속한 소켓에만 1회 스냅샷 전송
  socket.emit("get:onlineUsers", getOnlineSnapshot());

  // 클라이언트가 로그인하여 온라인 사용자 목록에 등록될 때 호출됩니다.
  socket.on("online:user", ({ useremail, userId }) => {
    console.log(`[Socket Server] online:user 이벤트 수신:`, {
      useremail,
      userId,
      socketId: socket.id,
      totalConnections: io.sockets.sockets.size
    });
    
    const email = (useremail || "").trim().toLowerCase();
    const uid = String(userId || "");

    if (!email || !uid) {
      console.log("[online:user] missing email or userId, skip", { email, uid });
      return;
    }
    
    console.log(`[Socket Server] 처리할 사용자 정보:`, {
      email,
      uid,
      socketId: socket.id
    });
    
    // 소켓 연결 시 해당 소켓에 사용자 정보를 저장 (disconnect 시 활용)
    socket.data.useremail = email;
    socket.data.userId = uid; // userId도 저장하여 removeUser에서 활용

    // ✅ 개인 룸 조인 (로그인 완료 시)
    if (uid) {
      const room = userRoom(uid);
      if (!socket.data.joinedRooms?.has(room)) {
        socket.join(room);
        socket.data.joinedRooms.add(room);
        console.log(`User ${email} joined personal room: ${room} (via online:user)`);
      }
      
      // ✅ 큐된 메시지 전달
      const queuedMessages = getQueuedMessages(uid);
      queuedMessages.forEach(({ message, conversationId }) => {
        // 1) 대화방 리스트 업데이트용 (모든 메시지)
        socket.emit("receive:conversation", message);
        
        // 2) 실시간 메시지는 현재 join한 방만 전송
        if (message?.type !== "system") {
          // 현재 join한 방 목록 확인
          const isJoined = socket.data.joinedRooms.has(conversationId);
          if (isJoined) {
            socket.emit("receive:message", message);
          }
        }
      });
      
      // 큐 정리
      if (queuedMessages.length > 0) {
        clearQueue(uid);
      }
    }

    // 빈 이메일이면 등록/브로드캐스트를 수행하지 않음
    if (!email) return;

    // online 진입 시에도 한번 더 정리 (네트워크 스파이크/지연 대비)
    try {
      const activeSocketIds = new Set([...io.sockets.sockets.keys()]);
      for (const [socketId, user] of onlineUsersMap.entries()) {
        if (!activeSocketIds.has(socketId)) {
          onlineUsersMap.delete(socketId);
          // ✅ 역인덱스도 같이 정리
          if (user.userId) {
            const socketSet = userIdToSocketsMap.get(user.userId);
            if (socketSet) {
              socketSet.delete(socketId);
              if (socketSet.size === 0) {
                userIdToSocketsMap.delete(user.userId);
              }
            }
          }
        }
      }
    } catch {}


    // ✅ 해당 유저가 이미 온라인인지 체크 (O(1))
    const alreadyOnline = userIdToSocketsMap.has(uid) && userIdToSocketsMap.get(uid).size > 0;
    
    console.log(`[Socket Server] addUser 호출 전:`, {
      email,
      socketId: socket.id,
      uid,
      currentOnlineCount: onlineUsersMap.size,
      alreadyOnline
    });
    
    addUser(email, socket.id, uid);          // ← 통일된 uid 사용
    
    console.log(`[Socket Server] addUser 호출 후:`, {
      email,
      socketId: socket.id,
      uid,
      newOnlineCount: onlineUsersMap.size,
      onlineUsersMap: Array.from(onlineUsersMap.values()).map(u => ({ useremail: u.useremail, socketId: u.socketId, userId: u.userId }))
    });

    // ✅ 이 유저가 "처음" 온라인 상태가 되었을 때만 델타 전송
    if (!alreadyOnline) {
      console.log(`[Socket Server] 첫 온라인 - 델타 전송: ${email}`);
      io.emit("online:user", { useremail: email, userId: uid });
    } else {
      console.log(`[Socket Server] 이미 온라인 - 델타 스킵: ${email}`);
    }
  });

  // 새 대화방이 생성되었을 때 관련 사용자들에게 알림
  socket.on("conversation:new", (data = {}) => {
    if (!Array.isArray(data.users)) return;
    
    data.users.forEach((user) => {
      if (!user?.id) return;
      io.to(userRoom(String(user.id))).emit("conversation:new", data);
    });
  });

  // 사용자가 채팅방에 입장할 때 (room에 join)
  socket.on("join:room", (roomId) => {
    if (!roomId) return;
    // 🧱 필수 가드: userId가 없으면 join 무시
    if (!socket.data?.userId) {
      console.log(`[join:room] missing userId for socket ${socket.id}, ignoring.`);
      return;
    }
    
    socket.join(roomId);
    
    // ✅ 멤버 캐시 업데이트 (소켓 기준)
    joinRoomMember(roomId, socket.data.userId, socket.id);
    socket.data.joinedRooms.add(roomId);
    
    console.log(`User ${socket.data.useremail} joined room ${roomId}`);
    
    // ✅ join:success 이벤트 전송 (클라이언트에서 방 입장 완료 확인용)
    socket.emit("join:success", roomId);
    console.log(`[join:success] sent to ${socket.data.useremail} for room ${roomId}`);
  });

  // 사용자가 채팅방에서 나갈 때 (room에서 leave)
  socket.on("leave:room", (roomId) => {
    if (!roomId) return;
    if (!socket.data?.userId) return;        // ← 가드 추가
    socket.leave(roomId);
    
    // ✅ 멤버 캐시 업데이트 (소켓 기준)
    leaveRoomMember(roomId, socket.data.userId, socket.id);
    socket.data.joinedRooms.delete(roomId);
    
    console.log(`User ${socket.data.useremail} (Socket: ${socket.id}) left room: ${roomId}`);
  });


  // 메시지 전송 시
  socket.on("send:message", (data) => {
    console.log("📨 send:message received:", {
      hasData: !!data,
      hasNewMessage: !!data?.newMessage,
      conversationId: data?.newMessage?.conversationId,
      socketUserId: socket.data?.userId,
      socketUseremail: socket.data?.useremail
    });
    
    const { newMessage } = data || {};
    const roomId = newMessage?.conversationId;
    if (!roomId) {
      console.log("❌ No roomId found");
      return;
    }
    if (!socket.data?.userId) {
      console.log("❌ No socket.data.userId found");
      return;
    }
    
    // ✅ 멤버십 가드: newMessage.conversation.userIds 사용 (시스템 메시지는 예외)
    const isSystemMessage = newMessage?.type === "system";
    if (!isSystemMessage) {
      const allowedUserIds = newMessage?.conversation?.userIds || [];
      if (!allowedUserIds.includes(socket.data.userId)) {
        console.log(`❌ User ${socket.data.userId} not authorized for room ${roomId}`);
        return;
      }
    }

    // ✅ 한글 이름 로깅 (디버깅용)
    console.log(`📤 Message sender name: ${newMessage?.sender?.name || 'undefined'}`);
    console.log(`📤 Message body: ${newMessage?.body || 'undefined'}`);

    // ✅ 대화방 참여자들에게 실시간 메시지 전송 (유저 룸 기반 + 큐잉)
    const participantUserIds = newMessage?.conversation?.userIds || [];
    participantUserIds.forEach((userId) => {
      // 보낸 본인 제외
      if (userId === socket.data.userId) return;
      
      // ✅ 온라인 사용자 확인 (O(1))
      const isOnline = userIdToSocketsMap.has(userId) && userIdToSocketsMap.get(userId).size > 0;
      
      if (isOnline) {
        // 온라인: 실시간 발송
        // ✅ receive:conversation - 모든 대화방 리스트 업데이트용 (항상 전송)
        io.to(userRoom(userId)).emit("receive:conversation", newMessage);
        
        // ✅ receive:message - 해당 대화방에 join한 경우에만 전송
        if (newMessage?.type !== "system") {
          // roomId(conversationId)에 join한 사용자에게만 전송
          socket.to(roomId).emit("receive:message", newMessage);
        }
      } else {
        // 오프라인: 큐에 저장
        addToQueue(userId, newMessage, roomId);
      }
    });

    console.log(`Message sent to conversation participants: ${participantUserIds.join(', ')}`);
  });


  // ✅ 통합 읽음 상태 처리 (단 한 줄짜리 델타만)
  socket.on("read:state", ({ conversationId, lastMessageId, readerId, seenUsers, messageSenderId } = {}) => {
    if (!conversationId) return;
    if (!socket.data?.userId) return;
    if (!isMember(conversationId, socket.data.userId)) return;

    // ✅ read:state 이벤트 데이터 준비
    const readStateData = {
      conversationId,        // 방
      lastMessageId,         // 어떤 메시지 기준인지
      readerId: readerId || socket.data.userId,      // 누가 읽었는지 (단일 ID만!)
      seenUsers: seenUsers,  // ✅ 읽은 사용자 정보 포함 (클라이언트에서 전달받은 데이터)
    };

    // ✅ 메시지 발신자에게만 전송 (읽음 상태는 발신자만 확인하면 됨)
    if (messageSenderId) {
      // 개인 룸으로 전송 (발신자만 수신)
      io.to(userRoom(messageSenderId)).emit("read:state", readStateData);
      console.log(`[targeted] read:state sent to message sender ${messageSenderId} for room=${conversationId} lastMessageId=${lastMessageId} readerId=${readerId || socket.data.userId} seenUsers=${seenUsers?.length || 0}`);
    } else {
      // messageSenderId가 없으면 기존 방식으로 폴백 (호환성)
      socket.to(conversationId).emit("read:state", readStateData);
      console.log(`[fallback] read:state broadcast to room=${conversationId} lastMessageId=${lastMessageId} readerId=${readerId || socket.data.userId} seenUsers=${seenUsers?.length || 0}`);
    }
  });

  // 블로그 신규 생성 브로드캐스트 (보낸 본인 제외 전체에 전송)
  socket.on("blog:new", (payload) => {
    try {
      socket.broadcast.emit("blog:new", payload);
    } catch (e) {}
  });

  // 블로그 수정 브로드캐스트 (보낸 본인 제외 전체에 전송)
  socket.on("blog:updated", (payload) => {
    try {
      socket.broadcast.emit("blog:updated", payload);
    } catch (e) {}
  });

  // 블로그 삭제 브로드캐스트 (보낸 본인 제외 전체에 전송)
  socket.on("blog:deleted", (payload) => {
    try {
      socket.broadcast.emit("blog:deleted", payload);
    } catch (e) {}
  });

  // 블로그 댓글 신규 생성 브로드캐스트 (보낸 본인 제외 전체에 전송)
  socket.on("blog:comment:new", (payload) => {
    try {
      socket.broadcast.emit("blog:comment:new", payload);
    } catch (e) {}
  });

  // 블로그 댓글 수정 브로드캐스트 (보낸 본인 제외 전체에 전송)
  socket.on("blog:comment:updated", (payload) => {
    try {
      socket.broadcast.emit("blog:comment:updated", payload);
    } catch (e) {}
  });

  // 블로그 댓글 삭제 브로드캐스트 (보낸 본인 제외 전체에 전송)
  socket.on("blog:comment:deleted", (payload) => {
    try {
      socket.broadcast.emit("blog:comment:deleted", payload);
    } catch (e) {}
  });

  // 리뷰: 생성/수정/삭제 브로드캐스트 (보낸 본인 제외 전체)
  socket.on("drink:review:new", (payload) => {
    try {
      socket.broadcast.emit("drink:review:new", payload);
    } catch (e) {}
  });
  socket.on("drink:review:updated", (payload) => {
    try {
      socket.broadcast.emit("drink:review:updated", payload);
    } catch (e) {}
  });
  socket.on("drink:review:deleted", (payload) => {
    try {
      socket.broadcast.emit("drink:review:deleted", payload);
    } catch (e) {}
  });


  // 소켓 연결 해제 시
  socket.on("disconnect", () => {
    try {
      // ✅ 안전한 방 추적으로 정리 (socket.rooms가 비어있을 수 있음)
      const joinedRooms = [...(socket.data.joinedRooms ?? [])];
      if (joinedRooms.length > 0) {
        console.log(`ℹ️ Disconnect cleanup for ${socket.id}, rooms tracked:`, joinedRooms);
      }
      
      // ✅ 소켓을 해당 방들에서 강제로 탈퇴 (Socket.IO도 자동 정리하지만 명시적으로)
      if (joinedRooms.length) {
        for (const roomId of joinedRooms) {
          try { socket.leave(roomId); } catch {}
          if (socket.data?.userId) {
            leaveRoomMember(roomId, socket.data.userId, socket.id);
          }
        }
      }
    } catch (e) {
      console.log("Room cleanup inspection failed:", e);
    }
    // socket.data에 저장된 사용자 이메일과 userId 정보를 가져옵니다.
    const disconnectedUserEmail = socket?.data?.useremail;
    const disconnectedUserId = socket?.data?.userId;

    // onlineUsersList에서 소켓을 제거하고, 해당 사용자의 마지막 소켓인지 확인합니다.
    const result = removeUser(socket.id); // removeUser 함수는 이미 isLastSocket을 반환합니다.

    // ✅ 델타만 전송 (전체 스냅샷 브로드캐스트 제거)
    if (result && result.isLastSocket) {
      console.log(
        `📤 ${disconnectedUserEmail} (ID: ${disconnectedUserId}) fully disconnected.`,
      );
      io.emit("leave:user", { useremail: result.useremail, userId: result.userId }); // removeUser 반환값 사용 (socket.data 미설정 대비)
    } else if (result) {
        console.log(`ℹ️ Socket ${socket.id} for ${disconnectedUserEmail} disconnected, but other sessions remain.`);
    } else {
        console.log(`⚠️ Disconnected socket ${socket.id} not found in user list.`);
    }
  });

  // ✅ room.event 핸들러 추가 (보안 강화된 델타 이벤트)
  socket.on("room.event", async (evt) => {
    const { conversationId, type, userId, ts, rev, recipients } = evt || {};
    
    // 0) 간단 레이트 리밋 (200ms window)
    const now = Date.now();
    const lastEvent = lastEvtAt.get(socket) || 0;
    if (now - lastEvent < 200) return; // 200ms window
    lastEvtAt.set(socket, now);
    
    // 1) 기본 유효성 검사
    if (!conversationId || !type) return;
    
    // 2) 권한/형식 체크
    if (!socket.data.userId) return;
    if (!["member.left", "room.deleted"].includes(type)) return;
    // member.left만 자신만 보낼 수 있도록 제한 (room.deleted는 누가 보내든 상관없음)
    if (type === "member.left" && userId !== socket.data.userId) return;
    
    // 3) 리비전 가드 (프로세스 전역 Map) - 서버가 rev 산출
    const last = globalRoomRev.get(conversationId) ?? 0;
    const nextRev = Math.max(last + 1, Date.now()); // 단조 증가 + 대략적 시간 반영
    globalRoomRev.set(conversationId, nextRev);

    const eventPayload = {
      conversationId,
      type,
      userId,
      ts: Date.now(),
      rev: nextRev,
    };

    // 4) 알림 대상 사용자들 (남은 사용자들 + 나간 사용자)
    const notifyUserIds = new Set();
    
    // 남은 사용자들 추가
    if (recipients && Array.isArray(recipients)) {
      recipients.forEach(id => notifyUserIds.add(id));
    }
    
    // 나간 사용자 추가 (캐시 정리용)
    if (type === "member.left" && userId) {
      notifyUserIds.add(userId);
    }
    
    // 모든 대상 사용자들에게 알림 (userRoom 기반)
    for (const recipientId of notifyUserIds) {
      io.to(userRoom(String(recipientId))).emit("room.event", eventPayload);
    }
    
    // 5) 이벤트 타입별 서버 주도 정리
    if (type === "member.left") {
      // 해당 userId의 소켓만 방에서 퇴장
      const byUser = roomMembers.get(conversationId);
      const socketIds = byUser?.get(userId);
      if (socketIds && socketIds.size) {
        for (const sid of socketIds) {
          const s = io.sockets.sockets.get(sid);
          if (s) {
            try { s.leave(conversationId); } catch {}
          }
        }
        byUser.delete(userId);
        if (byUser.size === 0) roomMembers.delete(conversationId);
      }
    } else if (type === "room.deleted") {
      // 모든 소켓을 해당 방에서 퇴장시키고 캐시도 삭제
      io.in(conversationId).socketsLeave(conversationId);
      roomMembers.delete(conversationId);
    }
    
    console.log(`[room.event] ${type} room=${conversationId} user=${userId} rev=${nextRev}`);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`> Server running on PORT ${PORT}`);
});
