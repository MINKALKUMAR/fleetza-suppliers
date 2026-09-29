package com.fleetza.suppliers.dto.response;

import java.util.List;

public class JwtAuthResponse {

    private String accessToken;
    private String tokenType = "Bearer";
    private Long id;
    private Long userId;
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

    public JwtAuthResponse() {
    }

    public JwtAuthResponse(String accessToken, Long userId, String username, String fullName,
                           String companyName, String city, String whatsapp,
                           String email, String mobile, List<String> roles, Long supplierId,
                           Boolean requiresPasswordChange) {
        this.accessToken = accessToken;
        this.tokenType = "Bearer";
        this.id = userId;
        this.userId = userId;
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
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public Long getId() {
        return id != null ? id : userId;
    }

    public void setId(Long id) {
        this.id = id;
        this.userId = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
        this.id = userId;
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
}
