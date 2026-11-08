package com.matchme.backend.chat;

import com.matchme.backend.chat.service.ChatAccessService;
import com.matchme.backend.shared.security.JwtChannelInterceptor;
import com.matchme.backend.shared.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class ChatStompSecurityTests {
    private final ChatAccessService access = mock(ChatAccessService.class);
    private final JwtChannelInterceptor interceptor = new JwtChannelInterceptor(mock(JwtService.class), access);

    @Test
    void legacyChatTopicsUseTheSameMembershipPolicy() {
        when(access.requireParticipant(42L, 7L)).thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN));
        for (String destination : new String[] { "/topic/chat.42", "/topic/chat.42.read", "/topic/chat.42.typing" }) {
            var headers = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
            headers.setUser(new JwtChannelInterceptor.StompPrincipal("7"));
            headers.setDestination(destination);
            var message = MessageBuilder.createMessage(new byte[0], headers.getMessageHeaders());
            assertThatThrownBy(() -> interceptor.preSend(message, mock(MessageChannel.class)))
                    .isInstanceOf(ResponseStatusException.class);
        }
    }

    @Test
    void clientsCannotPublishDirectlyToBrokerTopics() {
        var headers = StompHeaderAccessor.create(StompCommand.SEND);
        headers.setUser(new JwtChannelInterceptor.StompPrincipal("7"));
        headers.setDestination("/topic/chat.42");
        var message = MessageBuilder.createMessage(new byte[0], headers.getMessageHeaders());
        assertThatThrownBy(() -> interceptor.preSend(message, mock(MessageChannel.class)))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
