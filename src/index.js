import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";
import { Provider } from "react-redux";
import { store } from "./redux/store";

// Suppress development warnings and errors
if (process.env.NODE_ENV === 'development') {
  const originalWarn = console.warn;
  console.warn = function(message, ...args) {
    // Check if this is a warning we want to suppress
    const shouldSuppress = 
      // Check message directly
      (typeof message === 'string' && (
        message.includes('DOMNodeInserted') || // Quill.js
        message.includes('unreachable code after return') || // CKEditor/Unicode
        message.includes('installHook') || // React DevTools
        message.includes('Source map error') // Source maps
      )) ||
      // Check first argument if it's a string
      (args[0] && typeof args[0] === 'string' && (
        args[0].includes('unreachable code after return') ||
        args[0].includes('unicode.ts')
      ));
      
    if (shouldSuppress) {
      return;
    }
    originalWarn.apply(console, [message, ...args]);
  };

  const originalError = console.error;
  console.error = function(message, ...args) {
    // Suppress source map and specific errors
    if (typeof message === 'string' && (
      message.includes('Source map error') ||
      message.includes('installHook') ||
      message.includes('unicode.ts')
    )) {
      return;
    }
    originalError.apply(console, [message, ...args]);
  };
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <Router>
      <App />
    </Router>
  </Provider>
);
