package com._pearls.contactApp.ExceptionHandling;

public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}