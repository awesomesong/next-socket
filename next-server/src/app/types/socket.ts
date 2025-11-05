import { Server as NetServer } from "net";
import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextResponse } from "next/server";
import type { FullMessageType } from "./conversation";

export interface SocketServer extends NetServer {
  io?: SocketIOServer;
}

export interface NextApiResponseServerIo extends NextResponse {
  socket: { server: HttpServer & SocketServer};
}

/**
 * 대화방 스냅샷 타입 (SocketState.tsx에서 사용)
 * 대화방의 상태를 스냅샷으로 저장하여 중복 체크에 사용
 */
export interface ConvSnap {
  baseUnread: number;
  isAI: boolean;
  lastMessageAtMs: number;
  lastId?: string;
}

/**
 * 버퍼링된 메시지 타입 (SocketState.tsx에서 사용)
 * 리스트 준비 전에 도착한 메시지를 임시 저장
 * normalizeMessage의 결과 또는 FullMessageType을 저장
 */
export type BufferedMsg = { 
  id: string; 
  ms: number; 
  msg: FullMessageType;
};
