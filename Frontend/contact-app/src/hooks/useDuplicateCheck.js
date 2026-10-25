import { useCallback, useRef, useState } from "react";
import { checkDuplicates } from "../service/ContactService";

const looksLikeEmail = (value) => /^\S+@\S+\.\S+$/.test(value.trim());

/**
 * Looks for other contacts with the same phone number or email while a form is being filled in, so the user
 * hears about a duplicate before pressing Save. Call `check` when the phone or email field loses focus.
 * `excludeId` is the contact being edited (omit for a new contact). Purely a warning; it never blocks.
 */
export function useDuplicateCheck(excludeId) {
  const [matches, setMatches] = useState([]);
  // Only the latest check's answer is used, in case the user moves between fields quickly.
  const latestRef = useRef(0);

  const check = useCallback(
    async ({ phone = "", email = "" }) => {
      const requestId = ++latestRef.current;
      // Skip half-typed values: they'd only match by accident.
      const usablePhone = phone.replace(/\D/g, "").length >= 7 ? phone : "";
      const usableEmail = looksLikeEmail(email) ? email.trim() : "";
      if (!usablePhone && !usableEmail) {
        setMatches([]);
        return;
      }
      try {
        const result = await checkDuplicates({ phone: usablePhone, email: usableEmail, excludeId });
        if (requestId === latestRef.current) setMatches(result || []);
      } catch {
        // A failed check just means no warning; saving still checks on the server.
        if (requestId === latestRef.current) setMatches([]);
      }
    },
    [excludeId]
  );

  return { matches, check };
}
