type MessageCallback = (data: any) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<MessageCallback>> = new Map();

  connect(token: string) {
    if (this.socket) return;

    // Connects matching your backend ChatWebSocketController rules
    this.socket = new WebSocket(`ws://localhost:8080/ws/chat?token=${token}`);

    this.socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const type = payload.type; 
        this.listeners.get(type)?.forEach((cb) => cb(payload.data));
      } catch (err) {
        console.error('Error parsing inbound socket frame:', err);
      }
    };

    this.socket.onclose = () => {
      this.socket = null;
    };
  }

  subscribe(eventType: string, callback: MessageCallback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
    return () => this.listeners.get(eventType)?.delete(callback);
  }

  send(type: string, data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, data }));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const websocketService = new WebSocketService();