package com.matchme.backend.connection.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.matchme.backend.chat.model.Chat;
import com.matchme.backend.chat.repository.ChatRepository;
import com.matchme.backend.connection.model.Connection;
import com.matchme.backend.connection.model.ConnectionStatus;
import com.matchme.backend.connection.repository.ConnectionRepository;
import com.matchme.backend.user.model.User;
import com.matchme.backend.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ConnectionService {

    private final ConnectionRepository connectionRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatRepository chatRepository;

    @Transactional(readOnly = true)
    public List<Long> getConnectionIds(Long userId) {
        return connectionRepository.findAcceptedConnectionUserIds(userId);
    }

    @Transactional(readOnly = true)
    public List<Connection> getIncomingRequests(Long userId) {
        return connectionRepository.findByReceiverIdAndStatus(userId, ConnectionStatus.PENDING);
    }

    @Transactional(readOnly = true)
    public Connection getConnectionById(Long id, Long currentUserId) {
        Connection connection = connectionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Connection not found"));

        Long requesterId = connection.getRequester().getId();
        Long receiverId = connection.getReceiver().getId();

        if (!currentUserId.equals(requesterId) && !currentUserId.equals(receiverId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You do not have permission to view this connection");
        }

        return connection;
    }

    @Transactional
    public Connection requestConnection(Long requesterId, Long receiverId) {
        if (requesterId.equals(receiverId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You can't connect with yourself");
        }

        Optional<Connection> existing = connectionRepository.findBetweenUsers(requesterId, receiverId);
        if (existing.isPresent()) {
            Connection connection = existing.get();
            if (connection.getStatus() == ConnectionStatus.DISMISSED) {
                connection.setRequester(userRepository.getReferenceById(requesterId));
                connection.setReceiver(userRepository.getReferenceById(receiverId));
                connection.setStatus(ConnectionStatus.PENDING);
                return connectionRepository.save(connection);
            }
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Connection between users is already existed");
        }

        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        Connection connection = new Connection();
        connection.setRequester(requester);
        connection.setReceiver(receiver);
        connection.setStatus(ConnectionStatus.PENDING);

        Connection savedConnection = connectionRepository.save(connection);

        messagingTemplate.convertAndSend("/topic/connections." + receiverId,
                (Object) Map.of("type", "NEW_REQUEST", "connectionId", savedConnection.getId()));

        return savedConnection;
    }

    @Transactional
    public Connection dismissRecommendation(Long userId, Long targetId) {
        Optional<Connection> existing = connectionRepository.findBetweenUsers(userId, targetId);
        if (existing.isPresent()) {
            return existing.get();
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        User target = userRepository.findById(targetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        Connection connection = new Connection();
        connection.setRequester(user);
        connection.setReceiver(target);
        connection.setStatus(ConnectionStatus.DISMISSED);
        return connectionRepository.save(connection);
    }

    @Transactional
    public Connection respondToRequest(Long connectionId, Long respondingUserId, boolean accept) {
        Connection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (!connection.getReceiver().getId().equals(respondingUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only the recipient of the request can respond to it");
        }

        connection.setStatus(accept ? ConnectionStatus.ACCEPTED : ConnectionStatus.DECLINED);

        Connection savedConnection = connectionRepository.save(connection);

        if (accept) {
            messagingTemplate.convertAndSend("/topic/connections." + connection.getRequester().getId(),
                    (Object) Map.of("type", "REQUEST_ACCEPTED", "connectionId", savedConnection.getId()));
        }

        return savedConnection;
    }

    @Transactional
    public void disconnect(Long userId, Long otherUserId) {
        Connection connection = connectionRepository.findBetweenUsers(userId, otherUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (connection.getStatus() != ConnectionStatus.ACCEPTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Users aren't connected");
        }

        Optional<Chat> chat = chatRepository.findBetweenUsers(userId, otherUserId);
        Long chatId = null;
        if (chat.isPresent()) {
            chatId = chat.get().getId();
            chatRepository.deleteByChatId(chatId);
            chatRepository.delete(chat.get());
        }

        connectionRepository.delete(connection);

        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "DISCONNECTED");
        payload.put("connectionId", connection.getId());
        payload.put("partnerId", userId);
        if (chatId != null) {
            payload.put("chatId", chatId);
        }

        messagingTemplate.convertAndSend("/topic/connections." + otherUserId, (Object) payload);
    }
}
