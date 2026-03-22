import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom"; // <-- CHANGE THIS
import "./css/index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter> {/* <-- USE HASHROUTER */}
      <App />
    </HashRouter>
  </StrictMode>
);