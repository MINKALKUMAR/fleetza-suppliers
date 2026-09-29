package com.fleetza.suppliers.service;

import com.fleetza.suppliers.dto.request.ChangePasswordRequest;
import com.fleetza.suppliers.dto.request.CreateSupplierRequest;
import com.fleetza.suppliers.dto.request.UpdateSupplierRequest;
import com.fleetza.suppliers.dto.response.UserSummaryResponse;
import com.fleetza.suppliers.entity.Role;
import com.fleetza.suppliers.entity.User;
import com.fleetza.suppliers.enums.RoleName;
import com.fleetza.suppliers.enums.UserStatus;
import com.fleetza.suppliers.exception.BadRequestException;
import com.fleetza.suppliers.exception.ResourceNotFoundException;
import com.fleetza.suppliers.repository.BookingRequestRepository;
import com.fleetza.suppliers.repository.NotificationRepository;
import com.fleetza.suppliers.repository.RoleRepository;
import com.fleetza.suppliers.repository.UserRepository;
import com.fleetza.suppliers.repository.VehicleRepository;
import com.fleetza.suppliers.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private BookingRequestRepository bookingRequestRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Transactional
    public UserSummaryResponse getCurrentUserProfile(UserPrincipal currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUser.getId()));

        user.setLastActiveAt(LocalDateTime.now());
        user.setIsOnline(true);
        userRepository.save(user);

        return toSummary(user);
    }

    @Transactional
    public void changePassword(UserPrincipal currentUser, ChangePasswordRequest request) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUser.getId()));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password does not match");
        }

        if (request.getNewPassword().equals(request.getCurrentPassword())) {
            throw new BadRequestException("New password cannot be identical to current password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setRequiresPasswordChange(false);
        userRepository.save(user);
    }

    @Transactional
    public UserSummaryResponse createSupplier(CreateSupplierRequest request) {
        String username = request.getUsername().trim().toLowerCase();
        if (userRepository.existsByUsername(username)) {
            throw new BadRequestException("That username is already in use");
        }

        User supplier = new User(
                username,
                passwordEncoder.encode(request.getPassword()),
                request.getFullName().trim(),
                blankToNull(request.getEmail()),
                blankToNull(request.getMobile())
        );
        supplier.setCompanyName(blankToNull(request.getCompanyName()));
        supplier.setCity(blankToNull(request.getCity()));
        supplier.setWhatsapp(blankToNull(request.getWhatsapp()));
        supplier.setVehicleLimit(request.getVehicleLimit() != null && request.getVehicleLimit() > 0 ? request.getVehicleLimit() : 5);

        Role supplierRole = roleRepository.findByName(RoleName.ROLE_SUPPLIER)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", RoleName.ROLE_SUPPLIER));
        supplier.setRoles(new HashSet<>(List.of(supplierRole)));
        supplier.setStatus(UserStatus.ACTIVE);
        supplier.setRequiresPasswordChange(false);
        return toSummary(userRepository.save(supplier));
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> getSuppliers() {
        return userRepository.findByRoles_NameOrderByFullNameAsc(RoleName.ROLE_SUPPLIER).stream()
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserSummaryResponse updateSupplier(Long id, UpdateSupplierRequest request) {
        User supplier = findById(id);
        boolean isSupplier = supplier.getRoles().stream()
                .anyMatch(role -> role.getName() == RoleName.ROLE_SUPPLIER);
        if (!isSupplier) {
            throw new BadRequestException("Only supplier accounts can be managed here");
        }

        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            supplier.setFullName(request.getFullName().trim());
        }
        if (request.getCompanyName() != null) {
            supplier.setCompanyName(blankToNull(request.getCompanyName()));
        }
        if (request.getCity() != null) {
            supplier.setCity(blankToNull(request.getCity()));
        }
        if (request.getWhatsapp() != null) {
            supplier.setWhatsapp(blankToNull(request.getWhatsapp()));
        }
        if (request.getEmail() != null) {
            supplier.setEmail(blankToNull(request.getEmail()));
        }
        if (request.getMobile() != null) {
            supplier.setMobile(blankToNull(request.getMobile()));
        }
        if (request.getUsername() != null && !request.getUsername().trim().isEmpty()) {
            String newUsername = request.getUsername().trim().toLowerCase();
            if (!newUsername.equalsIgnoreCase(supplier.getUsername())) {
                if (userRepository.existsByUsername(newUsername)) {
                    throw new BadRequestException("Username " + newUsername + " is already taken");
                }
                supplier.setUsername(newUsername);
            }
        }
        if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            try {
                supplier.setStatus(UserStatus.valueOf(request.getStatus().trim().toUpperCase()));
            } catch (Exception ignored) {}
        }
        if (request.getNewPassword() != null && request.getNewPassword().trim().length() >= 6) {
            supplier.setPassword(passwordEncoder.encode(request.getNewPassword().trim()));
            supplier.setRequiresPasswordChange(false);
        }
        if (request.getVehicleLimit() != null && request.getVehicleLimit() > 0) {
            supplier.setVehicleLimit(request.getVehicleLimit());
        }

        return toSummary(userRepository.save(supplier));
    }

    @Transactional
    public UserSummaryResponse setSupplierStatus(Long id, UserStatus status) {
        User supplier = findById(id);
        boolean isSupplier = supplier.getRoles().stream()
                .anyMatch(role -> role.getName() == RoleName.ROLE_SUPPLIER);
        if (!isSupplier) {
            throw new BadRequestException("Only supplier accounts can be managed here");
        }
        supplier.setStatus(status);
        return toSummary(userRepository.save(supplier));
    }

    @Transactional
    public void deleteSupplier(Long id) {
        User supplier = findById(id);
        vehicleRepository.deleteBySupplierId(id);
        bookingRequestRepository.deleteBySupplierId(id);
        notificationRepository.deleteByRecipientId(id.toString());
        userRepository.delete(supplier);
    }

    @Transactional
    public void resetSupplierPassword(Long id, String newPassword) {
        if (newPassword == null || newPassword.trim().length() < 6) {
            throw new BadRequestException("Password must be at least 6 characters long");
        }
        User supplier = findById(id);
        boolean isSupplier = supplier.getRoles().stream()
                .anyMatch(role -> role.getName() == RoleName.ROLE_SUPPLIER);
        if (!isSupplier) {
            throw new BadRequestException("Only supplier account passwords can be managed here");
        }
        supplier.setPassword(passwordEncoder.encode(newPassword.trim()));
        supplier.setRequiresPasswordChange(false);
        userRepository.save(supplier);
    }

    @Transactional
    public UserSummaryResponse toggleOnlineStatus(Long id) {
        User user = findById(id);
        boolean current = user.getIsOnline() != null ? user.getIsOnline() : false;
        user.setIsOnline(!current);
        user.setLastActiveAt(LocalDateTime.now());
        if (!current) {
            user.setLastLoginAt(LocalDateTime.now());
        }
        User saved = userRepository.save(user);
        return toSummary(saved);
    }

    @Transactional(readOnly = true)
    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    public UserSummaryResponse toSummary(User user) {
        List<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toList());
        UserSummaryResponse response = new UserSummaryResponse(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getCompanyName(),
                user.getCity(),
                user.getWhatsapp(),
                user.getEmail(),
                user.getMobile(),
                roles,
                user.getSupplierId(),
                user.getRequiresPasswordChange(),
                user.getStatus().name(),
                user.getCreatedAt()
        );
        response.setVehicleLimit(user.getVehicleLimit() != null ? user.getVehicleLimit() : 5);
        response.setVehicleCount(vehicleRepository.countBySupplierId(user.getId()));
        response.setLastLoginAt(user.getLastLoginAt());
        response.setLastActiveAt(user.getLastActiveAt());
        response.setIsOnline(user.getIsOnline() != null ? user.getIsOnline() : false);
        if (user.getLastLoginAt() != null) {
            long days = ChronoUnit.DAYS.between(user.getLastLoginAt().toLocalDate(), LocalDate.now());
            response.setDaysSinceLastLogin(Math.max(0, days));
        } else {
            response.setDaysSinceLastLogin(null);
        }
        return response;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
