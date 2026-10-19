package com.naada.apigateway.service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.SetOptions;
import com.google.firebase.cloud.FirestoreClient;
import com.naada.apigateway.dto.UserProfileUpdateDto;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private static final String USERS_COLLECTION = "users";

    /**
     * Updates the user's profile in Firestore and returns the updated user profile map.
     *
     * @param identifier user UID or user email
     * @param updateDto  DTO containing name and photoURL
     * @return updated user document data as a Map
     */
    public Map<String, Object> updateUserProfile(String identifier, UserProfileUpdateDto updateDto)
            throws ExecutionException, InterruptedException {

        if (identifier == null || identifier.isBlank()) {
            throw new IllegalArgumentException("User identifier cannot be empty");
        }

        Firestore db = FirestoreClient.getFirestore();

        DocumentReference docRef = db.collection(USERS_COLLECTION).document(identifier);
        DocumentSnapshot snapshot = docRef.get().get();

        // If not found by document ID, try searching by uid or email field if identifier might be email
        if (!snapshot.exists()) {
            ApiFuture<QuerySnapshot> queryByEmail = db.collection(USERS_COLLECTION)
                    .whereEqualTo("email", identifier)
                    .limit(1)
                    .get();
            QuerySnapshot emailQueryResults = queryByEmail.get();

            if (!emailQueryResults.isEmpty()) {
                QueryDocumentSnapshot doc = emailQueryResults.getDocuments().get(0);
                docRef = doc.getReference();
                snapshot = doc;
            }
        }

        Map<String, Object> updates = new HashMap<>();
        if (updateDto.getName() != null) {
            updates.put("name", updateDto.getName());
            updates.put("displayName", updateDto.getName());
        }
        if (updateDto.getPhotoURL() != null) {
            updates.put("photoURL", updateDto.getPhotoURL());
            updates.put("profileImage", updateDto.getPhotoURL());
        }
        updates.put("updatedAt", java.time.Instant.now().toString());

        // Perform merge write
        docRef.set(updates, SetOptions.merge()).get();

        // Read back the updated document
        DocumentSnapshot updatedSnapshot = docRef.get().get();
        Map<String, Object> responseData = new HashMap<>();
        if (updatedSnapshot.exists() && updatedSnapshot.getData() != null) {
            responseData.putAll(updatedSnapshot.getData());
        } else {
            responseData.putAll(updates);
            responseData.put("uid", identifier);
        }

        log.info("Successfully updated user profile for identifier: {}", identifier);
        return responseData;
    }
}
