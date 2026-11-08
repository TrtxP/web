import { graphqlRequest } from "../../../shared/api/graphqlClient.ts";
import { messageFields } from "./chatDocuments.ts";
import { mapMessage, mapSummary, type WireMessage } from "./chatMapping.ts";
import type { ChatMessage, ChatSummary } from "../model/types.ts";

export const chatApi = {
  getOrCreateChat: async (targetUserId: number): Promise<number> => {
    const data = await graphqlRequest<{ openChat: string }>(
      "mutation OpenChat($participantId: ID!) { openChat(participantId: $participantId) }",
      { participantId: targetUserId },
    );
    return Number(data.openChat);
  },

  getUserChats: async (): Promise<ChatSummary[]> => {
    const data = await graphqlRequest<{ chats: Parameters<typeof mapSummary>[0][] }>(
      "query Chats { chats { id partnerId partnerName lastMessageAt } }",
    );
    return data.chats.map(mapSummary);
  },

  getChatMessages: async (
    chatId: number,
    page = 0,
    size = 30,
  ): Promise<{ content: ChatMessage[]; last: boolean }> => {
    const data = await graphqlRequest<{ chatMessages: { content: WireMessage[]; last: boolean } }>(
      `query ChatMessages($chatId: ID!, $page: Int!, $size: Int!) {
        chatMessages(chatId: $chatId, page: $page, size: $size) {
          content { ${messageFields} } last
        }
      }`, { chatId, page, size },
    );
    return { ...data.chatMessages, content: data.chatMessages.content.map(mapMessage) };
  },

  sendChatMessage: async (chatId: number, content: string): Promise<ChatMessage> => {
    const data = await graphqlRequest<{ sendMessage: WireMessage }>(
      `mutation SendMessage($input: SendMessageInput!) { sendMessage(input: $input) { ${messageFields} } }`,
      { input: { chatId, content } },
    );
    return mapMessage(data.sendMessage);
  },

  sendChatTyping: async (chatId: number, typing: boolean): Promise<void> => {
    await graphqlRequest("mutation SetChatTyping($chatId: ID!, $typing: Boolean!) { setChatTyping(chatId: $chatId, typing: $typing) }",
      { chatId, typing });
  },

  markChatAsRead: async (chatId: number): Promise<void> => {
    await graphqlRequest("mutation MarkChatRead($chatId: ID!) { markChatRead(chatId: $chatId) }", { chatId });
  },
};
