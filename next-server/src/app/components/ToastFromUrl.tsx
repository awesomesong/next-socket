"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

const TOAST_PARAM = "toast";
const MESSAGE_PARAM = "message";

export default function ToastFromUrl() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const toastType = searchParams.get(TOAST_PARAM);
    const message = searchParams.get(MESSAGE_PARAM);
    if (!toastType) return;

    let decodedMessage = "";
    if (message) {
      try {
        decodedMessage = decodeURIComponent(message);
      } catch {
        decodedMessage = message;
      }
    }

    switch (toastType) {
      case "success":
        toast.success(decodedMessage || "완료되었습니다.");
        break;
      case "error":
        toast.error(decodedMessage || "오류가 발생했습니다.");
        break;
      case "custom":
        if (decodedMessage) toast(decodedMessage);
        break;
      default:
        if (decodedMessage) toast(decodedMessage);
    }

    // URL만 바꿔서 쿼리 제거 (router.replace 대신 history.replaceState → 불필요한 재요청/리프레시 방지)
    const next = new URLSearchParams(searchParams);
    next.delete(TOAST_PARAM);
    next.delete(MESSAGE_PARAM);
    const search = next.toString();
    const replaceUrl = search ? `${pathname}?${search}` : pathname;
    window.history.replaceState(null, "", replaceUrl);
  }, [pathname, searchParams]);

  return null;
}
