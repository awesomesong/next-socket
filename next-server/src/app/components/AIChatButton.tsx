"use client";
import { useState } from "react";
import Button from "./Button";
import { useLaunchAiConversation } from "../lib/createAIConversation";

interface AIChatButtonProps {
  aiAgentType?: string;
  className?: string;
}

const AIChatButton = ({
  aiAgentType = "assistant",
}: AIChatButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { launch, isPending } = useLaunchAiConversation({
    onSettled: () => setIsLoading(false),
  });

  const handleClick = async () => {
    setIsLoading(true);
    await launch({ aiAgentType });
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading || isPending}
      color="primary"
      variant="solid"
      size="md"
      radius="md"
      className="bg-gradient-to-r from-blue-700 to-sky-400 hover:from-blue-900 hover:to-sky-600 hover:shadow-blue-500/25"
    >
      {isLoading || isPending ? "생성 중..." : `하이트진로 AI 어시스턴트와 채팅`}
    </Button>
  );
};

export default AIChatButton;