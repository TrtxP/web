package com.matchme.backend.services;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
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

    public ConnectionService(ConnectionRepository connectionRepository, UserRepository userRepository) {
        this.connectionRepository = connectionRepository;
        this.userRepository = userRepository;
    }

    // GET /connections — лише id прийнятих з'єднань
    public List<Long> getConnectionIds(Long userId) {
        return connectionRepository.findAcceptedConnectionUserIds(userId);
    }

    public List<Connection> getIncomingRequests(Long userId) {
        return connectionRepository.findByReceiverIdAndStatus(userId, ConnectionStatus.PENDING);
    }

    public Connection requestConnection(Long requesterId, Long receiverId) {
        if (requesterId.equals(receiverId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Не можна з'єднатись із самим собою");
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
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Зв'язок між користувачами вже існує");
        }

        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        Connection connection = new Connection();
        connection.setRequester(requester);
        connection.setReceiver(receiver);
        connection.setStatus(ConnectionStatus.PENDING);
        return connectionRepository.save(connection);
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
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Тільки отримувач запиту може відповісти на нього");
        }

        connection.setStatus(accept ? ConnectionStatus.ACCEPTED : ConnectionStatus.DECLINED);
        return connectionRepository.save(connection);
    }

    public void disconnect(Long userId, Long otherUserId) {
        Connection connection = connectionRepository.findBetweenUsers(userId, otherUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (connection.getStatus() != ConnectionStatus.ACCEPTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Користувачі не з'єднані");
        }

        connectionRepository.delete(connection);
    }
}