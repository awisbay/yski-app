import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string | number
  icon?: LucideIcon
  trend?: number // percent change vs last period
  description?: string
  loading?: boolean
  className?: string
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  loading,
  className,
}: MetricCardProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    )
  }

  const trendUp = trend !== undefined && trend > 0
  const trendDown = trend !== undefined && trend < 0

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        {Icon && (
          <div className="p-2 bg-emerald-50 rounded-lg">
            <Icon className="h-4 w-4 text-emerald-600" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {(trend !== undefined || description) && (
          <div className="flex items-center gap-1 mt-1">
            {trend !== undefined && (
              <>
                {trendUp && <TrendingUp className="h-3 w-3 text-emerald-600" />}
                {trendDown && <TrendingDown className="h-3 w-3 text-red-500" />}
                <span
                  className={cn(
                    "text-xs font-medium",
                    trendUp && "text-emerald-600",
                    trendDown && "text-red-500",
                    !trendUp && !trendDown && "text-gray-500"
                  )}
                >
                  {trend > 0 ? "+" : ""}{trend?.toFixed(1)}%
                </span>
              </>
            )}
            {description && (
              <span className="text-xs text-gray-500">{description}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
