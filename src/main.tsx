import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

// Umami 방문자 추적 — VITE_UMAMI_WEBSITE_ID / VITE_UMAMI_URL 설정 시 활성화
const umamiId  = import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined;
const umamiUrl = import.meta.env.VITE_UMAMI_URL        as string | undefined;
if (umamiId && umamiUrl) {
  const s = document.createElement("script");
  s.defer = true;
  s.src = umamiUrl;
  s.setAttribute("data-website-id", umamiId);
  document.head.appendChild(s);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
