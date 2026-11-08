package com.matchme.backend.shared.graphql;

import java.util.Map;
import com.matchme.backend.shared.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.server.WebGraphQlRequest;
import org.springframework.graphql.server.WebGraphQlResponse;
import org.springframework.graphql.server.WebSocketGraphQlInterceptor;
import org.springframework.graphql.server.WebSocketGraphQlRequest;
import org.springframework.graphql.server.WebSocketSessionInfo;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/** Authenticates both transports without relying on thread-local state in reactive callbacks. */
@Component
@RequiredArgsConstructor
public class GraphQlAuthenticationInterceptor implements WebSocketGraphQlInterceptor {
    private static final String SESSION_TOKEN = GraphQlAuthenticationInterceptor.class.getName() + ".token";
    private final JwtService jwtService;

    @Override
    public Mono<Object> handleConnectionInitialization(WebSocketSessionInfo session, Map<String, Object> payload) {
        return Mono.defer(() -> {
            String token = bearerToken(payload.get(HttpHeaders.AUTHORIZATION));
            requireUserId(token);
            session.getAttributes().put(SESSION_TOKEN, token);
            return Mono.empty();
        });
    }

    @Override
    public Mono<WebGraphQlResponse> intercept(WebGraphQlRequest request, Chain chain) {
        return Mono.defer(() -> {
            String token = request instanceof WebSocketGraphQlRequest socketRequest
                    ? (String) socketRequest.getSessionInfo().getAttributes().get(SESSION_TOKEN)
                    : bearerToken(request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION));
            Long userId = requireUserId(token);
            request.configureExecutionInput((input, builder) -> builder
                    .graphQLContext(Map.of("userId", userId, "token", token)).build());
            return chain.next(request);
        });
    }

    private String bearerToken(Object value) {
        if (!(value instanceof String header) || !header.startsWith("Bearer ")) {
            throw new BadCredentialsException("Bearer token required");
        }
        return header.substring(7);
    }

    private Long requireUserId(String token) {
        if (token == null || token.isBlank()) {
            throw new BadCredentialsException("Bearer token required");
        }
        return jwtService.extractUserId(token)
                .orElseThrow(() -> new BadCredentialsException("Invalid or expired token"));
    }
}
