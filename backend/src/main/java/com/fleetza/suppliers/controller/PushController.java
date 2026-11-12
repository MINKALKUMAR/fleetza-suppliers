package com.fleetza.suppliers.controller;

import com.fleetza.suppliers.dto.request.PushSubscriptionRequest;
import com.fleetza.suppliers.dto.response.ApiResponse;
import com.fleetza.suppliers.entity.PushSubscription;
import com.fleetza.suppliers.security.UserPrincipal;
import com.fleetza.suppliers.service.WebPushService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/push")
public class PushController {

    @Autowired
    private WebPushService webPushService;

    @GetMapping("/vapid-public-key")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getVapidPublicKey() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("configured", webPushService.isConfigured());
        data.put("publicKey", webPushService.getPublicKey());
        return ResponseEntity.ok(ApiResponse.success("VAPID configuration retrieved", data));
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPushStatus(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<PushSubscription> subs = currentUser != null
                ? webPushService.getUserSubscriptions(currentUser.getId())
                : List.of();

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("configured", webPushService.isConfigured());
        data.put("publicKey", webPushService.getPublicKey());
        data.put("subscribedDevices", subs.size());
        return ResponseEntity.ok(ApiResponse.success("Push status retrieved", data));
    }

    @PostMapping("/subscribe")
    public ResponseEntity<ApiResponse<Map<String, Object>>> subscribe(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody PushSubscriptionRequest request) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        PushSubscription saved = webPushService.subscribe(currentUser.getId(), request);
        long totalDevices = webPushService.countUserSubscriptions(currentUser.getId());

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("subscriptionId", saved.getId());
        data.put("subscribedDevices", totalDevices);
        data.put("configured", webPushService.isConfigured());
        return ResponseEntity.ok(ApiResponse.success("Browser subscribed for Web Push notifications", data));
    }

    @PostMapping("/unsubscribe")
    public ResponseEntity<ApiResponse<Void>> unsubscribe(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody Map<String, String> body) {
        if (currentUser != null && body != null && body.get("endpoint") != null) {
            webPushService.unsubscribe(currentUser.getId(), body.get("endpoint"));
        }
        return ResponseEntity.ok(ApiResponse.success("Browser unsubscribed from Web Push notifications"));
    }

    @PostMapping("/test")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendTestPush(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        Map<String, Object> result = webPushService.sendTestPushSync(
                currentUser.getId(),
                currentUser.getFullName() != null ? currentUser.getFullName() : currentUser.getUsername()
        );
        return ResponseEntity.ok(ApiResponse.success("Test push processed", result));
    }
}

