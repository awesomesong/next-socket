export const formatMessageCount = (count: number) => {
    return count >= 100 ? "99+" : count.toString();
}