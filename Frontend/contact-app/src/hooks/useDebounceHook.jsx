import { useState, useEffect } from "react";

/**
 * Returns `inputValue` once it has stopped changing for `delay` ms.
 * With `immediateWhenEmpty`, clearing the value (to "") is applied straight away.
 */
export const useDebouncedValue = (inputValue, delay, { immediateWhenEmpty = false } = {}) => {
  const [debouncedValue, setDebouncedValue] = useState(inputValue);

  useEffect(() => {
    if (immediateWhenEmpty && inputValue === "") {
      setDebouncedValue("");
      return undefined;
    }

    const handler = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, delay, immediateWhenEmpty]);

  return debouncedValue;
};
