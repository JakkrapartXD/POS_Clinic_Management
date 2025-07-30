"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Category {
  id: string
  name: string
}

interface CategoryTabsProps {
  categories: Category[]
  defaultValue?: string
  onValueChange?: (value: string) => void
}

export default function CategoryTabs({ categories, defaultValue = "all", onValueChange }: CategoryTabsProps) {
  return (
    <Tabs defaultValue={defaultValue} onValueChange={onValueChange} className="mb-4">
      <TabsList className="w-full overflow-auto">
        {categories.map((category) => (
          <TabsTrigger key={category.id} value={category.id} className="text-xs">
            {category.name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
