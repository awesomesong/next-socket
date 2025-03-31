export const formatDate = (dateString: string | Date): string => {
    const date = new Date(dateString);
    const now = new Date();
  
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
  
    if (isToday) {
      return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
    } else if (isYesterday) {
      return "어제";
    } else {
      return date.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
    }
};
  