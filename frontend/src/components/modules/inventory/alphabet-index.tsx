"use client"

import { useMemo } from "react"

type AlphabetMode = 'english' | 'thai' | 'numbers'

interface AlphabetIndexProps {
  alphabetMode: AlphabetMode
  selectedLetter: string
  onLetterSelect: (letter: string) => void
  onModeSwitch: () => void
  groupedProducts: Record<string, any[]>
}

export default function AlphabetIndex({
  alphabetMode,
  selectedLetter,
  onLetterSelect,
  onModeSwitch,
  groupedProducts
}: AlphabetIndexProps) {
  const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
  const thaiLetters = ["ก", "ข", "ค", "ง", "จ", "ฉ", "ช", "ซ", "ฌ", "ญ", "ด", "ต", "ท", "ธ", "น", "บ", "ป", "ผ", "ฝ", "พ", "ฟ", "ภ", "ม", "ย", "ร", "ล", "ว", "ศ", "ษ", "ส", "ห", "ฬ", "อ", "ฮ"]
  const numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
  
  const getCurrentSections = () => {
    switch (alphabetMode) {
      case 'english': return alphabet
      case 'thai': return thaiLetters
      case 'numbers': return numbers
      default: return alphabet
    }
  }

  const currentSections = getCurrentSections()

  // Get sections that have products (from current mode)
  const availableSections = useMemo(() => {
    const sections = Object.keys(groupedProducts)
    return currentSections.filter(section => sections.includes(section))
  }, [groupedProducts, currentSections])

  const getModeLabel = () => {
    switch (alphabetMode) {
      case 'english': return 'A-Z'
      case 'thai': return 'ก-ฮ'
      case 'numbers': return '0-9'
      default: return 'A-Z'
    }
  }

  return (
    <div className="w-16 bg-white border-r flex flex-col h-full">
      {/* Mode Indicator - Fixed */}
      <div className="p-2 border-b flex-shrink-0 text-center">
        <div className="text-xs font-medium text-gray-600">{getModeLabel()}</div>
      </div>

      {/* Alphabet List - Scrollable */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="space-y-1 px-2">
          <div 
            onClick={() => onLetterSelect("")}
            className={`text-xs px-2 py-1 cursor-pointer rounded transition-colors text-center ${
              !selectedLetter ? "bg-purple-100 text-purple-600" : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            ทั้งหมด
          </div>
          {currentSections.map((section) => {
            const hasProducts = availableSections.includes(section)
            return (
              <div 
                key={section}
                onClick={() => onLetterSelect(section)}
                className={`text-xs px-2 py-1 cursor-pointer rounded transition-colors text-center ${
                  selectedLetter === section 
                    ? "bg-purple-100 text-purple-600" 
                    : hasProducts 
                      ? "text-gray-700 hover:bg-gray-100 font-medium" 
                      : "text-gray-300"
                }`}
              >
                {section}
              </div>
            )
          })}
        </div>
      </div>

      {/* Mode Switcher - Fixed */}
      <div className="p-2 border-t flex-shrink-0">
        <div 
          onClick={onModeSwitch}
          className="text-xs px-2 py-1 cursor-pointer rounded transition-colors text-center text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          ···
        </div>
      </div>
    </div>
  )
}
