package com.naada.apigateway.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.naada.apigateway.entity.User;
import com.naada.apigateway.repository.UserRepository;
import com.naada.apigateway.service.JwtService;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already registered"));
        }

        User user = new User();
        user.setName(request.get("name"));
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.get("password")));

        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "User registered successfully"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> request) {
        Optional<User> userOpt = userRepository.findByEmail(request.get("email"));

        if (userOpt.isPresent() && passwordEncoder.matches(request.get("password"), userOpt.get().getPassword())) {
            User user = userOpt.get();

            String springToken = jwtService.generateToken(user.getEmail());
            String firebaseToken = null;

            try {
                firebaseToken = FirebaseAuth.getInstance().createCustomToken(user.getFirebaseUid());
            } catch (FirebaseAuthException e) {
                System.err.println("Firebase custom token error for UID [" + user.getFirebaseUid() + "]: " + e.getMessage());
            }

            Map<String, Object> response = new HashMap<>();
            response.put("springToken", springToken);
            response.put("firebaseToken", firebaseToken != null ? firebaseToken : "");
            response.put("userData", Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail()
            ));

            return ResponseEntity.ok(response);
        }

        return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password"));
    }

    @DeleteMapping("/user")
    public ResponseEntity<?> deleteUser(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            String token = authHeader.substring(7);
            String email = jwtService.extractEmail(token);
            Optional<User> userOpt = userRepository.findByEmail(email);
            
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                
                if (user.getFirebaseUid() != null && !user.getFirebaseUid().isEmpty()) {
                    try {
                        FirebaseAuth.getInstance().deleteUser(user.getFirebaseUid());
                    } catch (FirebaseAuthException e) {
                        System.err.println("Firebase user deletion error for UID [" + user.getFirebaseUid() + "]: " + e.getMessage());
                    }
                }
                
                userRepository.delete(user);
                return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
            }
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid token"));
        }
    }
}