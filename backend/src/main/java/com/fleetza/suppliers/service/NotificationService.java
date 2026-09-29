package com.fleetza.suppliers.service;

import com.fleetza.suppliers.entity.Notification;
import com.fleetza.suppliers.exception.ResourceNotFoundException;
import com.fleetza.suppliers.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public List<Notification> getNotifications(String recipientId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId);
    }

    @Transactional
    public Notification createNotification(String recipientId, String type, String title, String message, Long requestId) {
        Notification notification = new Notification(recipientId, type, title, message, requestId);
        return notificationRepository.save(notification);
    }

    @Transactional
    public Notification markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id));
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(String recipientId) {
        List<Notification> list = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId);
        for (Notification n : list) {
            n.setRead(true);
        }
        notificationRepository.saveAll(list);
    }

    @Transactional
    public void deleteByRequestId(Long requestId) {
        notificationRepository.deleteByRequestId(requestId);
    }
}
