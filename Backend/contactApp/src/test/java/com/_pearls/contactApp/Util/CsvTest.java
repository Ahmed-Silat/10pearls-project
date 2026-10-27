package com._pearls.contactApp.Util;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CsvTest {

    @Test
    void parse_handlesQuotesCommasAndLineBreaksInsideCells() {
        String text = "Name,Notes\r\n\"Khan, Ali\",\"Said \"\"hi\"\"\nthen left\"\r\nZed,\r\n";

        assertThat(Csv.parse(text)).containsExactly(
                List.of("Name", "Notes"),
                List.of("Khan, Ali", "Said \"hi\"\nthen left"),
                List.of("Zed", ""));
    }

    @Test
    void parse_skipsBlankLines_andReadsALastLineWithoutANewline() {
        assertThat(Csv.parse("a,b\n\n,\n1,2")).containsExactly(List.of("a", "b"), List.of("1", "2"));
    }

    @Test
    void parse_acceptsSemicolons_whenTheHeaderHasNoCommas() {
        assertThat(Csv.parse("First Name;Phone\nAli;0300 1234567\n"))
                .containsExactly(List.of("First Name", "Phone"), List.of("Ali", "0300 1234567"));
    }

    @Test
    void write_quotesWhatNeedsIt_andReadsBackTheSame() {
        List<List<String>> rows = List.of(
                List.of("Name", "Notes"),
                List.of("Khan, Ali", "Line one\nline \"two\""),
                List.of(" padded ", "plain"));

        String csv = Csv.write(rows);

        assertThat(csv).startsWith("Name,Notes\r\n\"Khan, Ali\",\"Line one\nline \"\"two\"\"\"\r\n");
        assertThat(Csv.parse(csv)).isEqualTo(rows);
    }

    @Test
    void write_stopsFormulas_butLeavesPhoneNumbersAlone() {
        String csv = Csv.write(List.of(List.of("=HYPERLINK(\"x\")", "+92 300 1234567", "@SUM(A1)", "-1+2", "-5")));

        assertThat(Csv.parse(csv).getFirst())
                .containsExactly("'=HYPERLINK(\"x\")", "+92 300 1234567", "'@SUM(A1)", "'-1+2", "-5");
        assertThat(Csv.unprotectFormula("'=HYPERLINK(\"x\")")).isEqualTo("=HYPERLINK(\"x\")");
        assertThat(Csv.unprotectFormula("'quoted")).isEqualTo("'quoted");
    }
}
