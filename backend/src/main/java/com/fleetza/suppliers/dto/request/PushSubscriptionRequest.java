package com.fleetza.suppliers.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class PushSubscriptionRequest {

    @NotBlank(message = "Push endpoint is required")
    private String endpoint;

    @NotNull(message = "Push subscription keys are required")
    @Valid
    private Keys keys;

    private String userAgent;

    public static class Keys {
        @NotBlank(message = "p256dh key is required")
        private String p256dh;

        @NotBlank(message = "auth key is required")
        private String auth;

        public String getP256dh() {
            return p256dh;
        }

        public void setP256dh(String p256dh) {
            this.p256dh = p256dh;
        }

        public String getAuth() {
            return auth;
        }

        public void setAuth(String auth) {
            this.auth = auth;
        }
    }

    public String getEndpoint() {
        return endpoint;
    }

    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    public Keys getKeys() {
        return keys;
    }

    public void setKeys(Keys keys) {
        this.keys = keys;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }
}

