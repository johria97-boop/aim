import React from "react";
import { createRoot } from "react-dom/client";
import "98.css";
import "./styles/y2k-theme.css";
import "./styles/app.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
