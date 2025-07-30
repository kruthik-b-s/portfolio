import { User } from "lucide-react"

interface AvatarProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function Avatar({ size = "md", className = "" }: AvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center ${className}`}
    >
      <User className="w-1/2 h-1/2 text-white" />
    </div>
  )
}
