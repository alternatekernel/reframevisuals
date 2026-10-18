import { useCallback } from 'react';
import { portalApi } from '../services/portalApi';
import { getApiEndpoint } from '../lib/apiConfig';

export const mapConversationPreview = (c: any) => ({
  ...c,
  timestamp: new Date(c.updatedAt).toLocaleDateString(),
  lastMessage: c.messages?.[0]?.content || 'No messages yet'
});

export const useSharedChatController = () => {
  const fetchConversationList = useCallback(async () => {
    const response = await portalApi.getConversations();
    if (!response.data?.success) return [];
    return (response.data.data || []).map(mapConversationPreview);
  }, []);

  const fetchConversationDetails = useCallback(async (conversationId: string) => {
    const response = await portalApi.getConversationDetails(conversationId);
    if (!response.data?.success) return null;
    return response.data.data;
  }, []);

  const sendConversationMessage = useCallback(async (input: {
    content: string;
    conversationId?: string;
    attachments?: Array<{ url: string; filename: string; size?: number; type?: string; path?: string; folderPath?: string }>;
    guestId?: string;
    metadata?: Record<string, unknown>;
  }) => {
    if (input.attachments?.length) {
      const token = localStorage.getItem('portal_token');
      const guestId = input.guestId || localStorage.getItem('portal_guest_id') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json', 'X-Guest-ID': guestId };
      if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(getApiEndpoint('/portal/chat'), {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          content: input.content,
          conversationId: input.conversationId,
          attachments: input.attachments,
          guestId,
          metadata: input.metadata || {}
        })
      });
      const result = await response.json();
      if (!result?.success) return null;
      return result.data;
    }

    const response = await portalApi.sendMessage(input.content, input.conversationId);
    if (!response.data?.success) return null;
    return response.data.data;
  }, []);

  return {
    fetchConversationList,
    fetchConversationDetails,
    sendConversationMessage,
  };
};
