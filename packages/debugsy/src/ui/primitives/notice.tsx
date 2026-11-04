"use client";

import type React from "react";

/** info: LED. ok: done. warn: amber. caution: pink (an error or a destructive step). neutral: dim. */
export type NoticeTone = "info" | "ok" | "warn" | "caution" | "neutral";

export interface NoticeProps {
  children: React.ReactNode;
  tone?: NoticeTone;
  /** Makes the whole line a button */
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
  const body = (
    <>
      <span className="dbg-notice-body">{children}</span>
      {actions && <span className="dbg-notice-actions">{actions}</span>}
    </>
  );
  if (onClick && !actions) {
    return (
      <button type="button" className={cls} data-tone={toneAttr} onClick={onClick} title={title}>
        {body}
      </button>
    );
  }
  return (
    <div className={cls} data-tone={toneAttr} title={title} role="status">
      {body}
    </div>
  );
};
