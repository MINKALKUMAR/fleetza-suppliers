package com.fleetza.suppliers.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);

    @PostConstruct
    public void initialize() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                String envCredentials = System.getenv("FIREBASE_CREDENTIALS_JSON");
                InputStream serviceAccount = null;

                if (envCredentials != null && !envCredentials.isBlank()) {
                    serviceAccount = new java.io.ByteArrayInputStream(envCredentials.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                } else {
                    ClassPathResource resource = new ClassPathResource("firebase-service-account.json");
                    if (resource.exists()) {
                        serviceAccount = resource.getInputStream();
                    }
                }

                if (serviceAccount != null) {
                    try (serviceAccount) {
                        FirebaseOptions options = FirebaseOptions.builder()
                                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                                .build();
                        FirebaseApp.initializeApp(options);
                        logger.info("Firebase Application successfully initialized for FCM push alerts.");
                    }
                } else {
                    logger.warn("Firebase credentials not found (neither FIREBASE_CREDENTIALS_JSON nor firebase-service-account.json). Push alerts disabled.");
                }
            }
        } catch (Exception e) {
            logger.error("Failed to initialize Firebase Admin SDK: {}", e.getMessage());
        }
    }
}
