package com.matchme.backend.services;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.matchme.backend.models.Connection;
import com.matchme.backend.models.ConnectionStatus;
import com.matchme.backend.models.User;
import com.matchme.backend.repositories.ConnectionRepository;
import com.matchme.backend.repositories.UserRepository;

@Service
public class ConnectionService {

    private final ConnectionRepository connectionRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public ConnectionService(ConnectionRepository connectionRepository, UserRepository userRepository,
            SimpMessagingTemplate messagingTemplate) {
        this.connectionRepository = connectionRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    // GET /connections — лише id прийнятих з'єднань
    public List<Long> getConnectionIds(Long userId) {
        return connectionRepository.findAcceptedConnectionUserIds(userId);
    }

    public List<Connection> getIncomingRequests(Long userId) {
        return connectionRepository.findByReceiverIdAndStatus(userId, ConnectionStatus.PENDING);
    }

    public Connection getConnectionById(Long id, Long currentUserId) {
        // 1. Шукаємо з'єднання в БД
        Connection connection = connectionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Connection not found"));

        // 2. Витягуємо ID учасників з'єднання (підстав свої методи/поля сутності)
        Long requesterId = connection.getRequester().getId();
        Long receiverId = connection.getReceiver().getId();

        // 3. Перевіряємо, чи поточний юзер є учасником цього зв'язку
        if (!currentUserId.equals(requesterId) && !currentUserId.equals(receiverId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You do not have permission to view this connection");
        }

        return connection;
    }

    public Connection requestConnection(Long requesterId, Long receiverId) {
        if (requesterId.equals(receiverId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You can't connect with yourself");
        }

        Optional<Connection> existing = connectionRepository.findBetweenUsers(requesterId, receiverId);
        if (existing.isPresent()) {
            Connection connection = existing.get();
            if (connection.getStatus() == ConnectionStatus.DISMISSED) {
                // дозволяємо надіслати справжній запит навіть якщо раніше проігнорували
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

    public void disconnect(Long userId, Long otherUserId) {
        Connection connection = connectionRepository.findBetweenUsers(userId, otherUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (connection.getStatus() != ConnectionStatus.ACCEPTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Users aren't connected");
        }

        connectionRepository.delete(connection);
    }
}