import { useQueryClient } from '@tanstack/react-query';
import { conversationListKey } from '@/src/app/lib/react-query/chatCache';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

export const useConversationLoading = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isChatPage = pathname?.startsWith('/conversations') ?? false;
  const queryClient = useQueryClient();
  
  const queryState = useMemo(() => {
    if (!session?.user?.email || !isChatPage) return { isLoading: false, isSuccess: false, status: 'idle' };
    
    const query = queryClient.getQueryState(conversationListKey);
    return {
      isLoading: query?.status === 'pending' || query?.fetchStatus === 'fetching',
      isSuccess: query?.status === 'success',
      status: query?.status || 'idle'
    };
  }, [queryClient, session?.user?.email, isChatPage]);

  return {
    isLoading: queryState.isLoading,
    isSuccess: queryState.isSuccess,
    status: queryState.status
  };
};
