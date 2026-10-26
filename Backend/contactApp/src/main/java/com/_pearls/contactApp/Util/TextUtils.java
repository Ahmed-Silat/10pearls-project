package com._pearls.contactApp.Util;

import java.util.Locale;

/** Helpers for cleaning up user-entered text before it is stored. */
public final class TextUtils {

    private TextUtils() {
    }

    /** Removes leading and trailing spaces. Returns null when the value is null. */
    public static String trim(String value) {
        return value == null ? null : value.trim();
    }

    /** Trims and turns runs of spaces inside into one ("  Close   friends " becomes "Close friends"). */
    public static String collapseSpaces(String value) {
        return value == null ? null : value.trim().replaceAll("\\s+", " ");
    }

    /** Trims and lower-cases a value so names and emails are stored consistently. */
    public static String normalize(String value) {
        return value == null ? null : value.trim().toLowerCase(Locale.ROOT);
    }
}
