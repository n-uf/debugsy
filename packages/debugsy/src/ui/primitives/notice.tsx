"use client";

import type React from "react";

/** info: LED. ok: done. warn: amber. caution: pink (an error or a destructive step). neutral: dim. */
export type NoticeTone = "info" | "ok" | "warn" | "caution" | "neutral";

export interface NoticeProps {
  children: React.ReactNode;
  tone?: NoticeTone;
  /** Makes the notice's text a button (the whole line when there are no actions) */
  onClick?: () => void;
  title?: string;
  /** Words at the end of the line (actions) */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * One-line notice with a tone stripe on its left edge (kavun's StatusTape and
 * NoticePanel): banners above the logs, the truncation notice.
 */
export const Notice: React.FC<NoticeProps> = ({ children, tone = "neutral", onClick, title, actions, className }) => {
  const cls = className ? `dbg-notice ${className}` : "dbg-notice";
  const toneAttr = tone === "neutral" ? undefined : tone;
  if (onClick && !actions) {
    return (
      <button type="button" className={cls} data-tone={toneAttr} onClick={onClick} title={title}>
        <span className="dbg-notice-body">{children}</span>
      </button>
    );
  }
  return (
    <div className={cls} data-tone={toneAttr} title={title}>
      {onClick ? (
        <button type="button" className="dbg-notice-body" onClick={onClick}>
          {children}
        </button>
      ) : (
        <span className="dbg-notice-body">{children}</span>
      )}
      {actions && <span className="dbg-notice-actions">{actions}</span>}
    </div>
  );
};
