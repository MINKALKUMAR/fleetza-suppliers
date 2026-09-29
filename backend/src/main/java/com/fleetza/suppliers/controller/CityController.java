package com.fleetza.suppliers.controller;

import com.fleetza.suppliers.dto.response.ApiResponse;
import com.fleetza.suppliers.entity.City;
import com.fleetza.suppliers.exception.BadRequestException;
import com.fleetza.suppliers.exception.ResourceNotFoundException;
import com.fleetza.suppliers.repository.CityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cities")
public class CityController {

    @Autowired
    private CityRepository cityRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<City>>> getCities() {
        List<City> cities = cityRepository.findByActiveTrueOrderByNameAsc();
        return ResponseEntity.ok(ApiResponse.success("Cities retrieved", cities));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<City>> addCity(@RequestBody Map<String, String> body) {
        String name = body != null ? body.get("name") : null;
        if (name == null || name.trim().length() < 2) {
            throw new BadRequestException("City name must be at least 2 characters long");
        }
        String cleanName = name.trim();
        if (cityRepository.existsByNameIgnoreCase(cleanName)) {
            throw new BadRequestException("City already exists");
        }
        City city = cityRepository.save(new City(cleanName));
        return ResponseEntity.ok(ApiResponse.success("City added successfully", city));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCity(@PathVariable Long id) {
        City city = cityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("City", "id", id));
        cityRepository.delete(city);
        return ResponseEntity.ok(ApiResponse.success("City removed successfully"));
    }
}
