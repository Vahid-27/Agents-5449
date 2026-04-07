import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import "./styles.css";
import { App } from "./app.tsx";
import { getPersistedSession, getPersistedProduct, useBlogStore, PRODUCTS } from "./store/blogStore.ts";
import { fetchSession } from "./hooks/useSessionCache.ts";

async function bootstrap() {
  // Restore active product
  const persistedProduct = getPersistedProduct();
  if (persistedProduct) {
    useBlogStore.getState().setActiveProduct(persistedProduct);
  }

  // Restore active session
  const persisted = getPersistedSession();
  if (persisted?.sessionId) {
    try {
      const data = await fetchSession(persisted.sessionId);
      if (data?.session) {
        useBlogStore.getState().loadSession(data.session, data.outputs || []);
        useBlogStore.setState({ currentAgent: persisted.currentAgent });
        // Also restore active product from session product name
        const sessionProduct = PRODUCTS.find(p => p.name === data.session.product);
        if (sessionProduct && !persistedProduct) {
          useBlogStore.getState().setActiveProduct(sessionProduct);
        }
      }
    } catch {
      localStorage.removeItem('talsy_active_session');
    }
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Router>
        <App />
      </Router>
    </StrictMode>
  );
}

bootstrap();
