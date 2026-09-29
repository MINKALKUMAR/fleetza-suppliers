package com.fleetza.suppliers.security;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fleetza.suppliers.entity.User;
import com.fleetza.suppliers.enums.UserStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

public class UserPrincipal implements UserDetails {

    private Long id;
    private String username;
    @JsonIgnore
    private String password;
    private String fullName;
    private String companyName;
    private String city;
    private String whatsapp;
    private String email;
    private String mobile;
    private Long supplierId;
    private Boolean requiresPasswordChange;
    private Collection<? extends GrantedAuthority> authorities;
    private boolean active;

    public UserPrincipal(Long id, String username, String password, String fullName,
                         String companyName, String city, String whatsapp,
                         String email, String mobile, Long supplierId, Boolean requiresPasswordChange,
                         Collection<? extends GrantedAuthority> authorities, boolean active) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.fullName = fullName;
        this.companyName = companyName;
        this.city = city;
        this.whatsapp = whatsapp;
        this.email = email;
        this.mobile = mobile;
        this.supplierId = supplierId;
        this.requiresPasswordChange = requiresPasswordChange;
        this.authorities = authorities;
        this.active = active;
    }

    public static UserPrincipal create(User user) {
        List<GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.getName().name()))
                .collect(Collectors.toList());

        return new UserPrincipal(
                user.getId(),
                user.getUsername(),
                user.getPassword(),
                user.getFullName(),
                user.getCompanyName(),
                user.getCity(),
                user.getWhatsapp(),
                user.getEmail(),
                user.getMobile(),
                user.getSupplierId(),
                user.getRequiresPasswordChange(),
                authorities,
                user.getStatus() == UserStatus.ACTIVE
        );
    }

    public Long getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    public String getCompanyName() {
        return companyName;
    }

    public String getCity() {
        return city;
    }

    public String getWhatsapp() {
        return whatsapp;
    }

    public String getEmail() {
        return email;
    }

    public String getMobile() {
        return mobile;
    }

    public Long getSupplierId() {
        return supplierId;
    }

    public Boolean getRequiresPasswordChange() {
        return requiresPasswordChange;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return active;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserPrincipal that = (UserPrincipal) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
