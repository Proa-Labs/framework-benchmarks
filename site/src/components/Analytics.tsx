import { useEffect } from "react";

// Dedicated frameworks.run property (564467857), web stream G-4D4K3ERTJ9.
// This is the Google tag supplied by that stream's installation screen.
export const analyticsTagId = "GTM-WBJ9PW8K";

declare global {
  interface Window {
    dataLayer?: IArguments[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function installAnalytics() {
  if (
    location.protocol !== "https:" ||
    !["frameworks.run", "www.frameworks.run"].includes(location.hostname) ||
    document.querySelector("script[data-site-analytics]")
  )
    return;

  window.dataLayer ??= [];
  const dataLayer = window.dataLayer;
  window.gtag ??= function () {
    // biome-ignore lint/complexity/noArguments: Google tag's documented command queue uses IArguments.
    dataLayer.push(arguments);
  };
  window.gtag("js", new Date());

  // Enhanced measurement owns page views, including History API navigation.
  // Do not send additional manual page_view events and double-count visits.
  const script = document.createElement("script");
  script.async = true;
  script.dataset.siteAnalytics = analyticsTagId;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${analyticsTagId}`;
  document.head.append(script);
}

export function Analytics() {
  useEffect(installAnalytics, []);
  return null;
}
