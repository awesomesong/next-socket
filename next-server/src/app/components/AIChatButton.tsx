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
      variant="scent"
      className="px-6"
    >
      {isLoading || isPending ? "생성 중" : `향수 AI 어시스턴트와 채팅`}
    </Button>
  );
};

export default AIChatButton;