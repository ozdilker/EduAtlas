"use client";

import { useEffect, useState } from "react";
import { GrowthProgressBar } from "./progress-bar";
import type { GrowthProgressView } from "./types";

type LivePayload = Readonly<{
  progress: GrowthProgressView;
  remaining: number;
  etaMinutes: number;
}>;

export function GrowthLiveDelivery({
  progress: initialProgress,
  status,
  campaignId,
  initialRemaining = 0,
  initialEtaMinutes = 0,
}: {
  progress: GrowthProgressView | null;
  status: string;
  campaignId: string;
  initialRemaining?: number;
  initialEtaMinutes?: number;
}) {
  const [progress, setProgress] = useState(initialProgress);
  const [remaining, setRemaining] = useState(initialRemaining);
  const [etaMinutes, setEtaMinutes] = useState(initialEtaMinutes);

  useEffect(() => {
    setProgress(initialProgress);
    setRemaining(initialRemaining);
    setEtaMinutes(initialEtaMinutes);
  }, [initialProgress, initialRemaining, initialEtaMinutes]);

  useEffect(() => {
    if (status !== "running" || !campaignId) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(
          `/admin/outreach/progress?campaignId=${encodeURIComponent(campaignId)}&status=running`,
          { cache: "no-store" },
        );
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as LivePayload;
        if (cancelled) return;
        setProgress(data.progress);
        setRemaining(data.remaining);
        setEtaMinutes(data.etaMinutes);
      } catch {
        /* ignore transient poll errors */
      }
    };

    void poll();
    const id = window.setInterval(() => void poll(), 5000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [status, campaignId]);

  if (!progress || progress.total === 0) {
    return (
      <section className="ea-growth-panel" aria-label="Live delivery">
        <h3 className="ea-admin-subsection-title">Live Delivery</h3>
        <p className="ea-admin-muted">
          Prepare sonrası DeliveryJob sayaçları burada görünür. Kampanya durumu: {status}
        </p>
      </section>
    );
  }

  return (
    <section className="ea-growth-panel" aria-label="Live delivery">
      <h3 className="ea-admin-subsection-title">Live Delivery</h3>
      <GrowthProgressBar progress={progress} />
      <ul className="ea-admin-outreach__progress">
        <li>Queued: {progress.queued}</li>
        <li>Locked/Processing: {progress.locked}</li>
        <li>Sent: {progress.sent}</li>
        <li>Failed: {progress.failed}</li>
        <li>Bounce: {progress.bounced}</li>
        <li>Kalan: {remaining}</li>
        <li>ETA: {etaMinutes} dk</li>
        <li>%{progress.percent}</li>
      </ul>
      {status === "running" ? (
        <p className="ea-admin-muted">Canlı güncelleme ~5 sn (worker tick dahil).</p>
      ) : null}
    </section>
  );
}
