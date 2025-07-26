import React from "react";
import { METRIC_TYPES, SHARED_TOKENS, type MetricType } from "./shared-tokens";

/**
 * Shared compact header component for formatters
 */
export const CompactHeader: React.FC<{
  title: string;
  subtitle?: string;
  icon?: string;
  timestamp?: string;
  color?: string;
}> = React.memo(
  ({
    title,
    subtitle,
    icon,
    timestamp,
    color = SHARED_TOKENS.colors.accent,
  }) => {
    return (
      <div
        style={{
          marginBottom: SHARED_TOKENS.spacing.lg,
          padding: SHARED_TOKENS.spacing.lg,
          backgroundColor: SHARED_TOKENS.colors.bgSecondary,
          border: `1px solid ${SHARED_TOKENS.colors.border}`,
          borderRadius: SHARED_TOKENS.borderRadius.md,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "9px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: SHARED_TOKENS.spacing.sm,
            }}
          >
            {icon && (
              <span
                style={{
                  fontSize: "12px",
                  color: color,
                }}
              >
                {icon}
              </span>
            )}
            <div>
              <span
                style={{
                  color: color,
                  fontWeight: "600",
                  fontSize: "11px",
                }}
              >
                {title}
              </span>
              {subtitle && (
                <div
                  style={{
                    color: SHARED_TOKENS.colors.textMuted,
                    fontSize: "8px",
                    marginTop: "1px",
                  }}
                >
                  {subtitle}
                </div>
              )}
            </div>
          </div>
          {timestamp && (
            <span
              style={{
                color: SHARED_TOKENS.colors.textMuted,
                fontSize: "8px",
              }}
            >
              {timestamp}
            </span>
          )}
        </div>
      </div>
    );
  }
);

CompactHeader.displayName = "CompactHeader";

/**
 * Metric card component for dashboard display
 */
