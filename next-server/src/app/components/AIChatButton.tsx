'use client';
import { useState } from 'react';
import Button from './Button';
import { useCreateAIConversation } from '@/src/app/lib/createAIConversation';

interface AIChatButtonProps {
    aiAgentType?: string;
    className?: string;
}

const AIChatButton = ({ aiAgentType = "assistant", className = "" }: AIChatButtonProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const aiConversationMutation = useCreateAIConversation({
        onSettled: () => {
            setIsLoading(false);
        },
    });

    const handleClick = () => {
        setIsLoading(true);
        aiConversationMutation.mutate({ aiAgentType: aiAgentType as any });
    };

    return (
        <Button
            onClick={handleClick}
            disabled={isLoading}
            color="primary"
            variant="solid"
            size="md"
            radius="md"
            className="bg-gradient-to-r from-blue-700 to-sky-400 hover:from-blue-900 hover:to-sky-600 hover:shadow-blue-500/25"
        >
            {isLoading ? '생성 중...' : `하이트진로 AI 어시스턴트와 채팅`}
        </Button>
    );
};

export default AIChatButton; 