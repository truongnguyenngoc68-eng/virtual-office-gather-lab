// CRITICAL: Import polyfills FIRST before any other imports
import "./polyfills/module"; // Must be first - provides global.module for CJS libs
// process polyfill removed - SFU (mediasoup) only, no simple-peer needed

// console.log moved down

import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
// import "./userWorker"; // Tắt worker tạm thời để debug
import { preventDoubleTapZoom } from "./utils/helpers";
import { ToastProvider } from "./contexts/ToastContext";

const rootElement = document.getElementById("root");

if (rootElement) {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ToastProvider>
            <App />
          </ToastProvider>
        </BrowserRouter>
      </React.StrictMode>
    );
  } catch (e) {
    console.error("Main.tsx: Render crashed", e);
  }
} else {
  console.error("Main.tsx: No root element");
}

