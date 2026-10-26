import "@testing-library/jest-dom/vitest";
import api from "./service/Constants";

// Tests never talk to a real server: any API call a test didn't mock fails straight away.
api.defaults.adapter = () => Promise.reject(new Error("Network requests are disabled in tests"));

// jsdom is missing a few browser APIs that the shadcn/ui (Radix) components use for menus, selects and dialogs.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub;

const elementProto = window.HTMLElement.prototype;
elementProto.hasPointerCapture ??= () => false;
elementProto.setPointerCapture ??= () => {};
elementProto.releasePointerCapture ??= () => {};
elementProto.scrollIntoView ??= () => {};

window.matchMedia ??= (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => false,
});
