package com.fleetza.suppliers.controller;

import com.fleetza.suppliers.dto.request.CreateSupplierRequest;
import com.fleetza.suppliers.dto.request.UpdateSupplierRequest;
import com.fleetza.suppliers.dto.response.ApiResponse;
import com.fleetza.suppliers.dto.response.UserSummaryResponse;
import com.fleetza.suppliers.enums.UserStatus;
import com.fleetza.suppliers.security.UserPrincipal;
import com.fleetza.suppliers.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
public class SupplierController {

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserSummaryResponse>>> getSuppliers(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        boolean isAdminOrDispatcher = currentUser != null && currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")
                        || a.getAuthority().equals("ROLE_SUPER_ADMIN")
                        || a.getAuthority().equals("ROLE_DISPATCHER"));
        if (isAdminOrDispatcher) {
            return ResponseEntity.ok(ApiResponse.success("Suppliers retrieved successfully", userService.getSuppliers()));
        }
        if (currentUser == null) {
            return ResponseEntity.ok(ApiResponse.success("Suppliers retrieved successfully", List.of()));
        }
        return ResponseEntity.ok(ApiResponse.success(
                "Supplier profile retrieved successfully",
                List.of(userService.getCurrentUserProfile(currentUser))
        ));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> createSupplier(
            @Valid @RequestBody CreateSupplierRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Supplier account created successfully", userService.createSupplier(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> updateSupplier(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSupplierRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Supplier details updated successfully", userService.updateSupplier(id, request)));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> setSupplierStatus(
            @PathVariable Long id,
            @RequestParam UserStatus status) {
        return ResponseEntity.ok(ApiResponse.success("Supplier status updated", userService.setSupplierStatus(id, status)));
    }

    @PatchMapping("/{id}/reset-password")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> resetSupplierPassword(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body) {
        String newPassword = body != null ? body.get("newPassword") : null;
        userService.resetSupplierPassword(id, newPassword);
        return ResponseEntity.ok(ApiResponse.success("Supplier password reset successfully"));
    }

    @PatchMapping("/{id}/toggle-online")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> toggleOnlineStatus(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Supplier online status toggled", userService.toggleOnlineStatus(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteSupplier(@PathVariable Long id) {
        userService.deleteSupplier(id);
        return ResponseEntity.ok(ApiResponse.success("Supplier removed successfully"));
    }
}
