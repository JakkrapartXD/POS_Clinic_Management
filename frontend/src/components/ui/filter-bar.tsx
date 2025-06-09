"use client"

import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface FilterOption {
  id: string
  label: string
}

interface FilterBarProps {
  filters: {
    [key: string]: {
      name: string
      options: FilterOption[]
      selected: string[]
    }
  }
  onFilterChange: (filterType: string, value: string) => void
  onClearFilters: () => void
}

export default function FilterBar({ filters, onFilterChange, onClearFilters }: FilterBarProps) {
  const hasActiveFilters = Object.values(filters).some((filter) => filter.selected.length > 0)

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {Object.entries(filters).map(([filterType, filter]) => (
        <div key={filterType} className="flex flex-wrap gap-1">
          {filter.options.map((option) => (
            <Button
              key={option.id}
              variant={filter.selected.includes(option.id) ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange(filterType, option.id)}
              className="text-xs"
            >
              {option.label}
            </Button>
          ))}
        </div>
      ))}

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-xs ml-auto flex items-center">
          <X className="h-3 w-3 mr-1" />
          ล้างตัวกรอง
        </Button>
      )}
    </div>
  )
}
