import { Server as NetServer } from "net";
import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextResponse } from "next/server";

export interface SocketServer extends NetServer {
  io?: SocketIOServer;
}

export interface NextApiResponseServerIo extends NextResponse {
  socket: { server: HttpServer & SocketServer};
}
