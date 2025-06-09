import type React from "react"
interface PageContainerProps {
  children: React.ReactNode
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "full"
}

export default function PageContainer({ children, maxWidth = "xl" }: PageContainerProps) {
  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case "xs":
        return "max-w-xs"
      case "sm":
        return "max-w-sm"
      case "md":
        return "max-w-md"
      case "lg":
        return "max-w-lg"
      case "xl":
        return "max-w-xl"
      case "2xl":
        return "max-w-2xl"
      case "full":
        return "max-w-full"
      default:
        return "max-w-xl"
    }
  }

  return <div className={`w-full ${getMaxWidthClass()} mx-auto p-4 md:p-6`}>{children}</div>
}
