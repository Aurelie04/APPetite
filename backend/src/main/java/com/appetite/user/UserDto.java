package com.appetite.user;

public record UserDto(Long id, String fullName, String email, String phone, Role role) {

    public static UserDto from(User user) {
        return new UserDto(user.getId(), user.getFullName(), user.getEmail(), user.getPhone(), user.getRole());
    }
}
