package com.fleetza.suppliers.controller;

import com.fleetza.suppliers.dto.request.ChangePasswordRequest;
import com.fleetza.suppliers.dto.request.CreateSupplierRequest;
import com.fleetza.suppliers.dto.request.LoginRequest;
import com.fleetza.suppliers.dto.response.ApiResponse;
import com.fleetza.suppliers.dto.response.JwtAuthResponse;
import com.fleetza.suppliers.dto.response.UserSummaryResponse;
import com.fleetza.suppliers.security.UserPrincipal;
import com.fleetza.suppliers.service.AuthService;
import com.fleetza.suppliers.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<JwtAuthResponse>> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        JwtAuthResponse response = authService.authenticateUser(loginRequest);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(currentUser, request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        UserSummaryResponse response = userService.getCurrentUserProfile(currentUser);
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logoutUser(@AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser != null) {
            authService.logoutUser(currentUser.getId());
        }
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully"));
    }
}
