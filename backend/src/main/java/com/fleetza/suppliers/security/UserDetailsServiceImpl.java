package com.fleetza.suppliers.security;

import com.fleetza.suppliers.entity.User;
import com.fleetza.suppliers.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        String cleanUsername = username != null ? username.trim() : "";
        User user = userRepository.findByUsernameIgnoreCase(cleanUsername)
                .orElseGet(() -> userRepository.findByUsername(cleanUsername)
                        .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username)));

        return UserPrincipal.create(user);
    }
}
