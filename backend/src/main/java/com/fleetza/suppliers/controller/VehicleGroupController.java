package com.fleetza.suppliers.controller;

import com.fleetza.suppliers.dto.response.ApiResponse;
import com.fleetza.suppliers.entity.VehicleGroup;
import com.fleetza.suppliers.exception.BadRequestException;
import com.fleetza.suppliers.exception.ResourceNotFoundException;
import com.fleetza.suppliers.repository.VehicleGroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vehicle-groups")
public class VehicleGroupController {

    @Autowired
    private VehicleGroupRepository vehicleGroupRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<VehicleGroup>>> getVehicleGroups() {
        List<VehicleGroup> groups = vehicleGroupRepository.findByActiveTrueOrderByNameAsc();
        return ResponseEntity.ok(ApiResponse.success("Vehicle groups retrieved", groups));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<VehicleGroup>> addVehicleGroup(@RequestBody Map<String, String> body) {
        String name = body != null ? body.get("name") : null;
        if (name == null || name.trim().length() < 2) {
            throw new BadRequestException("Vehicle group name must be at least 2 characters long");
        }
        String cleanName = name.trim();
        if (vehicleGroupRepository.existsByNameIgnoreCase(cleanName)) {
            throw new BadRequestException("Vehicle group already exists");
        }
        VehicleGroup group = vehicleGroupRepository.save(new VehicleGroup(cleanName));
        return ResponseEntity.ok(ApiResponse.success("Vehicle group added successfully", group));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteVehicleGroup(@PathVariable Long id) {
        VehicleGroup group = vehicleGroupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("VehicleGroup", "id", id));
        vehicleGroupRepository.delete(group);
        return ResponseEntity.ok(ApiResponse.success("Vehicle group removed successfully"));
    }
}
