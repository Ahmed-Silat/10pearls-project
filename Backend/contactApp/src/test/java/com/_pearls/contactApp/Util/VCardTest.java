package com._pearls.contactApp.Util;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class VCardTest {

    @Test
    void parse_version3_withFoldedLinesGroupsAndEscapes() {
        String text = String.join("\r\n",
                "BEGIN:VCARD",
                "VERSION:3.0",
                "N:Khan;Ali;;;",
                "FN:Ali Khan",
                "item1.TEL;TYPE=CELL,PREF:+92 300",
                "  1234567",
                "EMAIL;TYPE=INTERNET;TYPE=WORK:ali@work.com",
                "NOTE:Line one\\nLine two\\, with a comma",
                "CATEGORIES:Family,Work\\, Inc",
                "END:VCARD",
                "");

        List<VCard.Card> cards = VCard.parse(text);

        assertThat(cards).hasSize(1);
        VCard.Card card = cards.getFirst();
        assertThat(card.first("N").orElseThrow().parts()).containsExactly("Khan", "Ali", "", "", "");
        VCard.Property tel = card.first("TEL").orElseThrow();
        assertThat(tel.text()).isEqualTo("+92 300 1234567");
        assertThat(tel.types()).containsExactly("cell", "pref");
        assertThat(card.first("EMAIL").orElseThrow().types()).containsExactly("internet", "work");
        assertThat(card.first("NOTE").orElseThrow().text()).isEqualTo("Line one\nLine two, with a comma");
        assertThat(card.first("CATEGORIES").orElseThrow().list()).containsExactly("Family", "Work, Inc");
    }

    @Test
    void parse_version21_quotedPrintableAndBareTypes() {
        String text = String.join("\n",
                "BEGIN:VCARD",
                "VERSION:2.1",
                "N;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:;=D9=85=D8=AD=D9=85=D8=AF;;;",
                // A "soft" line break: the value goes on, on the next line.
                "NOTE;ENCODING=QUOTED-PRINTABLE:Caf=C3=A9 owner, a very long note th=",
                "at continues",
                "TEL;CELL:03001234567",
                "END:VCARD");

        VCard.Card card = VCard.parse(text).getFirst();

        assertThat(card.first("N").orElseThrow().parts().get(1)).isEqualTo("محمد");
        assertThat(card.first("NOTE").orElseThrow().text()).isEqualTo("Café owner, a very long note that continues");
        assertThat(card.first("TEL").orElseThrow().types()).containsExactly("cell");
    }

    @Test
    void parse_readsEveryCard_andIgnoresTextOutsideThem() {
        String text = "junk\nBEGIN:VCARD\nFN:One\nEND:VCARD\nBEGIN:VCARD\nFN:Two\nEND:VCARD\n";

        assertThat(VCard.parse(text)).extracting(card -> card.first("FN").orElseThrow().text())
                .containsExactly("One", "Two");
    }

    @Test
    void writer_escapesAndFoldsLongLines_andParsesBack() {
        String note = "Notes; with, special \\ characters\nand a second line " + "x".repeat(100) + " محمد";

        String text = new VCard.Writer().begin().text("NOTE", note).end().toString();

        assertThat(text.lines()).allSatisfy(line -> assertThat(line.getBytes(java.nio.charset.StandardCharsets.UTF_8).length)
                .isLessThanOrEqualTo(75));
        assertThat(VCard.parse(text).getFirst().first("NOTE").orElseThrow().text()).isEqualTo(note);
    }
}
