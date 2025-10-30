"use client";
import { io, type Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ??
  "https://socket-server-muddy-shadow-6983.fly.dev";

declare global {
  var __socket__: Socket | undefined;
}

export const getSocket = (): Socket => {
  if (globalThis.__socket__) return globalThis.__socket__;
  
  const socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ["websocket"],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
    timeout: 10_000,
  });

  // 파이어폭스 대응: 연결 실패 시 소켓 재생성
  socket.io.on("reconnect_failed", () => {
    if (globalThis.__socket__) {
      globalThis.__socket__.close();
      delete globalThis.__socket__;
    }
  });

  // 너무 오래 연결 안되면 소켓 재생성 + 페이지 새로고침
  socket.io.on("reconnect_attempt", (attempt) => {
    if (attempt > 10) {
      socket.close();
      delete globalThis.__socket__;
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  });

  globalThis.__socket__ = socket;
  return socket;
};
