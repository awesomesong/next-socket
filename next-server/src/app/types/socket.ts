import { Server as NetServer, Socket } from "net";
import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextResponse } from "next/server";
import { User } from "@prisma/client";

export interface SocketServer extends NetServer {
  io?: SocketIOServer;
}

export interface NextApiResponseServerIo extends NextResponse {
  socket: { server: HttpServer & SocketServer};
}

export type MessageSeenInfo = {
  conversationId: string;
  userEmail: string;
  seen: User[];
};
