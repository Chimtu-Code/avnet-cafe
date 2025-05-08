import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { SideBarProvider } from "./context/SideBarContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <CartProvider>
      <SideBarProvider>
        <App />
      </SideBarProvider>
    </CartProvider>
  </StrictMode>
);
