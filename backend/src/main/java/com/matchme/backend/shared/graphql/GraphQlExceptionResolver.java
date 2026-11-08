package com.matchme.backend.shared.graphql;

import graphql.GraphQLError;
import graphql.GraphqlErrorBuilder;
import graphql.schema.DataFetchingEnvironment;
import org.springframework.graphql.execution.DataFetcherExceptionResolverAdapter;
import org.springframework.graphql.execution.ErrorType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.graphql.execution.SubscriptionExceptionResolver;
import java.util.List;
import reactor.core.publisher.Mono;

@Component
public class GraphQlExceptionResolver extends DataFetcherExceptionResolverAdapter implements SubscriptionExceptionResolver {
    @Override
    protected GraphQLError resolveToSingleError(Throwable exception, DataFetchingEnvironment environment) {
        if (exception instanceof ResponseStatusException status) {
            ErrorType type = errorType(status);
            return GraphqlErrorBuilder.newError(environment).errorType(type)
                    .message(type == ErrorType.INTERNAL_ERROR ? "Internal error" :
                            status.getReason() == null ? type.name() : status.getReason()).build();
        }
        // Unexpected exceptions keep Spring's sanitized INTERNAL_ERROR response and server-side logging.
        return null;
    }

    @Override
    public Mono<List<GraphQLError>> resolveException(Throwable exception) {
        if (exception instanceof ResponseStatusException status) {
            ErrorType type = errorType(status);
            return Mono.just(List.of(GraphqlErrorBuilder.newError().errorType(type)
                    .message(type == ErrorType.INTERNAL_ERROR || status.getReason() == null
                            ? type.name() : status.getReason()).build()));
        }
        return Mono.empty();
    }

    private ErrorType errorType(ResponseStatusException status) {
        return switch (status.getStatusCode().value()) {
            case 400 -> ErrorType.BAD_REQUEST;
            case 401 -> ErrorType.UNAUTHORIZED;
            case 403 -> ErrorType.FORBIDDEN;
            case 404 -> ErrorType.NOT_FOUND;
            default -> ErrorType.INTERNAL_ERROR;
        };
    }
}
