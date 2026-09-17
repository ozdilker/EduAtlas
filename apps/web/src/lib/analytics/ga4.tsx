"use client";

import Script from "next/script";
import { useEffect } from "react";
import {
  getGaMeasurementId,
  installAnalyticsBridge,
  isAnalyticsEnabled,
} from "./track-event";

/**
 * Single GA4 gtag bootstrap. Production-only. No GTM.
 * send_page_view stays default once; we do not call gtag config twice.
 */
export function Ga4Scripts() {
  const enabled = isAnalyticsEnabled();
  const measurementId = getGaMeasurementId();

  useEffect(() => {
    installAnalyticsBridge();
  }, []);

  if (!enabled || !measurementId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="eduatlas-ga4" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}', { send_page_view: true });
        `}
      </Script>
    </>
  );
}
