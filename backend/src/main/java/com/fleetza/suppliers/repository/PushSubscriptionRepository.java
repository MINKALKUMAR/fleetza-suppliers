package com.fleetza.suppliers.repository;

import com.fleetza.suppliers.entity.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {
    Optional<PushSubscription> findByEndpointHash(String endpointHash);
    List<PushSubscription> findByUserId(Long userId);
    List<PushSubscription> findByUserIdIn(Collection<Long> userIds);
    long countByUserId(Long userId);
    void deleteByEndpointHash(String endpointHash);
    void deleteByUserId(Long userId);
}

