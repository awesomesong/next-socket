"use client";
import { io } from "socket.io-client";

export const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
  withCredentials: true, // 쿠키가 전송되도록 설정
  transports: ["websocket"],
});