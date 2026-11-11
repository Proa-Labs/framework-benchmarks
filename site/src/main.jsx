import { hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "./App.jsx";
import "./theme.css";
import "./styles.css";
import "./page.css";
import "./features.css";

hydrateRoot(
  document.getElementById("root"),
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
