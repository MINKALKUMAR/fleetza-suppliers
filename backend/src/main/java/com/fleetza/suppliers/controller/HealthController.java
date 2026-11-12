package com.fleetza.suppliers.controller;

import com.fleetza.suppliers.service.WebPushService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    @Autowired
    private WebPushService webPushService;

    @Autowired
    private DataSource dataSource;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        boolean databaseUp = false;
        try (Connection conn = dataSource.getConnection()) {
            databaseUp = conn.isValid(2);
        } catch (Exception ignored) {
            databaseUp = false;
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", databaseUp ? "UP" : "DEGRADED");
        body.put("database", databaseUp ? "UP" : "DOWN");
        body.put("service", "fleetza-suppliers-backend");
        body.put("webPushVapidConfigured", webPushService.isConfigured());
        body.put("timestamp", LocalDateTime.now().toString());

        return databaseUp
                ? ResponseEntity.ok(body)
                : ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(body);
    }
}
