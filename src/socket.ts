"use client";
import { BASE_URL } from "@/config";
import { io } from "socket.io-client";

export const socket = io(BASE_URL, {
  withCredentials: true, // 쿠키가 전송되도록 설정
});