"use client"

import type { LucideIcon } from "lucide-react"

interface AdminPageHeaderProps {
  title: string
  icon?: LucideIcon
  actions?: React.ReactNode
}

export function AdminPageHeader({ title, icon: Icon, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6 sm:mb-8">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <Icon className="w-5 h-5 text-red-500" />
          </div>
        )}
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
      </div>
      {actions && <div>{actions}</div>}
    </div>
  )
}
