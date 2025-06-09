"use client"

interface ProductAlphabetSidebarProps {
  activeLetters: string[]
  count: number
  onLetterClick?: (letter: string) => void
}

export default function ProductAlphabetSidebar({ activeLetters, count, onLetterClick }: ProductAlphabetSidebarProps) {
  const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))

  return (
    <div className="w-12 border-r">
      <div className="flex flex-col items-center">
        <div className="text-sm font-medium mb-2">{count}</div>
        {alphabet.map((letter) => (
          <div
            key={letter}
            className={`text-xs ${activeLetters.includes(letter) ? "text-purple-600 font-medium" : "text-gray-500"} py-1 cursor-pointer`}
            onClick={() => onLetterClick && onLetterClick(letter)}
          >
            {letter}
          </div>
        ))}
        <div className="text-xs text-gray-500 py-1">--</div>
      </div>
    </div>
  )
}
