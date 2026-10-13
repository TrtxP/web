export interface ChatMessage {
  id?: number;
  chatId: number;
  senderId?: number;
  sender?: {
    id: number;
    name?: string;
  };
  content: string;
  sentAt: string | Date;
}

export interface ChatMessageDTO {
  id?: number;
  chatId: number;
  senderId: number;
  content: string;
  sentAt: string;
}

export interface ChatSummary {
  id: number;
  partnerId: number;
  partnerName: string;
  lastMessageAt?: string | null;
  unreadCount?: number;
}

export interface TypingIndicatorDTO {
  userId?: number;
  chatId: number;
  typing: boolean;
}

export interface UserSummary {
  id: number;
  name: string;
  isOnline?: boolean;
  online?: boolean;
}

