import React from "react";

interface ChatMessageInputProps {
  disabled?: boolean;
  inputValue: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendMessage: (e: React.FormEvent) => void;
}

export const ChatMessageInput: React.FC<ChatMessageInputProps> = ({
  disabled = false,
  inputValue,
  onInputChange,
  onSendMessage,
}) => {
  return (
    <form
      onSubmit={onSendMessage}
      className="p-4 border-t bg-gray-50 flex gap-2"
    >
      <input
        disabled={disabled}
        maxLength={5000}
        type="text"
        value={inputValue}
        onChange={onInputChange}
        placeholder="Type your message..."
        className="flex-1 border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
      />
      <button
        disabled={disabled || !inputValue.trim()}
        type="submit"
        className="bg-indigo-600 text-white px-6 rounded-xl text-sm font-bold hover:bg-indigo-700 transition"
      >
        Send
      </button>
    </form>
  );
};

