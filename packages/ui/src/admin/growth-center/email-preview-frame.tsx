"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/cn";

export type EmailPreviewFrameProps = {
  html: string;
  title: string;
  className?: string;
};

/**
 * Campaign HTML preview — iframe height tracks document so the full email is visible.
 */
export function EmailPreviewFrame({ html, title, className }: EmailPreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(480);

  const resizeToContent = useCallback(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!doc?.body) {
      return;
    }
    const measured = Math.max(
      doc.body.scrollHeight,
      doc.documentElement?.scrollHeight ?? 0,
      doc.body.offsetHeight,
    );
    setHeight(Math.max(240, measured + 24));
  }, []);

  useEffect(() => {
    resizeToContent();
  }, [html, resizeToContent]);

  return (
    <iframe
      ref={iframeRef}
      className={cn("ea-admin-outreach__iframe", className)}
      title={title}
      srcDoc={html}
      sandbox=""
      onLoad={resizeToContent}
      style={{ height: `${height}px` }}
    />
  );
}
