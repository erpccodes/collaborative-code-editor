package com.collab.codeEditor.security;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.collab.codeEditor.entity.User;

import lombok.Data;

@Data
public class UserDetailsImpl implements UserDetails{
	 private Long id;
	    private String username;
	    private String email;
	    private String password;
	    private Collection<? extends GrantedAuthority> authorities;

	    public UserDetailsImpl(Long id, String username, String email, String password, 
	                           Collection<? extends GrantedAuthority> authorities) {
	        this.id = id;
	        this.username = username;
	        this.email = email;
	        this.password = password;
	        this.authorities = authorities;
	    }

	    public static UserDetailsImpl build(User user) {
	        List<GrantedAuthority> authorities = user.getRoles().stream()
	                .map(role -> new SimpleGrantedAuthority(role))
	                .collect(Collectors.toList());

	        return new UserDetailsImpl(
	                user.getId(),
	                user.getUsername(),
	                user.getEmail(),
	                user.getPassword(),
	                authorities);
	    }
	    @Override
	    public Collection<? extends GrantedAuthority> getAuthorities() {
	        return authorities;
	    }
}
