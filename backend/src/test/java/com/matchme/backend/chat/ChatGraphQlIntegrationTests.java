package com.matchme.backend.chat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.WebSocket;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.Executors;

import com.matchme.backend.chat.repository.ChatMessageRepository;
import com.matchme.backend.chat.repository.ChatRepository;
import com.matchme.backend.chat.service.ChatService;
import com.matchme.backend.connection.model.Connection;
import com.matchme.backend.connection.model.ConnectionStatus;
import com.matchme.backend.connection.repository.ConnectionRepository;
import com.matchme.backend.shared.security.JwtService;
import com.matchme.backend.user.model.User;
import com.matchme.backend.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.graphql.server.WebGraphQlHandler;
import org.springframework.graphql.test.tester.WebGraphQlTester;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class ChatGraphQlIntegrationTests {
    @LocalServerPort int port;
    @Autowired ObjectMapper json;
    @Autowired JwtService jwt;
    @Autowired WebGraphQlHandler graphQlHandler;
    @Value("${matchme.jwt.secret}") String signingSecret;
    @Autowired UserRepository users;
    @Autowired ChatRepository chats;
    @Autowired ChatMessageRepository messages;
    @Autowired ConnectionRepository connections;
    @Autowired ChatService chatService;
    @Autowired org.springframework.transaction.PlatformTransactionManager transactionManager;
    @Autowired org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    User alice;
    User bob;
    User outsider;
    long chatId;

    @BeforeEach
    void setup() {
        messages.deleteAll();
        chats.deleteAll();
        connections.deleteAll();
        users.deleteAll();
        alice = user("Alice");
        bob = user("Bobby");
        outsider = user("Other");
        Connection connection = new Connection();
        connection.setRequester(alice);
        connection.setReceiver(bob);
        connection.setStatus(ConnectionStatus.ACCEPTED);
        connections.save(connection);
        chatId = chatService.getOrCreateChat(alice.getId(), bob.getId()).getId();
    }

    @Test
    void httpAuthenticationAndChatAuthorization() throws Exception {
        assertThat(request(null, "{ chats { id } }").statusCode()).isEqualTo(401);
        assertThat(request("invalid", "{ chats { id } }").statusCode()).isEqualTo(401);
        for (String operation : new String[] {
                "{ chatMessages(chatId: %d) { content { id } } }",
                "mutation { sendMessage(input: {chatId: %d, content: \"secret\"}) { id } }",
                "mutation { markChatRead(chatId: %d) }",
                "mutation { setChatTyping(chatId: %d, typing: true) }" }) {
            JsonNode result = execute(outsider, operation.formatted(chatId));
            assertThat(result.at("/errors/0/extensions/classification").asText()).isEqualTo("FORBIDDEN");
        }
        assertThat(messages.count()).isZero();
        var rest = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/chats/" + chatId + "/messages"))
                .header("Authorization", "Bearer " + jwt.generateToken(outsider.getId())).GET().build();
        assertThat(http.send(rest, HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(403);
    }

    @Test
    void graphQlTesterVerifiesSchemaAndComplexityLimit() {
        var tester = WebGraphQlTester.builder(graphQlHandler)
                .headers(headers -> headers.setBearerAuth(jwt.generateToken(alice.getId()))).build();
        tester.document("{ chats { id partnerId } }").execute()
                .path("chats[0].id").entity(String.class).isEqualTo(Long.toString(chatId));
        StringBuilder expensive = new StringBuilder("{");
        for (int i = 0; i < 201; i++) expensive.append("c").append(i).append(": chats { id } ");
        expensive.append("}");
        tester.document(expensive.toString()).execute().errors()
                .expect(error -> error.getMessage().contains("complexity")).verify();
    }

    @Test
    void concurrentOpenChatCreatesOneChatForBothDirections() throws Exception {
        chats.deleteAll();
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> chatService.getOrCreateChat(alice.getId(), bob.getId()).getId());
            var second = executor.submit(() -> chatService.getOrCreateChat(bob.getId(), alice.getId()).getId());
            assertThat(first.get(5, TimeUnit.SECONDS)).isEqualTo(second.get(5, TimeUnit.SECONDS));
            assertThat(chats.count()).isEqualTo(1);
        }
    }

    @Test
    void expiredSubscriptionCannotReceiveFurtherEvents() throws Exception {
        String token = new JwtService(signingSecret, 2000).generateToken(bob.getId());
        try (Socket socket = socket(token)) {
            socket.subscribe(chatId);
            socket.barrier();
            org.awaitility.Awaitility.await().atMost(Duration.ofSeconds(5))
                    .until(() -> jwt.extractUserId(token).isEmpty());
            execute(alice, send("After expiry"));
            JsonNode response = socket.next();
            assertThat(response.path("type").asText()).isEqualTo("error");
            assertThat(response.toString()).contains("UNAUTHORIZED").doesNotContain("After expiry");
        }
    }

    @Test
    void dtoContractValidationAndPagination() throws Exception {
        JsonNode first = execute(alice, send("Hello"));
        assertThat(first.has("errors")).isFalse();
        assertThat(first.at("/data/sendMessage/senderId").asText()).isEqualTo(alice.getId().toString());
        assertThat(first.at("/data/sendMessage/sentAt").asText()).isNotBlank();
        execute(bob, send("Reply"));
        JsonNode page = execute(alice, "{ chatMessages(chatId: %d, size: 1) { content { content senderId } last totalElements } }".formatted(chatId));
        assertThat(page.at("/data/chatMessages/content/0/content").asText()).isEqualTo("Reply");
        assertThat(page.at("/data/chatMessages/last").asBoolean()).isFalse();
        assertThat(page.at("/data/chatMessages/totalElements").asDouble()).isEqualTo(2);
        assertThat(execute(alice, "{ chatMessages(chatId: %d, size: 101) { last } }".formatted(chatId))
                .at("/errors/0/extensions/classification").asText()).isEqualTo("BAD_REQUEST");
        assertThat(execute(alice, send("   ")).at("/errors/0/extensions/classification").asText()).isEqualTo("BAD_REQUEST");
        assertThat(execute(alice, "{ chatMessages(chatId: %d) { content { sender { password } } } }".formatted(chatId)).has("errors")).isTrue();
        assertThat(execute(alice, "mutation { openChat(participantId: %d) }".formatted(bob.getId()))
                .at("/data/openChat").asText()).isEqualTo(Long.toString(chatId));
        assertThat(execute(alice, "mutation { openChat(participantId: %d) }".formatted(outsider.getId()))
                .at("/errors/0/extensions/classification").asText()).isEqualTo("FORBIDDEN");
    }

    @Test
    void profileWritesRequireOwnershipAndPasswordsAreHashedAndHidden() throws Exception {
        for (String suffix : new String[] { "", "/profile", "/bio" }) {
            var otherWrite = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/users/" + bob.getId() + suffix))
                    .header("Authorization", "Bearer " + jwt.generateToken(alice.getId()))
                    .header("Content-Type", "application/json")
                    .method("PATCH", HttpRequest.BodyPublishers.ofString("{}")).build();
            assertThat(http.send(otherWrite, HttpResponse.BodyHandlers.ofString()).statusCode()).isEqualTo(403);
        }
        var ownWrite = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/me"))
                .header("Authorization", "Bearer " + jwt.generateToken(alice.getId()))
                .header("Content-Type", "application/json")
                .method("PATCH", HttpRequest.BodyPublishers.ofString("{\"password\":\"NewPassword2!\"}")).build();
        var response = http.send(ownWrite, HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(json.readTree(response.body()).has("password")).isFalse();
        assertThat(passwordEncoder.matches("NewPassword2!", users.findById(alice.getId()).orElseThrow().getPassword())).isTrue();
        assertThat(json.valueToTree(users.findById(alice.getId()).orElseThrow()).has("password")).isFalse();
    }

    @Test
    void subscriptionsDeliverMessagesReadReceiptsAndTypingOnlyToParticipants() throws Exception {
        try (Socket bobSocket = socket(jwt.generateToken(bob.getId()));
             Socket outsiderSocket = socket(jwt.generateToken(outsider.getId()))) {
            bobSocket.subscribe(null);
            outsiderSocket.subscribe(null);
            // A query on the same connection acts as a barrier after the subscribe frame.
            bobSocket.barrier();
            outsiderSocket.barrier();
            execute(alice, send("Live message"));
            JsonNode event = bobSocket.next();
            assertThat(event.at("/payload/data/chatEvents/kind").asText()).isEqualTo("MESSAGE");
            assertThat(event.at("/payload/data/chatEvents/message/content").asText()).isEqualTo("Live message");
            assertThat(outsiderSocket.frames.poll(200, TimeUnit.MILLISECONDS)).isNull();
            execute(bob, "mutation { markChatRead(chatId: %d) }".formatted(chatId));
            assertThat(bobSocket.next().at("/payload/data/chatEvents/kind").asText()).isEqualTo("READ");
            execute(alice, "mutation { setChatTyping(chatId: %d, typing: true) }".formatted(chatId));
            assertThat(bobSocket.next().at("/payload/data/chatEvents/typing/userId").asText()).isEqualTo(alice.getId().toString());
        }
    }

    @Test
    void websocketRejectsInvalidTokenAndUnauthorizedChatSubscription() throws Exception {
        Socket invalid = new Socket();
        WebSocket ws = connect(invalid);
        ws.sendText(json.writeValueAsString(Map.of("type", "connection_init", "payload", Map.of("Authorization", "Bearer invalid"))), true).join();
        assertThat(invalid.closed.get(5, TimeUnit.SECONDS)).isBetween(4400, 4499);
        try (Socket socket = socket(jwt.generateToken(outsider.getId()))) {
            socket.subscribe(chatId);
            JsonNode response = socket.next();
            assertThat(response.toString()).contains("FORBIDDEN");
        }
    }

    @Test
    void rollbackDoesNotPublishEventsOrPersistMessages() throws Exception {
        try (Socket socket = socket(jwt.generateToken(bob.getId()))) {
            socket.subscribe(chatId);
            socket.barrier();
            new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
                chatService.sendMessage(chatId, alice.getId(), "Rolled back");
                status.setRollbackOnly();
            });
            assertThat(messages.count()).isZero();
            assertThat(socket.frames.poll(200, TimeUnit.MILLISECONDS)).isNull();
        }
    }

    private User user(String name) {
        User user = new User();
        user.setName(name);
        user.setEmail(name.toLowerCase() + "@example.com");
        user.setPassword("Password1!");
        return users.save(user);
    }

    private String send(String content) {
        return "mutation { sendMessage(input: {chatId: %d, content: \"%s\"}) { id senderId content sentAt read } }".formatted(chatId, content);
    }

    private HttpResponse<String> request(String token, String query) throws Exception {
        var builder = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/graphql"))
                .header("Origin", "http://localhost:5173")
                .timeout(Duration.ofSeconds(10)).header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(Map.of("query", query))));
        if (token != null) builder.header("Authorization", "Bearer " + token);
        return http.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    private JsonNode execute(User user, String query) throws Exception {
        var response = request(jwt.generateToken(user.getId()), query);
        assertThat(response.statusCode()).isEqualTo(200);
        return json.readTree(response.body());
    }

    private WebSocket connect(Socket listener) {
        return http.newWebSocketBuilder().subprotocols("graphql-transport-ws")
                .header("Origin", "http://localhost:5173")
                .connectTimeout(Duration.ofSeconds(5))
                .buildAsync(URI.create("ws://localhost:" + port + "/graphql/ws"), listener).join();
    }

    private Socket socket(String token) throws Exception {
        Socket socket = new Socket();
        socket.ws = connect(socket);
        socket.send(Map.of("type", "connection_init", "payload", Map.of("Authorization", "Bearer " + token)));
        assertThat(socket.next().path("type").asText()).isEqualTo("connection_ack");
        return socket;
    }

    private class Socket implements WebSocket.Listener, AutoCloseable {
        WebSocket ws;
        final BlockingQueue<JsonNode> frames = new LinkedBlockingQueue<>();
        final CompletableFuture<Integer> closed = new CompletableFuture<>();
        final StringBuilder text = new StringBuilder();
        @Override public void onOpen(WebSocket socket) { socket.request(1); }
        @Override public CompletionStage<?> onText(WebSocket socket, CharSequence part, boolean last) {
            text.append(part);
            if (last) {
                JsonNode frame = json.readTree(text.toString());
                text.setLength(0);
                if (frame.path("type").asText().equals("ping")) socket.sendText("{\"type\":\"pong\"}", true);
                else frames.add(frame);
            }
            socket.request(1);
            return null;
        }
        @Override public CompletionStage<?> onClose(WebSocket socket, int code, String reason) {
            closed.complete(code);
            return null;
        }
        void send(Map<String, Object> frame) { ws.sendText(json.writeValueAsString(frame), true).join(); }
        void subscribe(Long id) {
            String argument = id == null ? "" : "(chatId: " + id + ")";
            send(Map.of("id", "events", "type", "subscribe", "payload", Map.of("query",
                    "subscription { chatEvents" + argument + " { kind message { content } typing { userId } } }")));
        }
        void barrier() throws Exception {
            send(Map.of("id", "barrier", "type", "subscribe", "payload", Map.of("query", "{ chats { id } }")));
            assertThat(next().path("id").asText()).isEqualTo("barrier");
            assertThat(next().path("type").asText()).isEqualTo("complete");
        }
        JsonNode next() throws Exception {
            JsonNode frame = frames.poll(5, TimeUnit.SECONDS);
            assertThat(frame).as("WebSocket response").isNotNull();
            return frame;
        }
        @Override public void close() { if (ws != null) ws.abort(); }
    }
}
