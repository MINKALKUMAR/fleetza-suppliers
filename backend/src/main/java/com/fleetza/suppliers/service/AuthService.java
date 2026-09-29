package com.fleetza.suppliers.service;

import com.fleetza.suppliers.dto.request.LoginRequest;
import com.fleetza.suppliers.dto.response.JwtAuthResponse;
import com.fleetza.suppliers.security.JwtTokenProvider;
import com.fleetza.suppliers.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.fleetza.suppliers.entity.User;
import com.fleetza.suppliers.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserRepository userRepository;

    public JwtAuthResponse authenticateUser(LoginRequest loginRequest) {
        String rawUsername = loginRequest.getUsername() != null ? loginRequest.getUsername().trim() : "";
        String rawPassword = loginRequest.getPassword() != null ? loginRequest.getPassword() : "";

        // Resolve canonical username from DB
        User existingUser = userRepository.findByUsernameIgnoreCase(rawUsername)
                .orElse(null);
        String usernameToAuth = existingUser != null ? existingUser.getUsername() : rawUsername;

        // Convenient password aliases for demo / testing accounts
        String passwordToAuth = rawPassword;
        if ("admin".equalsIgnoreCase(rawUsername)) {
            if ("admin".equalsIgnoreCase(rawPassword) ||
                "admin123".equalsIgnoreCase(rawPassword) ||
                "admin@123".equalsIgnoreCase(rawPassword) ||
                "Admin@123".equalsIgnoreCase(rawPassword) ||
                "admin@12345".equalsIgnoreCase(rawPassword)) {
                passwordToAuth = "Admin@12345";
            }
        } else if ("supplier_demo".equalsIgnoreCase(rawUsername) ||
                   "ludhiana_fleet".equalsIgnoreCase(rawUsername) ||
                   "amritsar_cabs".equalsIgnoreCase(rawUsername)) {
            if ("supplier".equalsIgnoreCase(rawPassword) ||
                "supplier123".equalsIgnoreCase(rawPassword) ||
                "Supplier@123".equalsIgnoreCase(rawPassword) ||
                "supplier@123".equalsIgnoreCase(rawPassword) ||
                "supplier@12345".equalsIgnoreCase(rawPassword)) {
                passwordToAuth = "Supplier@12345";
            }
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        usernameToAuth,
                        passwordToAuth
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        List<String> roles = userPrincipal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        userRepository.findById(userPrincipal.getId()).ifPresent(u -> {
            u.setLastLoginAt(LocalDateTime.now());
            u.setLastActiveAt(LocalDateTime.now());
            u.setIsOnline(true);
            userRepository.save(u);
        });

        return new JwtAuthResponse(
                jwt,
                userPrincipal.getId(),
                userPrincipal.getUsername(),
                userPrincipal.getFullName(),
                userPrincipal.getCompanyName(),
                userPrincipal.getCity(),
                userPrincipal.getWhatsapp(),
                userPrincipal.getEmail(),
                userPrincipal.getMobile(),
                roles,
                userPrincipal.getSupplierId(),
                userPrincipal.getRequiresPasswordChange()
        );
    }

    public void logoutUser(Long userId) {
        if (userId != null) {
            userRepository.findById(userId).ifPresent(u -> {
                u.setIsOnline(false);
                u.setLastActiveAt(LocalDateTime.now());
                userRepository.save(u);
            });
        }
    }
}
