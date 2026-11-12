package com.fleetza.suppliers.controller;

import com.fleetza.suppliers.dto.request.CreateBookingRequest;
import com.fleetza.suppliers.dto.response.ApiResponse;
import com.fleetza.suppliers.entity.BookingRequest;
import com.fleetza.suppliers.security.UserPrincipal;
import com.fleetza.suppliers.service.BookingRequestService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/bookings")
public class BookingRequestController {

    @Autowired
    private BookingRequestService bookingRequestService;

    private boolean isAdminOrDispatcher(UserPrincipal currentUser) {
        return currentUser != null && currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")
                        || a.getAuthority().equals("ROLE_SUPER_ADMIN")
                        || a.getAuthority().equals("ROLE_DISPATCHER"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BookingRequest>>> getBookingRequests(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) Long supplierId) {

        Long targetSupplierId = supplierId;
        if (!isAdminOrDispatcher(currentUser)) {
            targetSupplierId = currentUser != null ? currentUser.getId() : -1L;
        }

        List<BookingRequest> requests = bookingRequestService.getBookingRequests(targetSupplierId);
        return ResponseEntity.ok(ApiResponse.success("Booking requests retrieved successfully", requests));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'DISPATCHER')")
    public ResponseEntity<ApiResponse<BookingRequest>> createBookingRequest(
            @Valid @RequestBody CreateBookingRequest request) {

        BookingRequest booking = bookingRequestService.createBookingRequest(request);
        return ResponseEntity.ok(ApiResponse.success("Booking request created and dispatched", booking));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<BookingRequest>> updateStatus(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id,
            @RequestParam String status) {

        BookingRequest existing = bookingRequestService.findById(id);
        if (!isAdminOrDispatcher(currentUser)
                && (currentUser == null || !Objects.equals(existing.getSupplierId(), currentUser.getId()))) {
            throw new AccessDeniedException("You can only update bookings assigned to your account");
        }

        BookingRequest booking = bookingRequestService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Booking status updated", booking));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<BookingRequest>> completeDuty(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {

        BookingRequest existing = bookingRequestService.findById(id);
        if (!isAdminOrDispatcher(currentUser)
                && (currentUser == null || !Objects.equals(existing.getSupplierId(), currentUser.getId()))) {
            throw new AccessDeniedException("You can only complete duties assigned to your account");
        }

        BookingRequest booking = bookingRequestService.completeDuty(id);
        return ResponseEntity.ok(ApiResponse.success("Duty marked as completed", booking));
    }
}
