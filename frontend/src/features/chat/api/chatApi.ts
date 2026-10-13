import { api } from "../../../shared/api/httpClient.ts";
import { websocketService } from "../../../shared/ws/websocketService.ts";
import type { ChatMessage, ChatSummary } from "../model/types.ts";

export const chatApi = {
  getOrCreateChat: async (targetUserId: number): Promise<number> => {
    try {
      const res = await api.post<{ id: number }>("/chats", {
        participantId: targetUserId,
      });
      return res.data.id;
    } catch (err) {
      console.error(`Failed to get or create chat: ${err}`);
      throw err;
    }
  },

  getUserChats: async (): Promise<ChatSummary[]> => {
    const res = await api.get<ChatSummary[]>("/chats");
    return res.data;
  },

  getChatMessages: async (
    chatId: number,
    page = 0,
    size = 30,
  ): Promise<{ content: ChatMessage[]; last: boolean } | ChatMessage[]> => {
    const res = await api.get<
      { content: ChatMessage[]; last: boolean } | ChatMessage[]
    >(`/chats/${chatId}/messages?page=${page}&size=${size}`);
    return res.data;
  },

  sendChatMessage: (chatId: number, content: string): void => {
    websocketService.send("/app/chat.send", {
      chatId,
      content,
    });
  },

  sendChatTyping: (chatId: number, typing: boolean): void => {
    websocketService.send("/app/chat.typing", {
      chatId,
      typing,
    });
  },
};

