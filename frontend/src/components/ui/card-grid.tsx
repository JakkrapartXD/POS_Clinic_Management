import type React from "react"
interface CardGridProps {
  children: React.ReactNode
  columns?: {
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: "none" | "xs" | "sm" | "md" | "lg"
}

export default function CardGrid({ children, columns = { sm: 1, md: 2, lg: 3, xl: 4 }, gap = "md" }: CardGridProps) {
  const getColumnsClass = () => {
    const classes = []

    if (columns.sm) classes.push(`grid-cols-${columns.sm}`)
    if (columns.md) classes.push(`md:grid-cols-${columns.md}`)
    if (columns.lg) classes.push(`lg:grid-cols-${columns.lg}`)
    if (columns.xl) classes.push(`xl:grid-cols-${columns.xl}`)

    return classes.join(" ")
  }

  const getGapClass = () => {
    switch (gap) {
      case "none":
        return "gap-0"
      case "xs":
        return "gap-2"
      case "sm":
        return "gap-3"
      case "lg":
        return "gap-6"
      case "md":
      default:
        return "gap-4"
    }
  }

  return <div className={`grid ${getColumnsClass()} ${getGapClass()}`}>{children}</div>
}
