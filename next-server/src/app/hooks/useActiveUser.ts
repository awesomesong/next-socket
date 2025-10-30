import { useSocket } from "../context/socketContext";
import { useEffect, useCallback } from "react";
import useActiveList from "./useActiveList";

interface OnlineUserPayload {
  useremail: string;
  userId: string;
}

const useActiveUser = () => {
  const socket = useSocket();
  const { set, add, remove } = useActiveList();

  const handleOnlineUsers = useCallback((users: OnlineUserPayload[]) => {
    const validUserIds = users
      .map(u => String(u.userId || "").trim())
      .filter(id => id.length > 0);
    set(validUserIds);
  }, [set]);

  const handleOnlineUser = useCallback((data: OnlineUserPayload) => {
    const id = String(data?.userId || "").trim();
    add(id);
  }, [add]);

  const handleLeaveUser = useCallback((data: OnlineUserPayload) => {
    const id = String(data?.userId || "").trim();
    remove(id);
  }, [remove]);

  useEffect(() => {
    if (!socket) return;

    socket.off("get:onlineUsers", handleOnlineUsers);
    socket.off("online:user", handleOnlineUser);
    socket.off("leave:user", handleLeaveUser);
    
    socket.on("get:onlineUsers", handleOnlineUsers);
    socket.on("online:user", handleOnlineUser);
    socket.on("leave:user", handleLeaveUser);

    return () => {
      socket.off("get:onlineUsers", handleOnlineUsers);
      socket.off("online:user", handleOnlineUser);
      socket.off("leave:user", handleLeaveUser);
    };
  }, [socket, handleOnlineUsers, handleOnlineUser, handleLeaveUser]);
};

export default useActiveUser;
