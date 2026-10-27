package com._pearls.contactApp.Util;

import java.io.ByteArrayOutputStream;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * Reads and writes vCard (.vcf) files, the format phones and email apps use for contacts. Reading understands
 * versions 2.1, 3.0 and 4.0: folded lines, quoted-printable values (old Android exports), "item1." groups and
 * escaped characters. Writing produces version 3.0, which every common app imports.
 */
public final class VCard {

    private VCard() {
    }

    /**
     * One line of a card, e.g. {@code TEL;TYPE=CELL:0300 1234567}. The name and parameter names are upper case;
     * {@code value} is decoded from quoted-printable but still escaped (see {@link #text} and {@link #parts}).
     */
    public record Property(String name, Map<String, List<String>> params, String value) {

        /** The TYPE values, lower case (TYPE=CELL,VOICE and the 2.1 style ";CELL;VOICE" both give [cell, voice]). */
        public List<String> types() {
            return params.getOrDefault("TYPE", List.of()).stream()
                    .map(type -> type.toLowerCase(Locale.ROOT))
                    .toList();
        }

        /** The value as plain text. */
        public String text() {
            return unescape(value);
        }

        /** A structured value (N, ADR, ORG) split into its parts, each unescaped. */
        public List<String> parts() {
            return splitUnescaped(value, ';');
        }

        /** A list value (CATEGORIES) split at commas, each unescaped. */
        public List<String> list() {
            return splitUnescaped(value, ',');
        }
    }

    /** One contact: the lines between BEGIN:VCARD and END:VCARD. */
    public record Card(List<Property> properties) {

        public List<Property> all(String name) {
            return properties.stream().filter(property -> property.name().equals(name)).toList();
        }

        public Optional<Property> first(String name) {
            return properties.stream().filter(property -> property.name().equals(name)).findFirst();
        }
    }

    // Reading ----------------------------------------------------------------------------------------------------

    /** Every card in the text. Lines outside BEGIN:VCARD ... END:VCARD are ignored. */
    public static List<Card> parse(String text) {
        List<Card> cards = new ArrayList<>();
        List<Property> current = null;
        int depth = 0;
        for (String line : unfold(text)) {
            Property property = parseLine(line);
            if (property == null) {
                continue;
            }
            if (property.name().equals("BEGIN") && property.value().trim().equalsIgnoreCase("VCARD")) {
                depth++;
                if (depth == 1) {
                    current = new ArrayList<>();
                }
            } else if (property.name().equals("END") && property.value().trim().equalsIgnoreCase("VCARD")) {
                if (depth == 1 && current != null) {
                    cards.add(new Card(current));
                    current = null;
                }
                depth = Math.max(depth - 1, 0);
            } else if (depth == 1 && current != null) {
                // Cards nested inside a card (2.1's AGENT) are skipped.
                current.add(property);
            }
        }
        return cards;
    }

    /**
     * Joins folded lines back together: a line starting with a space or tab continues the previous one. A
     * quoted-printable value ending in "=" also continues on the next line (a "soft" line break).
     */
    static List<String> unfold(String text) {
        List<String> lines = new ArrayList<>();
        for (String raw : text.split("\r\n|\r|\n", -1)) {
            boolean continuesFolded = !lines.isEmpty() && !raw.isEmpty()
                    && (raw.charAt(0) == ' ' || raw.charAt(0) == '\t');
            if (continuesFolded) {
                lines.set(lines.size() - 1, lines.getLast() + raw.substring(1));
                continue;
            }
            if (!lines.isEmpty() && isQuotedPrintable(lines.getLast()) && lines.getLast().endsWith("=")) {
                String previous = lines.getLast();
                lines.set(lines.size() - 1, previous.substring(0, previous.length() - 1) + raw);
                continue;
            }
            lines.add(raw);
        }
        return lines;
    }

    private static boolean isQuotedPrintable(String line) {
        int colon = line.indexOf(':');
        return colon > 0 && line.substring(0, colon).toUpperCase(Locale.ROOT).contains("QUOTED-PRINTABLE");
    }

    /** "item1.TEL;TYPE=cell:0300" as a Property, or null for a blank or malformed line. */
    static Property parseLine(String line) {
        int colon = indexOfUnquoted(line, ':');
        if (line.isBlank() || colon <= 0) {
            return null;
        }
        String[] head = line.substring(0, colon).split(";");
        String name = head[0].trim().toUpperCase(Locale.ROOT);
        int dot = name.lastIndexOf('.');
        if (dot >= 0) {
            name = name.substring(dot + 1);
        }
        Map<String, List<String>> params = new LinkedHashMap<>();
        for (int i = 1; i < head.length; i++) {
            String param = head[i].trim();
            if (param.isEmpty()) {
                continue;
            }
            int equals = param.indexOf('=');
            // A bare parameter (2.1's "TEL;CELL:") is a TYPE.
            String key = equals < 0 ? "TYPE" : param.substring(0, equals).trim().toUpperCase(Locale.ROOT);
            String values = equals < 0 ? param : param.substring(equals + 1);
            List<String> list = params.computeIfAbsent(key, k -> new ArrayList<>());
            for (String value : values.split(",")) {
                String cleaned = value.trim().replace("\"", "");
                if (!cleaned.isEmpty()) {
                    list.add(key.equals("TYPE") ? cleaned.toUpperCase(Locale.ROOT) : cleaned);
                }
            }
        }
        String value = line.substring(colon + 1);
        List<String> encoding = params.getOrDefault("ENCODING", List.of());
        if (encoding.stream().anyMatch(e -> e.equalsIgnoreCase("QUOTED-PRINTABLE"))) {
            value = decodeQuotedPrintable(value, charsetOf(params));
        }
        return new Property(name, params, value);
    }

