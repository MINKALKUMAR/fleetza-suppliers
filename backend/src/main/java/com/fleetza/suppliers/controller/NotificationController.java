package com.fleetza.suppliers.controller;

import com.fleetza.suppliers.dto.response.ApiResponse;
import com.fleetza.suppliers.entity.Notification;
import com.fleetza.suppliers.security.UserPrincipal;
import com.fleetza.suppliers.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Notification>>> getNotifications(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) String recipientId) {

        String targetId = recipientId;
        if (targetId == null && currentUser != null) {
            targetId = currentUser.getId().toString();
        }

        List<Notification> result = new ArrayList<>();
        if (targetId != null) {
            result.addAll(notificationService.getNotifications(targetId));
        }

        // If the user is admin, also include notifications directed to 'admin-1' or 'admin'
        boolean isAdmin = currentUser != null && currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin && !"admin-1".equals(targetId)) {
            for (Notification n : notificationService.getNotifications("admin-1")) {
                if (result.stream().noneMatch(existing -> existing.getId().equals(n.getId()))) {
                    result.add(n);
                }
            }
        }

        result.sort(Comparator.comparing(Notification::getCreatedAt).reversed());
        return ResponseEntity.ok(ApiResponse.success("Notifications retrieved successfully", result));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Notification>> markAsRead(@PathVariable Long id) {
        Notification notification = notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", notification));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) String recipientId) {

        String targetId = recipientId;
        if (targetId == null && currentUser != null) {
            targetId = currentUser.getId().toString();
        }

        if (targetId != null) {
            notificationService.markAllAsRead(targetId);
        }

        boolean isAdmin = currentUser != null && currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) {
            notificationService.markAllAsRead("admin-1");
        }

        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read"));
    }
}
