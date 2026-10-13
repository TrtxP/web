import React from "react";

interface ChatHeaderProps {
  partnerName: string | null;
  isPartnerOnline: boolean;
  partnerTyping: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  partnerName,
  isPartnerOnline,
  partnerTyping,
}) => {
  return (
    <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
      <div className="flex flex-col">
        <span className="font-bold">
          {partnerName
            ? `Chat with ${partnerName}`
            : "Conversation Window"}
        </span>
        <span
          className={`text-xs font-semibold ${
            isPartnerOnline ? "text-green-600" : "text-gray-400"
          }`}
        >
          {isPartnerOnline ? "Online" : "Offline"}
        </span>
      </div>

      {partnerTyping && (
        <span className="text-xs font-semibold text-indigo-600 animate-pulse">
          💬 {partnerName} is typing...
        </span>
      )}
    </div>
  );
};

