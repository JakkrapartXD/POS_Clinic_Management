"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Plus,
  Import as FileImport,
  FileOutput as FileExport,
  Trash2,
  Barcode,
  Tag,
  Clipboard,
} from "lucide-react"

type AlphabetMode = 'english' | 'thai' | 'numbers'

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLetter, setSelectedLetter] = useState<string>("")
  const [alphabetMode, setAlphabetMode] = useState<AlphabetMode>('english')

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

  const allSections = [...numbers, ...alphabet, ...thaiLetters]
  const currentSections = getCurrentSections()

  const products = [
    { id: 1, letter: "3", name: "3M Futuro Ankle Size M", variant: "BX", stock: 4, status: "4 BX", price: 290 },
    {
      id: 2,
      letter: "G",
      name: "Gaviscon Suspension รสเปปเปอร์มินต์",
      variant: "ซอง ชาย 10 ซอง",
      stock: 8,
      status: "ซอง",
      price: 29,
    },
    {
      id: 3,
      letter: "G",
      name: "Gaviscon Suspension รสเปปเปอร์มินต์", 
      variant: "กล่อง(4)",
      stock: 12,
      status: "กล่อง(4)",
      price: 94,
    },
    { 
      id: 4, 
      letter: "ช", 
      name: "ชาร่า ยาเม็ดบรรเทาปวด ลดไข้", 
      variant: "พาราเซตามอล 500mg", 
      stock: 10, 
      status: "แผง", 
      price: 9 
    },
    { 
      id: 5, 
      letter: "ช", 
      name: "ชาร่า ยาเม็ดบรรเทาปวด ลดไข้", 
      variant: "กล่อง", 
      stock: 8, 
      status: "กล่อง", 
      price: 180 
    },
    { 
      id: 6, 
      letter: "ย", 
      name: "ยาแก้อักเสบ อีตัว XXXX", 
      variant: "แผง", 
      stock: 0, 
      status: "แผง", 
      price: 18 
    },
  ]

  // Group products by first letter
  const groupedProducts = useMemo(() => {
    const filtered = products.filter((product) => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (!selectedLetter || product.letter === selectedLetter)
    )
    
    const grouped = filtered.reduce((acc, product) => {
      const letter = product.letter
      if (!acc[letter]) {
        acc[letter] = []
      }
      acc[letter].push(product)
      return acc
    }, {} as Record<string, typeof products>)
    
    return grouped
  }, [searchQuery, selectedLetter])

  // Get sections that have products (from current mode)
  const availableSections = useMemo(() => {
    const sections = Object.keys(groupedProducts)
    return currentSections.filter(section => sections.includes(section))
  }, [groupedProducts, currentSections])

  const totalProducts = Object.values(groupedProducts).flat().length

  const handleModeSwitch = () => {
    const modes: AlphabetMode[] = ['english', 'thai', 'numbers']
    const currentIndex = modes.indexOf(alphabetMode)
    const nextIndex = (currentIndex + 1) % modes.length
    setAlphabetMode(modes[nextIndex])
    setSelectedLetter("") // Reset selection when switching modes
  }

  const getModeLabel = () => {
    switch (alphabetMode) {
      case 'english': return 'A-Z'
      case 'thai': return 'ก-ฮ'
      case 'numbers': return '0-9'
      default: return 'A-Z'
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left Sidebar - Product List */}
      <div className="w-80 bg-white border-r flex flex-col h-full">
        {/* Search Section - Fixed */}
        <div className="p-4 border-b flex-shrink-0">
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
            <Input
              placeholder="ค้นหาสินค้าจากรายชื่อ หรือรวมรหัสโค้ด..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm border-gray-200"
            />
          </div>
        </div>

        {/* Stock Count - Fixed */}
        <div className="p-4 border-b flex-shrink-0">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">{totalProducts}</div>
            <div className="text-sm text-gray-500">รายการสินค้า</div>
          </div>
        </div>

        {/* Product List with Sections - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {Object.entries(groupedProducts).length > 0 ? (
            Object.entries(groupedProducts).map(([letter, products]) => (
              <div key={letter} className="border-b border-gray-100">
                {/* Section Header */}
                <div className="sticky top-0 bg-gray-50 px-4 py-2 border-b z-10">
                  <h3 className="font-medium text-gray-700 text-lg">{letter}</h3>
                </div>
                
                {/* Products in Section */}
                <div className="space-y-1 p-2">
                  {products.map((product) => (
                    <div 
                      key={product.id} 
                      className="p-3 hover:bg-gray-50 rounded-lg border border-gray-100 bg-white cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">{product.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{product.variant}</div>
                          <div className="text-xs text-gray-400 mt-1">{product.status}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-purple-600">฿{product.price}</div>
                          <div className="w-4 h-4 border border-gray-300 mt-1"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <div className="text-lg mb-2">ไม่พบสินค้า</div>
              <div className="text-sm">ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น</div>
            </div>
          )}
        </div>
      </div>

      {/* Alphabet Index - Fixed width */}
      <div className="w-16 bg-white border-r flex flex-col h-full">
        {/* Mode Indicator - Fixed */}
        <div className="p-2 border-b flex-shrink-0 text-center">
          <div className="text-xs font-medium text-gray-600">{getModeLabel()}</div>
        </div>

        {/* Alphabet List - Scrollable */}
        <div className="flex-1 overflow-y-auto py-2">
          <div className="space-y-1 px-2">
            <div 
              onClick={() => setSelectedLetter("")}
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
                  onClick={() => setSelectedLetter(section)}
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
            onClick={handleModeSwitch}
            className="text-xs px-2 py-1 cursor-pointer rounded transition-colors text-center text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            ···
          </div>
        </div>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header - Fixed */}
        <div className="bg-white border-b p-6 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-700">สต็อกสินค้า</h1>
            <Button className="text-purple-500 bg-white hover:bg-purple-50 border border-purple-200">
              ตัวเลือก
            </Button>
          </div>
        </div>

        {/* Action Cards - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="grid grid-cols-3 gap-6">
              <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-8 text-center">
                  <Plus className="h-12 w-12 text-purple-500 mb-4 mx-auto" />
                  <div className="text-purple-500 font-medium mb-2 text-lg">เพิ่มสินค้าใหม่</div>
                  <div className="text-gray-500 text-sm">Create New Item</div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-8 text-center">
                  <FileImport className="h-12 w-12 text-purple-500 mb-4 mx-auto" />
                  <div className="text-purple-500 font-medium mb-2 text-lg">เพิ่มชุดสินค้า/นำเข้า/แก้ไข</div>
                  <div className="text-gray-500 text-sm">Import</div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-8 text-center">
                  <FileExport className="h-12 w-12 text-purple-500 mb-4 mx-auto" />
                  <div className="text-purple-500 font-medium mb-2 text-lg">ส่งออกยอดสินค้า</div>
                  <div className="text-gray-500 text-sm">Export</div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-8 text-center">
                  <Trash2 className="h-12 w-12 text-purple-500 mb-4 mx-auto" />
                  <div className="text-purple-500 font-medium mb-2 text-lg">ลบสินค้า</div>
                  <div className="text-gray-500 text-sm">Remove Product</div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-8 text-center">
                  <Barcode className="h-12 w-12 text-purple-500 mb-4 mx-auto" />
                  <div className="text-purple-500 font-medium mb-2 text-lg">พิมพ์บาร์โค้ด</div>
                  <div className="text-gray-500 text-sm">Barcode</div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-8 text-center">
                  <Tag className="h-12 w-12 text-purple-500 mb-4 mx-auto" />
                  <div className="text-purple-500 font-medium mb-2 text-lg">พิมพ์ป้ายราคาสินค้า</div>
                  <div className="text-gray-500 text-sm">Price Tag</div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-8 text-center">
                  <Tag className="h-12 w-12 text-purple-500 mb-4 mx-auto" />
                  <div className="text-purple-500 font-medium mb-2 text-lg">พิมพ์ฉลากยา</div>
                  <div className="text-gray-500 text-sm">Label</div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-8 text-center">
                  <Clipboard className="h-12 w-12 text-purple-500 mb-4 mx-auto" />
                  <div className="text-purple-500 font-medium mb-2 text-lg">รายงานรับเข้า/ออกของสินค้า</div>
                  <div className="text-gray-500 text-sm">Product IN/OUT Report</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
