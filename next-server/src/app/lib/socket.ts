"use client";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL!, {
      transports: ['websocket'],
      withCredentials: true,
    });
  }
  return socket;
};