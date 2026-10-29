import { useEffect, useState } from "react";
import { useCompany } from "./App";
export default function Analytics() {
  const company = useCompany();
  const id = company?.analyticsId;
  const [consent, setConsent] = useState(
    () => window.localStorage.getItem("km-analytics-consent") || "",
  );
  useEffect(() => {
    if (consent !== "accepted" || !id || !/^G-[A-Z0-9]+$/.test(id)) return;
    const global = window as any;
    global.dataLayer = global.dataLayer || [];
    const gtag = (...args: any[]) => global.dataLayer.push(args);
    gtag("js", new Date());
    gtag("config", id, { anonymize_ip: true });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [id, consent]);
  if (!id || consent) return null;
  return (
    <aside className="cookie-notice" aria-label="Optional analytics preference">
      <p>
        May we use optional Google Analytics to understand how visitors use our
        website?
      </p>
      <div className="actions">
        <button
          onClick={() => {
            window.localStorage.setItem("km-analytics-consent", "declined");
            setConsent("declined");
          }}
        >
          Decline
        </button>
        <button
          className="button"
          onClick={() => {
            window.localStorage.setItem("km-analytics-consent", "accepted");
            setConsent("accepted");
          }}
        >
          Accept analytics
        </button>
      </div>
    </aside>
  );
}
