package com._pearls.contactApp.Util;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Reads and writes CSV (RFC 4180): quoted cells may contain commas, quotes ("" inside quotes) and line breaks.
 * Reading also accepts semicolons as the separator, which European versions of Excel use.
 */
public final class Csv {

    private Csv() {
    }

    /** A value that only looks like a phone number ("+92 300 1234567", "-5"); safe to leave unprotected. */
    private static final Pattern PHONE_LIKE = Pattern.compile("[+-][\\d\\s().-]*");

    /**
     * The rows of a CSV text, each a list of cells. Lines that are completely empty are skipped. The separator is
     * a comma, or a semicolon if the first line has semicolons but no commas.
     */
    public static List<List<String>> parse(String text) {
        char separator = detectSeparator(text);
        List<List<String>> rows = new ArrayList<>();
        List<String> row = new ArrayList<>();
        StringBuilder cell = new StringBuilder();
        boolean quoted = false;
        int i = 0;
        while (i < text.length()) {
            char c = text.charAt(i);
            if (quoted) {
                if (c == '"' && i + 1 < text.length() && text.charAt(i + 1) == '"') {
                    cell.append('"');
                    i += 2;
                    continue;
                }
                if (c == '"') {
                    quoted = false;
                } else {
                    cell.append(c);
                }
            } else if (c == '"' && cell.isEmpty()) {
                quoted = true;
            } else if (c == separator) {
                row.add(cell.toString());
                cell.setLength(0);
            } else if (c == '\r' || c == '\n') {
                row.add(cell.toString());
                cell.setLength(0);
                addUnlessBlank(rows, row);
                row = new ArrayList<>();
                if (c == '\r' && i + 1 < text.length() && text.charAt(i + 1) == '\n') {
                    i++;
                }
            } else {
                cell.append(c);
            }
            i++;
        }
        if (!cell.isEmpty() || !row.isEmpty()) {
            row.add(cell.toString());
            addUnlessBlank(rows, row);
        }
        return rows;
    }

    private static void addUnlessBlank(List<List<String>> rows, List<String> row) {
        if (row.stream().anyMatch(value -> !value.isBlank())) {
            rows.add(row);
        }
    }

    private static char detectSeparator(String text) {
        int end = text.indexOf('\n');
        String firstLine = end < 0 ? text : text.substring(0, end);
        return firstLine.indexOf(',') < 0 && firstLine.indexOf(';') >= 0 ? ';' : ',';
    }

    /** CSV text for these rows, with Windows line endings (what Excel expects). */
    public static String write(List<List<String>> rows) {
        StringBuilder out = new StringBuilder();
        for (List<String> row : rows) {
            for (int i = 0; i < row.size(); i++) {
                if (i > 0) {
                    out.append(',');
                }
                out.append(quote(protectFormula(row.get(i))));
            }
            out.append("\r\n");
        }
        return out.toString();
    }

    private static String quote(String value) {
        if (value == null) {
            return "";
        }
        boolean needsQuotes = value.contains(",") || value.contains(";") || value.contains("\"")
                || value.contains("\n") || value.contains("\r") || !value.equals(value.strip());
        return needsQuotes ? "\"" + value.replace("\"", "\"\"") + "\"" : value;
    }

    /**
     * Stops a spreadsheet from running a cell as a formula (CSV injection): a value starting with =, +, -, @, a
     * tab or a carriage return gets a leading apostrophe, which spreadsheets show as plain text. Phone numbers
     * such as "+92 300 1234567" are left alone. {@link #unprotectFormula} undoes it on import.
     */
    static String protectFormula(String value) {
        if (value == null || value.isEmpty()) {
            return value;
        }
        char first = value.charAt(0);
        boolean risky = first == '=' || first == '@' || first == '\t' || first == '\r'
                || ((first == '+' || first == '-') && !PHONE_LIKE.matcher(value).matches());
        return risky ? "'" + value : value;
    }

    /** Removes the apostrophe {@link #protectFormula} added. */
    public static String unprotectFormula(String value) {
        if (value != null && value.length() > 1 && value.charAt(0) == '\''
                && "=+-@\t\r".indexOf(value.charAt(1)) >= 0) {
            return value.substring(1);
        }
        return value;
    }
}
