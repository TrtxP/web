import type { ChatEvent, ChatMessage, ChatSummary } from "../model/types.ts";

// GraphQL ID is serialized as a string. Keep numeric IDs at the existing UI boundary.
export type WireMessage = Omit<ChatMessage, "id" | "chatId" | "senderId"> & {
  id: string; chatId: string; senderId: string;
};

export function mapMessage(message: WireMessage): ChatMessage {
  return { ...message, id: Number(message.id), chatId: Number(message.chatId), senderId: Number(message.senderId) };
}

export function mapSummary(chat: Omit<ChatSummary, "id" | "partnerId"> & { id: string; partnerId: string }): ChatSummary {
  return { ...chat, id: Number(chat.id), partnerId: Number(chat.partnerId) };
}

export interface WireEvent {
  kind: ChatEvent["kind"];
  chatId: string;
  message: WireMessage | null;
  receipt: { chatId: string; readerId: string } | null;
  typing: { chatId: string; userId: string; typing: boolean } | null;
}

export function mapEvent(event: WireEvent): ChatEvent {
  return {
    kind: event.kind,
    chatId: Number(event.chatId),
    message: event.message ? mapMessage(event.message) : null,
    receipt: event.receipt ? { chatId: Number(event.receipt.chatId), readerId: Number(event.receipt.readerId) } : null,
    typing: event.typing ? { ...event.typing, chatId: Number(event.typing.chatId), userId: Number(event.typing.userId) } : null,
  };
}