export const MetricCard: React.FC<{
  label: string;
  value: string | number;
  type?: MetricType;
  icon?: string;
  color?: string;
  isImportant?: boolean;
  subMetrics?: Array<{ label: string; value: string | number }>;
}> = React.memo(
  ({
    label,
    value,
    type = "count",
    icon,
    color,
    isImportant = false,
    subMetrics,
  }) => {
    const metricConfig = METRIC_TYPES[type];
    const displayColor = color || metricConfig.color;

    return (
      <div
        style={{
          background: SHARED_TOKENS.colors.bgSecondary,
          border: `1px solid ${SHARED_TOKENS.colors.border}`,
          borderRadius: SHARED_TOKENS.borderRadius.md,
          padding: SHARED_TOKENS.spacing.lg,
          position: "relative" as const,
        }}
      >
        {/* Importance indicator */}
        {isImportant && (
          <div
            style={{
              position: "absolute" as const,
              top: SHARED_TOKENS.spacing.xs,
              right: SHARED_TOKENS.spacing.xs,
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              background: displayColor,
            }}
          />
        )}

        {/* Main metric */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: SHARED_TOKENS.spacing.sm,
            marginBottom: subMetrics ? SHARED_TOKENS.spacing.sm : 0,
          }}
        >
          {icon && (
            <span
              style={{
                fontSize: "12px",
                color: displayColor,
              }}
            >
              {icon}
            </span>
          )}
          <div style={{ flex: 1 }}>
            <div
              style={{
                color: SHARED_TOKENS.colors.textSecondary,
                fontSize: "8px",
                textTransform: "uppercase" as const,
                letterSpacing: "0.5px",
                marginBottom: "2px",
              }}
            >
              {label}
            </div>
            <div
              style={{
                color: displayColor,
                fontSize: "12px",
                fontWeight: "600",
                fontFamily: SHARED_TOKENS.fonts.mono,
              }}
            >
              {value}
              {metricConfig.suffix}
            </div>
          </div>
        </div>

        {/* Sub-metrics */}
        {subMetrics && subMetrics.length > 0 && (
          <div
            style={{
              paddingTop: SHARED_TOKENS.spacing.sm,
              borderTop: `1px solid ${SHARED_TOKENS.colors.borderSecondary}`,
            }}
          >
            {subMetrics.map((sub, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: `${SHARED_TOKENS.spacing.xs} 0`,
                  fontSize: "8px",
                }}
              >
                <span style={{ color: SHARED_TOKENS.colors.textMuted }}>
                  {sub.label}
                </span>
                <span
                  style={{
                    color: SHARED_TOKENS.colors.textSecondary,
                    fontFamily: SHARED_TOKENS.fonts.mono,
                  }}
                >
                  {sub.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

MetricCard.displayName = "MetricCard";

/**
 * Dashboard grid layout component
 */
export const DashboardGrid: React.FC<{
  children: React.ReactNode;
  columns?: number;
}> = React.memo(({ children, columns = 3 }) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: SHARED_TOKENS.spacing.lg,
        marginBottom: SHARED_TOKENS.spacing.lg,
      }}
    >
      {children}
    </div>
  );
});

DashboardGrid.displayName = "DashboardGrid";

/**
 * Section container component
 */
export const SectionContainer: React.FC<{
  title: string;
  children: React.ReactNode;
  icon?: string;
  color?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}> = React.memo(
  ({
    title,
    children,
    icon,
    color = SHARED_TOKENS.colors.accent,
    collapsible = false,
    defaultExpanded = true,
  }) => {
    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

    return (
      <div
        style={{
          background: SHARED_TOKENS.colors.bgSecondary,
          border: `1px solid ${SHARED_TOKENS.colors.border}`,
          borderRadius: SHARED_TOKENS.borderRadius.lg,
          overflow: "hidden",
          marginBottom: SHARED_TOKENS.spacing.lg,
        }}
      >
        {/* Section Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: SHARED_TOKENS.spacing.md,
            padding: SHARED_TOKENS.spacing.lg,
            background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
            borderBottom: isExpanded
              ? `1px solid ${SHARED_TOKENS.colors.border}`
              : "none",
            cursor: collapsible ? "pointer" : "default",
            transition: "all 0.2s ease",
          }}
          onClick={collapsible ? () => setIsExpanded(!isExpanded) : undefined}
        >
          {icon && (
            <div
              style={{
                width: "20px",
                height: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: color,
                borderRadius: SHARED_TOKENS.borderRadius.md,
                fontSize: "10px",
                boxShadow: SHARED_TOKENS.shadows.sm,
              }}
            >
              {icon}
            </div>
          )}

          <span
            style={{
              color: SHARED_TOKENS.colors.text,
              fontWeight: "600",
              fontSize: "11px",
              fontFamily: SHARED_TOKENS.fonts.mono,
              textTransform: "uppercase" as const,
              letterSpacing: "0.5px",
              flex: 1,
            }}
          >
            {title}
          </span>

          {collapsible && (
            <div
              style={{
                color: SHARED_TOKENS.colors.textSecondary,
                fontSize: "10px",
                transition: "transform 0.2s ease",
                transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
              }}
            >
              ▶
            </div>
          )}
        </div>

        {/* Section Content */}
        {isExpanded && (
          <div
            style={{
              padding: SHARED_TOKENS.spacing.lg,
            }}
          >
            {children}
          </div>
        )}
      </div>
    );
  }
);

SectionContainer.displayName = "SectionContainer";

/**
 * Status indicator component
 */
export const StatusIndicator: React.FC<{
  status: "success" | "warning" | "error" | "info";
  label?: string;
  pulsing?: boolean;
}> = React.memo(({ status, label, pulsing = false }) => {
  const statusColors = {
    success: SHARED_TOKENS.colors.success,
    warning: SHARED_TOKENS.colors.warning,
    error: SHARED_TOKENS.colors.error,
    info: SHARED_TOKENS.colors.info,
  };

  const color = statusColors[status];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: SHARED_TOKENS.spacing.xs,
      }}
    >
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 0 2px ${color}20`,
          animation: pulsing ? "pulse 2s infinite" : "none",
        }}
      />
      {label && (
        <span
          style={{
            color: SHARED_TOKENS.colors.textSecondary,
            fontSize: "9px",
            fontFamily: SHARED_TOKENS.fonts.mono,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
});

StatusIndicator.displayName = "StatusIndicator";
