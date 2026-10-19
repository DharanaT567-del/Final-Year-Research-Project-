package com.naada.apigateway.dto;

public class UserProfileUpdateDto {

    private String name;
    private String photoURL;

    public UserProfileUpdateDto() {
    }

    public UserProfileUpdateDto(String name, String photoURL) {
        this.name = name;
        this.photoURL = photoURL;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhotoURL() {
        return photoURL;
    }

    public void setPhotoURL(String photoURL) {
        this.photoURL = photoURL;
    }
}
