import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter,} from "react-router-dom";
import { QueryClientProvider,} from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import "./index.css";
import queryClient from "./app/queryClient";

import { AuthProvider,} from "./context/AuthContext";

createRoot(
  document.getElementById("root")
).render(
  <StrictMode>
    <QueryClientProvider
      client={queryClient}
    >
      <BrowserRouter>
        <AuthProvider>
          <App />

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);