package com.fleetza.suppliers.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Size;

@JsonIgnoreProperties(ignoreUnknown = true)
public class UpdateSupplierRequest {

    @Size(max = 100)
    private String fullName;

    @Size(max = 100)
    private String companyName;

    @Size(max = 100)
    private String city;

    @Size(max = 20)
    private String whatsapp;

    @Size(max = 100)
    private String email;

    @Size(max = 20)
    private String mobile;

    @Size(max = 50)
    private String username;

    private String status;

    @Size(min = 6, max = 100)
    private String newPassword;

    private Integer vehicleLimit;

    public UpdateSupplierRequest() {
    }

    public Integer getVehicleLimit() {
        return vehicleLimit;
    }

    public void setVehicleLimit(Integer vehicleLimit) {
        this.vehicleLimit = vehicleLimit;
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

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
