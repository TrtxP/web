export const messageFields = "id chatId senderId receiverId content sentAt read";

export const chatEventsDocument = `subscription ChatEvents($chatId: ID) {
  chatEvents(chatId: $chatId) {
    kind chatId
    message { ${messageFields} }
    receipt { chatId readerId }
    typing { chatId userId typing }
  }
}`;
