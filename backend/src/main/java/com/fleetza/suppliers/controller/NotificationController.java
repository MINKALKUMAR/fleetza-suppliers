package com.fleetza.suppliers.controller;

import com.fleetza.suppliers.dto.response.ApiResponse;
import com.fleetza.suppliers.entity.Notification;
import com.fleetza.suppliers.security.UserPrincipal;
import com.fleetza.suppliers.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    private boolean isAdminOrDispatcher(UserPrincipal currentUser) {
        return currentUser != null && currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")
                        || a.getAuthority().equals("ROLE_SUPER_ADMIN")
                        || a.getAuthority().equals("ROLE_DISPATCHER"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Notification>>> getNotifications(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) String recipientId) {

        boolean isAdmin = isAdminOrDispatcher(currentUser);
        String targetId = isAdmin ? recipientId : null;
        if (targetId == null && currentUser != null) {
            targetId = currentUser.getId().toString();
        }

        List<Notification> result = new ArrayList<>();
        if (targetId != null) {
            result.addAll(notificationService.getNotifications(targetId));
        }

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
    public ResponseEntity<ApiResponse<Notification>> markAsRead(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {

        Notification existing = notificationService.findById(id);
        boolean isAdmin = isAdminOrDispatcher(currentUser);
        boolean isOwner = currentUser != null && Objects.equals(existing.getRecipientId(), currentUser.getId().toString());
        if (!isAdmin && !isOwner) {
            throw new AccessDeniedException("You can only mark your own notifications as read");
        }

        Notification notification = notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", notification));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) String recipientId) {

        boolean isAdmin = isAdminOrDispatcher(currentUser);
        String targetId = isAdmin ? recipientId : null;
        if (targetId == null && currentUser != null) {
            targetId = currentUser.getId().toString();
        }

        if (targetId != null) {
            notificationService.markAllAsRead(targetId);
        }

        if (isAdmin) {
            notificationService.markAllAsRead("admin-1");
        }

        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read"));
    }
}
