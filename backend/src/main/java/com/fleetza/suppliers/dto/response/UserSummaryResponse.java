package com.fleetza.suppliers.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public class UserSummaryResponse {

    private Long id;
    private String username;
    private String fullName;
    private String companyName;
    private String city;
    private String whatsapp;
    private String email;
    private String mobile;
    private List<String> roles;
    private Long supplierId;
    private Boolean requiresPasswordChange;
    private String status;
    private Boolean active;
    private Integer vehicleLimit = 5;
    private Long vehicleCount = 0L;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;
    private LocalDateTime lastActiveAt;
    private Boolean isOnline = false;
    private Long daysSinceLastLogin;

    public UserSummaryResponse() {
    }

    public UserSummaryResponse(Long id, String username, String fullName, String companyName,
                               String city, String whatsapp, String email, String mobile,
                               List<String> roles, Long supplierId, Boolean requiresPasswordChange,
                               String status, LocalDateTime createdAt) {
        this.id = id;
        this.username = username;
        this.fullName = fullName;
        this.companyName = companyName;
        this.city = city;
        this.whatsapp = whatsapp;
        this.email = email;
        this.mobile = mobile;
        this.roles = roles;
        this.supplierId = supplierId;
        this.requiresPasswordChange = requiresPasswordChange;
        this.status = status;
        this.active = "ACTIVE".equalsIgnoreCase(status);
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getWhatsapp() {
        return whatsapp;
    }

    public void setWhatsapp(String whatsapp) {
        this.whatsapp = whatsapp;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMobile() {
        return mobile;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
    }

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }

    public Long getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Long supplierId) {
        this.supplierId = supplierId;
    }

    public Boolean getRequiresPasswordChange() {
        return requiresPasswordChange;
    }

    public void setRequiresPasswordChange(Boolean requiresPasswordChange) {
        this.requiresPasswordChange = requiresPasswordChange;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
        this.active = "ACTIVE".equalsIgnoreCase(status);
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Integer getVehicleLimit() {
        return vehicleLimit != null ? vehicleLimit : 5;
    }

    public void setVehicleLimit(Integer vehicleLimit) {
        this.vehicleLimit = vehicleLimit;
    }

    public Long getVehicleCount() {
        return vehicleCount != null ? vehicleCount : 0L;
    }

    public void setVehicleCount(Long vehicleCount) {
        this.vehicleCount = vehicleCount;
    }

    public LocalDateTime getLastLoginAt() {
        return lastLoginAt;
    }

    public void setLastLoginAt(LocalDateTime lastLoginAt) {
        this.lastLoginAt = lastLoginAt;
    }

    public LocalDateTime getLastActiveAt() {
        return lastActiveAt;
    }

    public void setLastActiveAt(LocalDateTime lastActiveAt) {
        this.lastActiveAt = lastActiveAt;
    }

    public Boolean getIsOnline() {
        return isOnline != null ? isOnline : false;
    }

    public void setIsOnline(Boolean isOnline) {
        this.isOnline = isOnline;
    }

    public Long getDaysSinceLastLogin() {
        return daysSinceLastLogin;
    }

    public void setDaysSinceLastLogin(Long daysSinceLastLogin) {
        this.daysSinceLastLogin = daysSinceLastLogin;
    }
}