    private static int indexOfUnquoted(String line, char wanted) {
        boolean quoted = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                quoted = !quoted;
            } else if (c == wanted && !quoted) {
                return i;
            }
        }
        return -1;
    }

    private static Charset charsetOf(Map<String, List<String>> params) {
        List<String> charset = params.getOrDefault("CHARSET", List.of());
        try {
            return charset.isEmpty() ? StandardCharsets.UTF_8 : Charset.forName(charset.getFirst());
        } catch (IllegalArgumentException ex) {
            return StandardCharsets.UTF_8;
        }
    }

    static String decodeQuotedPrintable(String value, Charset charset) {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            if (c == '=' && i + 2 < value.length() && isHex(value.charAt(i + 1)) && isHex(value.charAt(i + 2))) {
                bytes.write(Integer.parseInt(value.substring(i + 1, i + 3), 16));
                i += 2;
            } else {
                byte[] encoded = String.valueOf(c).getBytes(charset);
                bytes.write(encoded, 0, encoded.length);
            }
        }
        return bytes.toString(charset);
    }

    private static boolean isHex(char c) {
        return Character.digit(c, 16) >= 0;
    }

    static String unescape(String value) {
        StringBuilder out = new StringBuilder(value.length());
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            if (c == '\\' && i + 1 < value.length()) {
                char next = value.charAt(++i);
                out.append(next == 'n' || next == 'N' ? '\n' : next);
            } else {
                out.append(c);
            }
        }
        return out.toString();
    }

    /** Splits at separators that aren't escaped with a backslash, then unescapes each part. */
    static List<String> splitUnescaped(String value, char separator) {
        List<String> parts = new ArrayList<>();
        StringBuilder part = new StringBuilder();
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            if (c == '\\' && i + 1 < value.length()) {
                part.append(c).append(value.charAt(++i));
            } else if (c == separator) {
                parts.add(unescape(part.toString()));
                part.setLength(0);
            } else {
                part.append(c);
            }
        }
        parts.add(unescape(part.toString()));
        return parts;
    }

    // Writing ----------------------------------------------------------------------------------------------------

    /** Builds a .vcf file, one card at a time. */
    public static final class Writer {

        private final StringBuilder out = new StringBuilder();

        public Writer begin() {
            line("BEGIN:VCARD");
            line("VERSION:3.0");
            return this;
        }

        public Writer end() {
            line("END:VCARD");
            return this;
        }

        /** A text property, e.g. {@code text("NOTE", "Likes tea")}. Nothing is written for a blank value. */
        public Writer text(String nameAndParams, String value) {
            if (value != null && !value.isBlank()) {
                line(nameAndParams + ":" + escape(value));
            }
            return this;
        }

        /** A structured property (N, ADR), its parts joined with semicolons. */
        public Writer structured(String nameAndParams, String... parts) {
            String joined = String.join(";", Arrays.stream(parts).map(part -> escape(part == null ? "" : part)).toList());
            line(nameAndParams + ":" + joined);
            return this;
        }

        /** A list property (CATEGORIES), its values joined with commas. Nothing is written for an empty list. */
        public Writer list(String nameAndParams, List<String> values) {
            if (!values.isEmpty()) {
                line(nameAndParams + ":" + String.join(",", values.stream().map(VCard::escape).toList()));
            }
            return this;
        }

        /** A value written as it is (dates, booleans). */
        public Writer raw(String nameAndParams, String value) {
            line(nameAndParams + ":" + value);
            return this;
        }

        @Override
        public String toString() {
            return out.toString();
        }

        /** Lines longer than 75 bytes are folded, never in the middle of a character. */
        private void line(String line) {
            int bytes = 0;
            for (int i = 0; i < line.length(); ) {
                int codePoint = line.codePointAt(i);
                int size = new String(Character.toChars(codePoint)).getBytes(StandardCharsets.UTF_8).length;
                if (bytes + size > 75) {
                    out.append("\r\n ");
                    bytes = 1;
                }
                out.appendCodePoint(codePoint);
                bytes += size;
                i += Character.charCount(codePoint);
            }
            out.append("\r\n");
        }
    }

    static String escape(String value) {
        return value.replace("\\", "\\\\")
                .replace(",", "\\,")
                .replace(";", "\\;")
                .replace("\r\n", "\\n")
                .replace("\n", "\\n")
                .replace("\r", "\\n");
    }
}
