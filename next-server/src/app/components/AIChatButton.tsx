"use client";
import { useRouter } from "next/navigation";
import Button from "./Button";

interface AIChatButtonProps {
  aiAgentType?: string;
  className?: string;
}

const AIChatButton = ({
  aiAgentType = "assistant",
}: AIChatButtonProps) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/conversations/new?aiAgentType=${aiAgentType}`);
  };

  return (
    <Button
      onClick={handleClick}
      variant="scent"
      className="px-6"
    >
      향수 AI 어시스턴트와 채팅
    </Button>
  );
};

export default AIChatButton;