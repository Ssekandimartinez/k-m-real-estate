import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import "./styles.css";
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});
const bootstrap = document.getElementById("km-company");
if (bootstrap?.textContent) {
  try {
    queryClient.setQueryData(["company"], JSON.parse(bootstrap.textContent));
  } catch {
    /* Fetch live settings when bootstrap is unavailable. */
  }
}
const detail=document.getElementById('km-detail');
if(detail?.textContent){try{const entry=JSON.parse(detail.textContent);queryClient.setQueryData(['detail',entry.kind,entry.slug],entry);}catch{/* Fetch content through the API if needed. */}}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
