package com.fleetza.suppliers.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        boolean firebaseActive = !com.google.firebase.FirebaseApp.getApps().isEmpty();
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "fleetza-suppliers-backend",
                "firebasePushActive", firebaseActive,
                "timestamp", LocalDateTime.now().toString()
        ));
    }
}
