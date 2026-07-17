import { Client, type StompSubscription } from "@stomp/stompjs";

type MessageCallback = (data: unknown) => void;

class WebSocketService {
  private client: Client | null = null;
  private listeners: Map<string, Set<MessageCallback>> = new Map();
  private stompSubscriptions: Map<string, StompSubscription> = new Map();

  connect(token: string) {
    if (this.client && this.client.active) return;

    // Connects matching your backend ChatWebSocketController rules
    this.client = new Client({
      brokerURL: `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws/websocket`,
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
      console.log(`STOMP Connected cuccessfully`);

      this.listeners.forEach((_callback, destination) => {
        this.subscribeToStomp(destination);
      });
    };

    this.client.onStompError = (frame) => {
      console.error(`STOMP Broker error: ${frame.headers["message"]}`);
      console.error(`Additional details: ${frame.body}`);
    };

    this.client.activate();
  }

  subscribe(destination: string, callback: MessageCallback) {
    if (!this.listeners.has(destination)) {
      this.listeners.set(destination, new Set());
    }

    this.listeners.get(destination)!.add(callback);

    if (this.client && this.client.connected) {
      this.subscribeToStomp(destination);
    }

    return () => {
      this.listeners.get(destination)?.delete(callback);
      if (this.listeners.get(destination)?.size === 0) {
        this.stompSubscriptions.get(destination)?.unsubscribe();
        this.stompSubscriptions.delete(destination);
      }
    };
  }

  private subscribeToStomp(destination: string) {
    if (this.stompSubscriptions.has(destination) || !this.client) return;

    const sub = this.client.subscribe(destination, (message) => {
      try {
        const payload = JSON.parse(message.body);
        this.listeners.get(destination)?.forEach((cb) => cb(payload));
      } catch (err) {
        console.error(`Error parsing STOMP body: ${err}`);
      }
    });

    this.stompSubscriptions.set(destination, sub);
  }

  send(destination: string, data: unknown) {
    if (this.client && this.client.connected) {
      this.client.publish({
        destination: destination,
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
