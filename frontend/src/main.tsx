import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { DocumentLang } from "./components/DocumentLang";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <DocumentLang />
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
