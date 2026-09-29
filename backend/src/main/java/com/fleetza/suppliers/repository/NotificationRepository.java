package com.fleetza.suppliers.repository;

import com.fleetza.suppliers.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientIdOrderByCreatedAtDesc(String recipientId);

    void deleteByRecipientId(String recipientId);

    void deleteByRequestId(Long requestId);
}
