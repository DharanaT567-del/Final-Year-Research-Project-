package com.naada.apigateway.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
            String firebaseToken = "";

            try {
                firebaseToken = FirebaseAuth.getInstance().createCustomToken(user.getFirebaseUid());
            } catch (FirebaseAuthException e) {
                System.err.println("Firebase custom token warning: " + e.getMessage());
            }

            Map<String, Object> response = new HashMap<>();
            response.put("springToken", springToken);
            response.put("firebaseToken", firebaseToken);
            response.put("userData", Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail()
            ));

            return ResponseEntity.ok(response);
        }

        return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password"));
    }
}