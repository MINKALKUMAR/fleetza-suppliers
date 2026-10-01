package com.fleetza.suppliers.service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class FcmPushService {

    private static final Logger logger = LoggerFactory.getLogger(FcmPushService.class);

    /**
     * Send high-priority waking push notification to a supplier device via FCM
     */
    public boolean sendDutyDispatchPush(String fcmToken, String title, String body, Map<String, String> dataPayload) {
        if (fcmToken == null || fcmToken.isBlank()) {
            logger.debug("No FCM token found for supplier, skipping cloud push.");
            return false;
        }

        if (FirebaseApp.getApps().isEmpty()) {
            logger.warn("Firebase App is not initialized, cannot dispatch push message.");
            return false;
        }

        try {
            // Android-specific configuration with maximum priority & full wake intent
            AndroidConfig androidConfig = AndroidConfig.builder()
                    .setPriority(AndroidConfig.Priority.HIGH)
                    .setTtl(3600 * 1000) // 1 hour TTL
                    .setNotification(AndroidNotification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .setChannelId("fleetza_duty_channel")
                            .setPriority(AndroidNotification.Priority.MAX)
                            .setDefaultVibrateTimings(true)
                            .setDefaultSound(true)
                            .setSound("default")
                            .build())
                    .build();

            Message.Builder messageBuilder = Message.builder()
                    .setToken(fcmToken)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .setAndroidConfig(androidConfig);

            if (dataPayload != null && !dataPayload.isEmpty()) {
                messageBuilder.putAllData(dataPayload);
            }

            String response = FirebaseMessaging.getInstance().send(messageBuilder.build());
            logger.info("Successfully sent FCM duty push to token: {}, messageId: {}", fcmToken.substring(0, Math.min(10, fcmToken.length())) + "...", response);
            return true;
        } catch (Exception e) {
            logger.error("Failed to send FCM push notification: {}", e.getMessage());
            return false;
        }
    }
}
