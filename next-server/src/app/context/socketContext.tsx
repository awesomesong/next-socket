"use client";
import React, { createContext, useContext, useEffect, useMemo } from "react";
import type { Socket } from "socket.io-client";
import { getSocket } from "@/src/app/lib/socket";
import { useSession } from "next-auth/react";

type ExtendedSocket = Omit<Socket, 'auth'> & {
  auth: { useremail: string; userId: string };
  __prevAuth?: { useremail?: string; userId?: string };
};

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();

  // ✅ 인스턴스는 앱 생애주기 내 1회만 생성 (싱글턴)
  const socket = useMemo<Socket | null>(() => {
    try {
      return getSocket(); // 권장: getSocket()이 인자 없이 싱글턴 반환
    } catch {
      return null;
    }
  }, []);

  // ✅ 세션 변화에 따라 auth 주입 + (재)연결
  useEffect(() => {
    if (!socket) return;

    const email = session?.user?.email ?? "";
    const userId = session?.user?.id ?? "";
    const authed = status === "authenticated" && !!email && !!userId;

    if (authed) {
      // 최신 auth 적용 (handshake.auth)
      const extendedSocket = socket as unknown as ExtendedSocket;
      extendedSocket.auth = { useremail: email, userId };

      // 이전 auth와 달라졌다면 재연결로 핸드셰이크 갱신
      const prev = extendedSocket.__prevAuth;
      const changed = !prev || prev.useremail !== email || prev.userId !== userId;

      if (changed) {
        if (socket.connected) socket.disconnect();
        socket.connect();
        extendedSocket.__prevAuth = { useremail: email, userId };
      } else if (!socket.connected) {
        socket.connect();
      }
    } else {
      // 세션 정보 없으면 연결 해제
      if (socket.connected) socket.disconnect();
    }
  }, [socket, status, session?.user?.email, session?.user?.id]);

  // ✅ 언마운트 시 정리
  useEffect(() => {
    return () => {
      try {
        if (socket?.connected) socket.disconnect();
      } catch {}
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);