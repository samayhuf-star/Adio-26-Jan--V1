import * as React from "react"
import { cn } from "./utils"

interface TerminalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  showDots?: boolean
  badge?: React.ReactNode
  icon?: React.ReactNode
  headerActions?: React.ReactNode
  variant?: "default" | "compact"
}

const TerminalCard = React.forwardRef<HTMLDivElement, TerminalCardProps>(
  ({ className, title, showDots = true, badge, icon, headerActions, variant = "default", children, ...props }, ref) => {
    const padding = variant === "compact" ? "p-4" : "p-5"
    
    return (
      <div className="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 p-1 shadow-xl">
        <div
          ref={ref}
          className={cn("bg-slate-900 rounded-lg", padding, className)}
          {...props}
        >
          {(showDots || title || badge || headerActions) && (
            <div className="flex items-center gap-3 mb-4">
              {showDots && (
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                </div>
              )}
              {icon && <div className="text-slate-400">{icon}</div>}
              {title && <span className="text-slate-400 text-sm font-medium">{title}</span>}
              {badge && <div className="ml-auto">{badge}</div>}
              {headerActions && <div className="ml-auto flex items-center gap-2">{headerActions}</div>}
            </div>
          )}
          {children}
        </div>
      </div>
    )
  }
)
TerminalCard.displayName = "TerminalCard"

interface TerminalCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  mono?: boolean
}

const TerminalCardContent = React.forwardRef<HTMLDivElement, TerminalCardContentProps>(
  ({ className, mono = false, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(mono ? "font-mono text-sm" : "", className)}
      {...props}
    >
      {children}
    </div>
  )
)
TerminalCardContent.displayName = "TerminalCardContent"

interface TerminalLineProps extends React.HTMLAttributes<HTMLDivElement> {
  prefix?: string
  prefixColor?: "slate" | "green" | "yellow" | "cyan" | "purple"
  label?: string
  labelColor?: "slate" | "green" | "yellow" | "cyan" | "white" | "purple"
  value?: React.ReactNode
  valueColor?: "slate" | "green" | "yellow" | "cyan" | "white" | "purple"
}

const colorMap = {
  slate: "text-slate-500",
  green: "text-green-400",
  yellow: "text-yellow-400",
  cyan: "text-cyan-400",
  white: "text-white",
  purple: "text-purple-400"
}

const TerminalLine = React.forwardRef<HTMLDivElement, TerminalLineProps>(
  ({ className, prefix, prefixColor = "slate", label, labelColor = "green", value, valueColor = "white", children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center gap-2 font-mono text-sm", className)}
      {...props}
    >
      {prefix && <span className={colorMap[prefixColor]}>[{prefix}]</span>}
      {label && <span className={colorMap[labelColor]}>{label}</span>}
      {value && <span className={colorMap[valueColor]}>{value}</span>}
      {children}
    </div>
  )
)
TerminalLine.displayName = "TerminalLine"

interface TerminalSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
}

const TerminalSection = React.forwardRef<HTMLDivElement, TerminalSectionProps>(
  ({ className, title, description, children, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-3", className)} {...props}>
      {title && <h3 className="text-white font-semibold">{title}</h3>}
      {description && <p className="text-slate-400 text-sm">{description}</p>}
      {children}
    </div>
  )
)
TerminalSection.displayName = "TerminalSection"

export { TerminalCard, TerminalCardContent, TerminalLine, TerminalSection }
