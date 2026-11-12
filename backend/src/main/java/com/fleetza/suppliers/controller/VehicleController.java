package com.fleetza.suppliers.controller;

import com.fleetza.suppliers.dto.request.VehicleRequest;
import com.fleetza.suppliers.dto.response.ApiResponse;
import com.fleetza.suppliers.entity.Vehicle;
import com.fleetza.suppliers.security.UserPrincipal;
import com.fleetza.suppliers.service.VehicleService;
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
@RequestMapping("/api/vehicles")
public class VehicleController {

    @Autowired
    private VehicleService vehicleService;

    private boolean isAdminOrDispatcher(UserPrincipal currentUser) {
        return currentUser != null && currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")
                        || a.getAuthority().equals("ROLE_SUPER_ADMIN")
                        || a.getAuthority().equals("ROLE_DISPATCHER"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Vehicle>>> getVehicles(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) Long supplierId) {

        Long targetSupplierId = supplierId;
        if (!isAdminOrDispatcher(currentUser)) {
            targetSupplierId = currentUser != null ? currentUser.getId() : -1L;
        }

        List<Vehicle> vehicles = vehicleService.getVehicles(targetSupplierId);
        return ResponseEntity.ok(ApiResponse.success("Vehicles retrieved successfully", vehicles));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Vehicle>> createVehicle(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody VehicleRequest request) {

        Long authSupplierId = currentUser != null ? currentUser.getId() : null;
        boolean isAdmin = currentUser != null && currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (!isAdmin) {
            request.setSupplierId(authSupplierId);
        }

        Vehicle vehicle = vehicleService.createVehicle(request, authSupplierId, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Vehicle registered successfully", vehicle));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Vehicle>> updateVehicle(
            @PathVariable Long id,
            @Valid @RequestBody VehicleRequest request) {

        Vehicle vehicle = vehicleService.updateVehicle(id, request);
        return ResponseEntity.ok(ApiResponse.success("Vehicle updated successfully", vehicle));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Vehicle>> updateStatus(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id,
            @RequestParam String status) {

        Vehicle existing = vehicleService.findById(id);
        if (!isAdminOrDispatcher(currentUser)
                && (currentUser == null || !Objects.equals(existing.getSupplierId(), currentUser.getId()))) {
            throw new AccessDeniedException("You can only update vehicles registered to your account");
        }

        Vehicle vehicle = vehicleService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Vehicle status updated", vehicle));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteVehicle(@PathVariable Long id) {
        vehicleService.deleteVehicle(id);
        return ResponseEntity.ok(ApiResponse.success("Vehicle deleted successfully"));
    }
}
