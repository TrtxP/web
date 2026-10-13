import { Client, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export type MessageCallback = (data: unknown) => void;

export class WebSocketService {
  private client: Client | null = null;
  private listeners: Map<string, Set<MessageCallback>> = new Map();
  private stompSubscriptions: Map<string, StompSubscription> = new Map();

  connect(token: string) {
    if (this.client && this.client.active) return;

    const wsUrl = `http://localhost:8080/ws`;

    console.log(`Connecting WebSocket to: ${wsUrl}`);

    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        console.log(`STOMP Debug: ${str}`);
      },
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      console.log(`STOMP Connected successfully`);

      this.stompSubscriptions.clear();

      this.listeners.forEach((_, destination) => {
        this.subscribeToStomp(destination);
      });
    };

    this.client.onStompError = (frame) => {
      console.error(`STOMP Broker error: ${frame.headers["message"]}`);
      console.error(`Additional details: ${frame.body}`);
    };

    this.client.activate();
  }

  subscribe(destination: string, callback: MessageCallback): () => void {
    if (!this.listeners.has(destination)) {
      this.listeners.set(destination, new Set());
    }

    this.listeners.get(destination)!.add(callback);

    if (this.client && this.client.connected) {
      this.subscribeToStomp(destination);
    }

    return () => {
      const callbacks = this.listeners.get(destination);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.stompSubscriptions.get(destination)?.unsubscribe();
          this.stompSubscriptions.delete(destination);
          this.listeners.delete(destination);
        }
      }
    };
  }

  private subscribeToStomp(destination: string) {
    if (this.stompSubscriptions.has(destination) || !this.client) return;

    const sub = this.client.subscribe(destination, (message) => {
      try {
        const payload = JSON.parse(message.body);
        const callbacks = this.listeners.get(destination);
        if (callbacks) {
          callbacks.forEach((cb) => {
            try {
              cb(payload);
            } catch (err) {
              console.error(
                `Error in STOMP listener callback for ${destination}:`,
                err,
              );
            }
          });
        }
      } catch (err) {
        console.error(`Error parsing STOMP body: ${err}`);
      }
    });

    this.stompSubscriptions.set(destination, sub);
  }

  send(destination: string, data: unknown) {
    if (this.client && this.client.connected) {
      this.client.publish({
        destination,
        body: JSON.stringify(data),
      });
    } else {
      console.warn(`Cannot send message, STOMP client is not connected`);
    }
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.stompSubscriptions.clear();
      this.listeners.clear();
    }
  }
}

export const websocketService = new WebSocketService();
