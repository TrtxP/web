import { test } from "node:test";
import assert from "node:assert/strict";
import { mapEvent, mapMessage, mapSummary } from "./chatMapping.ts";

test("GraphQL IDs are converted at the UI boundary", () => {
  const message = mapMessage({ id: "4", chatId: "2", senderId: "8", content: "Hi", sentAt: "2026-11-08T12:00:00", read: false });
  assert.equal(message.id, 4);
  assert.equal(message.chatId, 2);
  assert.equal(message.senderId, 8);
  assert.equal(message.read, false);
  assert.deepEqual(mapSummary({ id: "2", partnerId: "8", partnerName: "Alex" }),
    { id: 2, partnerId: 8, partnerName: "Alex" });
});

test("read and typing events normalize IDs and preserve nullable payloads", () => {
  const event = mapEvent({ kind: "READ", chatId: "2", message: null,
    receipt: { chatId: "2", readerId: "8" }, typing: null });
  assert.deepEqual(event, { kind: "READ", chatId: 2, message: null,
    receipt: { chatId: 2, readerId: 8 }, typing: null });
  assert.deepEqual(mapEvent({ kind: "TYPING", chatId: "2", message: null, receipt: null,
    typing: { chatId: "2", userId: "8", typing: true } }).typing,
    { chatId: 2, userId: 8, typing: true });
});
