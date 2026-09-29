package com.fleetza.suppliers.controller;

import com.fleetza.suppliers.dto.request.CreateBookingRequest;
import com.fleetza.suppliers.dto.response.ApiResponse;
import com.fleetza.suppliers.entity.BookingRequest;
import com.fleetza.suppliers.security.UserPrincipal;
import com.fleetza.suppliers.service.BookingRequestService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingRequestController {

    @Autowired
    private BookingRequestService bookingRequestService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BookingRequest>>> getBookingRequests(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) Long supplierId) {

        boolean isSupplierOnly = currentUser != null && currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPPLIER")) &&
                currentUser.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        Long targetSupplierId = supplierId;
        if (isSupplierOnly && targetSupplierId == null) {
            targetSupplierId = currentUser.getId();
        }

        List<BookingRequest> requests = bookingRequestService.getBookingRequests(targetSupplierId);
        return ResponseEntity.ok(ApiResponse.success("Booking requests retrieved successfully", requests));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BookingRequest>> createBookingRequest(
            @Valid @RequestBody CreateBookingRequest request) {

        BookingRequest booking = bookingRequestService.createBookingRequest(request);
        return ResponseEntity.ok(ApiResponse.success("Booking request created and dispatched", booking));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<BookingRequest>> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        BookingRequest booking = bookingRequestService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Booking status updated", booking));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<BookingRequest>> completeDuty(@PathVariable Long id) {
        BookingRequest booking = bookingRequestService.completeDuty(id);
        return ResponseEntity.ok(ApiResponse.success("Duty marked as completed", booking));
    }
}
