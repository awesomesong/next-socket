"use client";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io("https://socket-server-muddy-shadow-6983.fly.dev", {
      transports: ['websocket'],
      withCredentials: true,
    });
  }
  return socket;
};