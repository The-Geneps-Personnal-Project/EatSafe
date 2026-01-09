import React from "react";
import * as ReactDOM from "react-dom/client";
import App from "./App";
import "./theme";
import './index.css';

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/service-worker.js").catch((err) => {
            console.warn("Service worker registration failed:", err);
        });
    });
}