package com.fleetza.suppliers.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fleetza.suppliers.dto.request.PushSubscriptionRequest;
import com.fleetza.suppliers.entity.PushSubscription;
import com.fleetza.suppliers.entity.User;
import com.fleetza.suppliers.enums.RoleName;
import com.fleetza.suppliers.repository.PushSubscriptionRepository;
import com.fleetza.suppliers.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import nl.martijndwars.webpush.Encoding;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Urgency;
import org.apache.http.HttpResponse;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.Security;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class WebPushService {

    private static final Logger logger = LoggerFactory.getLogger(WebPushService.class);

    @Value("${app.vapid.public-key:${VAPID_PUBLIC_KEY:}}")
    private String vapidPublicKey;

    @Value("${app.vapid.private-key:${VAPID_PRIVATE_KEY:}}")
    private String vapidPrivateKey;

    @Value("${app.vapid.subject:${VAPID_SUBJECT:mailto:admin@fleetza.in}}")
    private String vapidSubject;

    @Autowired
    private PushSubscriptionRepository pushSubscriptionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private PushService pushService;
    private boolean configured = false;
    private final ExecutorService pushExecutor = Executors.newFixedThreadPool(4);

    @PostConstruct
    public void init() {
        try {
            if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
                Security.addProvider(new BouncyCastleProvider());
            }
            if (vapidPublicKey != null && !vapidPublicKey.isBlank()
                    && vapidPrivateKey != null && !vapidPrivateKey.isBlank()) {
                String cleanSubject = (vapidSubject != null && !vapidSubject.isBlank())
                        ? vapidSubject.trim()
                        : "mailto:admin@fleetza.in";
                this.pushService = new PushService(vapidPublicKey.trim(), vapidPrivateKey.trim(), cleanSubject);
                this.configured = true;
                logger.info("Web Push (VAPID) initialized successfully for subject: {}", cleanSubject);
            } else {
                this.configured = false;
                logger.warn("Web Push (VAPID) keys not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in /etc/fleetza/supplier.env to enable background browser push notifications.");
            }
        } catch (Exception e) {
            this.configured = false;
            logger.error("Failed to initialize Web Push (VAPID) service: {}", e.getMessage());
        }
    }

    @PreDestroy
    public void shutdown() {
        pushExecutor.shutdownNow();
    }

    public boolean isConfigured() {
        return configured && pushService != null;
    }

    public String getPublicKey() {
        return isConfigured() ? vapidPublicKey.trim() : "";
    }

    @Transactional
    public PushSubscription subscribe(Long userId, PushSubscriptionRequest request) {
        String cleanEndpoint = request.getEndpoint().trim();
        String hash = sha256Hex(cleanEndpoint);

        PushSubscription sub = pushSubscriptionRepository.findByEndpointHash(hash)
                .orElseGet(PushSubscription::new);

        sub.setUserId(userId);
        sub.setEndpointHash(hash);
        sub.setEndpoint(cleanEndpoint);
        sub.setP256dh(request.getKeys().getP256dh().trim());
        sub.setAuth(request.getKeys().getAuth().trim());

        String ua = request.getUserAgent();
        if (ua != null) {
            ua = ua.trim();
            if (ua.length() > 500) {
                ua = ua.substring(0, 500);
            }
        }
        sub.setUserAgent(ua);

        return pushSubscriptionRepository.save(sub);
    }

    @Transactional
    public void unsubscribe(Long userId, String endpoint) {
        if (endpoint == null || endpoint.isBlank()) {
            return;
        }
        String hash = sha256Hex(endpoint.trim());
        pushSubscriptionRepository.findByEndpointHash(hash).ifPresent(sub -> {
            if (userId == null || Objects.equals(sub.getUserId(), userId)) {
                pushSubscriptionRepository.delete(sub);
            }
        });
    }

    @Transactional(readOnly = true)
    public long countUserSubscriptions(Long userId) {
        if (userId == null) return 0;
        return pushSubscriptionRepository.countByUserId(userId);
    }

    @Transactional(readOnly = true)
    public List<PushSubscription> getUserSubscriptions(Long userId) {
        if (userId == null) return List.of();
        return pushSubscriptionRepository.findByUserId(userId);
    }

    public void sendPushToUserAsync(Long userId, String title, String body, String url, String tag, Map<String, Object> extraData) {
        if (!isConfigured() || userId == null) {
            return;
        }
        List<PushSubscription> subs = pushSubscriptionRepository.findByUserId(userId);
        if (subs.isEmpty()) {
            return;
        }
        byte[] payloadBytes = buildPayloadBytes(title, body, url, tag, extraData);
        if (payloadBytes == null) return;

        pushExecutor.submit(() -> dispatchBatch(subs, payloadBytes));
    }

    public void sendPushToAdminsAsync(String title, String body, String url, String tag, Map<String, Object> extraData) {
        if (!isConfigured()) {
            return;
        }
        Set<Long> adminIds = new LinkedHashSet<>();
        for (User u : userRepository.findByRoles_NameOrderByFullNameAsc(RoleName.ROLE_ADMIN)) {
            adminIds.add(u.getId());
        }
        for (User u : userRepository.findByRoles_NameOrderByFullNameAsc(RoleName.ROLE_SUPER_ADMIN)) {
            adminIds.add(u.getId());
        }
        if (adminIds.isEmpty()) return;

        List<PushSubscription> subs = pushSubscriptionRepository.findByUserIdIn(adminIds);
        if (subs.isEmpty()) return;

        byte[] payloadBytes = buildPayloadBytes(title, body, url, tag, extraData);
        if (payloadBytes == null) return;

        pushExecutor.submit(() -> dispatchBatch(subs, payloadBytes));
    }

    public Map<String, Object> sendTestPushSync(Long userId, String recipientLabel) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("configured", isConfigured());

        List<PushSubscription> subs = pushSubscriptionRepository.findByUserId(userId);
        result.put("totalSubscriptions", subs.size());

        if (!isConfigured() || subs.isEmpty()) {
            result.put("sent", 0);
            result.put("failed", 0);
            result.put("removed", 0);
            return result;
        }

        Map<String, Object> extra = new HashMap<>();
        extra.put("type", "TEST_PUSH");
        extra.put("timestamp", System.currentTimeMillis());

        byte[] payloadBytes = buildPayloadBytes(
                "Fleetza Push Alerts Active",
                "Test alert for " + (recipientLabel != null ? recipientLabel : "your account") + ". Background VAPID push is working.",
                "/",
                "fleetza-test-push",
                extra
        );

        int[] counts = dispatchBatch(subs, payloadBytes);
        result.put("sent", counts[0]);
        result.put("failed", counts[1]);
        result.put("removed", counts[2]);
        return result;
    }

    private int[] dispatchBatch(List<PushSubscription> subscriptions, byte[] payloadBytes) {
        int sent = 0;
        int failed = 0;
        int removed = 0;

        for (PushSubscription sub : subscriptions) {
            try {
                Notification notification = Notification.builder()
                        .endpoint(sub.getEndpoint())
                        .userPublicKey(sub.getP256dh())
                        .userAuth(sub.getAuth())
                        .payload(payloadBytes)
                        .ttl(86400)
                        .urgency(Urgency.HIGH)
                        .build();

                HttpResponse response = pushService.send(notification, Encoding.AES128GCM);
                int statusCode = response.getStatusLine() != null ? response.getStatusLine().getStatusCode() : 0;

                if (statusCode >= 200 && statusCode < 300) {
                    sent++;
                } else if (statusCode == 404 || statusCode == 410) {
                    // Subscription expired or revoked in browser - clean it up automatically
                    pushSubscriptionRepository.deleteById(sub.getId());
                    removed++;
                    logger.info("Removed expired push subscription id={} status={}", sub.getId(), statusCode);
                } else {
                    failed++;
                    logger.warn("Web Push delivery returned HTTP {} for subscription id={}", statusCode, sub.getId());
                }
            } catch (Exception e) {
                failed++;
                logger.warn("Web Push delivery failed for subscription id={}: {}", sub.getId(), e.getMessage());
            }
        }
        return new int[]{sent, failed, removed};
    }

    private byte[] buildPayloadBytes(String title, String body, String url, String tag, Map<String, Object> extraData) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("title", title != null ? title : "Fleetza Notification");
            payload.put("body", body != null ? body : "You have a new update on Fleetza.");
            payload.put("url", url != null && !url.isBlank() ? url : "/");
            payload.put("tag", tag != null && !tag.isBlank() ? tag : "fleetza-alert");
            payload.put("icon", "/pwa-icon-192.png");
            payload.put("badge", "/pwa-icon-192.png");
            payload.put("requireInteraction", true);
            payload.put("vibrate", new int[]{300, 150, 300, 150, 400});
            payload.put("data", extraData != null ? extraData : Map.of());
            return objectMapper.writeValueAsString(payload).getBytes(StandardCharsets.UTF_8);
        } catch (Exception e) {
            logger.error("Failed to serialize Web Push payload: {}", e.getMessage());
            return null;
        }
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
