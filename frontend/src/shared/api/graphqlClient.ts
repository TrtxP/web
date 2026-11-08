import { createClient, type Client } from "graphql-ws";
import { api } from "./httpClient.ts";

interface GraphQlResponse<T> {
  data?: T;
  errors?: readonly { message: string; extensions?: { classification?: unknown } }[];
}

export class GraphQlRequestError extends Error {
  readonly errors: NonNullable<GraphQlResponse<unknown>["errors"]>;
  constructor(errors: NonNullable<GraphQlResponse<unknown>["errors"]>) {
    super(errors.map((error) => error.message).join("; "));
    this.errors = errors;
    this.name = "GraphQlRequestError";
  }
}

export async function graphqlRequest<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const { data: response } = await api.post<GraphQlResponse<T>>("/graphql", { query, variables });
  if (response.errors?.length) throw new GraphQlRequestError(response.errors);
  if (!response.data) throw new Error("GraphQL response has no data");
  return response.data;
}

let socket: Client | undefined;
let socketToken: string | null = null;

function getSocket(): Client {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Sign in to subscribe to chat events");
  if (!socket || socketToken !== token) {
    void socket?.dispose();
    const baseUrl = new URL(api.defaults.baseURL || "/", window.location.origin);
    // Preserve a deployment prefix such as /api.
    baseUrl.pathname = `${baseUrl.pathname.replace(/\/$/, "")}/graphql/ws`;
    baseUrl.protocol = baseUrl.protocol === "https:" ? "wss:" : "ws:";
    socketToken = token;
    socket = createClient({
      url: baseUrl.toString(),
      connectionParams: () => ({ Authorization: `Bearer ${localStorage.getItem("token") || ""}` }),
      lazy: true,
      retryAttempts: 10,
      keepAlive: 20_000,
    });
  }
  return socket;
}

export function subscribeGraphql<T>(query: string, variables: Record<string, unknown>,
  onData: (data: T) => void, onError: (error: unknown) => void,
  onConnected?: () => void): () => void {
  const client = getSocket();
  const removeListener = onConnected ? client.on("connected", onConnected) : undefined;
  const unsubscribe = client.subscribe<T>({ query, variables }, {
    next: (result) => {
      if (result.errors?.length) onError(new GraphQlRequestError(result.errors));
      else if (result.data) onData(result.data);
    },
    error: onError,
    complete: () => {},
  });
  return () => { removeListener?.(); unsubscribe(); };
}

export function disconnectGraphql(): void {
  void socket?.dispose();
  socket = undefined;
  socketToken = null;
}
