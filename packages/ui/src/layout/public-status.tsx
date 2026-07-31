import type { ReactNode } from "react";
import { EduAtlasLogo } from "../brand/eduatlas-logo";
import { getButtonClassName } from "../components/button-classes";
import { cn } from "../lib/cn";
import type { NavItem } from "./navigation";

export type PublicStatusTone = "neutral" | "loading" | "empty" | "error";

export type PublicStatusBlockProps = {
  title: string;
  message: string;
  eyebrow?: string;
  tone?: PublicStatusTone;
  centered?: boolean;
  titleAs?: "h1" | "h2" | "p";
  actions?: NavItem[];
  primaryAction?: NavItem;
  className?: string;
  children?: ReactNode;
};

/**
 * Shared public status / empty / loading presentation block.
 */
export function PublicStatusBlock({
  title,
  message,
  eyebrow,
  tone = "neutral",
  centered = false,
  titleAs = "h1",
  actions = [],
  primaryAction,
  className,
  children,
}: PublicStatusBlockProps) {
  const actionItems = primaryAction ? [primaryAction, ...actions] : actions;
  const TitleTag = titleAs;

  return (
    <div
      className={cn(
        "ea-status-block",
        centered && "ea-status-block--centered",
        tone === "loading" && "ea-status-block--loading",
        tone === "empty" && "ea-status-block--empty",
        tone === "error" && "ea-status-block--error",
        className,
      )}
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "loading" ? "polite" : undefined}
      aria-busy={tone === "loading" ? true : undefined}
    >
      {tone === "loading" ? <span className="ea-status-block__spinner" aria-hidden="true" /> : null}
      {eyebrow ? <p className="ea-status-block__eyebrow">{eyebrow}</p> : null}
      <TitleTag className="ea-status-block__title">{title}</TitleTag>
      <p className="ea-status-block__message">{message}</p>
      {children}
      {actionItems.length > 0 ? (
        <div className="ea-status-block__actions">
          {actionItems.map((action, index) => (
            <a
              key={action.id}
              href={action.href}
              className={cn(
                getButtonClassName({
                  variant: index === 0 && primaryAction ? "primary" : "secondary",
                  size: "md",
                }),
              )}
            >
              {action.label}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export type PublicLoadingStateProps = {
  message?: string;
  className?: string;
};

/**
 * Full-page style loading state for route transitions.
 */
export function PublicLoadingState({
  message = "Sayfa yükleniyor…",
  className,
}: PublicLoadingStateProps) {
  return (
    <div className={cn("ea-status-page", className)}>
      <PublicStatusBlock
        title="Yükleniyor"
        message={message}
        tone="loading"
        centered
        className="ea-status-block--page-loading"
      />
    </div>
  );
}

export type NotFoundPageViewProps = {
  className?: string;
};

/**
 * Dedicated 404 experience with recovery links.
 */
export function NotFoundPageView({ className }: NotFoundPageViewProps) {
  return (
    <div className={cn("ea-status-page ea-status-page--not-found", className)}>
      <EduAtlasLogo variant="mark" title="EduAtlas" className="ea-status-page__illustration" />
      <PublicStatusBlock
        eyebrow="404"
        title="Sayfa bulunamadı"
        message="Aradığınız sayfa mevcut değil veya taşınmış olabilir. Keşfe aşağıdaki bağlantılardan devam edebilirsiniz."
        tone="empty"
        centered
        primaryAction={{ id: "home", label: "Ana sayfaya dön", href: "/" }}
        actions={[
          { id: "search", label: "Kurum ara", href: "/search" },
          { id: "cities", label: "Şehirler", href: "/cities" },
          { id: "categories", label: "Kategoriler", href: "/categories" },
        ]}
      />
    </div>
  );
}
