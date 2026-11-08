package com.matchme.backend.shared.graphql;

import graphql.analysis.MaxQueryComplexityInstrumentation;
import graphql.analysis.MaxQueryDepthInstrumentation;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class GraphQlConfiguration {
    @Bean
    MaxQueryDepthInstrumentation maxQueryDepth() {
        return new MaxQueryDepthInstrumentation(12);
    }

    @Bean
    MaxQueryComplexityInstrumentation maxQueryComplexity() {
        return new MaxQueryComplexityInstrumentation(200);
    }
}
