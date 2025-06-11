import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

// Mock environment variables
process.env.OPENAI_API_KEY = "test-api-key";

// Mock TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock fetch with improved implementation
global.fetch = jest.fn().mockImplementation(() => {
  // Default mock response
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ suggestions: [] }),
    body: {
      getReader: () => ({
        read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
      }),
    },
  });
});

// Mock ReadableStream
global.ReadableStream = jest.fn().mockImplementation(() => ({
  getReader: jest.fn().mockReturnValue({
    read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
  }),
}));

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock window.alert since JSDOM doesn't implement it
Object.defineProperty(window, "alert", {
  value: jest.fn(),
  writable: true,
});

// Mock scrollIntoView
Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
  value: jest.fn(),
  writable: true,
});
