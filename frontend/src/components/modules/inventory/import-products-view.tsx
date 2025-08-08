"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, Download, CheckCircle, AlertTriangle, Info, RefreshCw } from "lucide-react"
import { parseCSV, createImportPreview, readFileAsText, downloadCSVTemplate } from "@/utils/csv-parser"
import { ImportPreviewResult, ImportSettings } from "@/types/csv-import"
import { GraphQLAPI } from "@/clients/graphql"
import { logger } from "@/lib/logger"

interface ImportProductsViewProps {
  onBack: () => void
  onImport: (data: any) => void
}

export default function ImportProductsView({ onBack, onImport }: ImportProductsViewProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [previewResult, setPreviewResult] = useState<ImportPreviewResult | null>(null)
  const [importResult, setImportResult] = useState<any>(null)
  const [notes, setNotes] = useState("")
  const [importSettings, setImportSettings] = useState<ImportSettings>({
    skipDuplicates: true,
    updateExisting: false,
    createBackup: true
  })

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleFileSelect = async (file: File) => {
    setUploadedFile(file)
    setPreviewResult(null)
    setImportResult(null)
    
    // Auto-process file for preview
    await processFile(file)
  }

  const processFile = async (file: File) => {
    setIsProcessing(true)
    try {
      logger.info('Processing CSV file', { fileName: file.name, size: file.size }, 'IMPORT')
      
      const content = await readFileAsText(file)
      const csvData = parseCSV(content)
      const preview = createImportPreview(csvData)
      
      setPreviewResult(preview)
      logger.info('CSV preview generated', { 
        totalRows: preview.summary.totalRows,
        validRows: preview.summary.validRows,
        invalidRows: preview.summary.invalidRows
      }, 'IMPORT')
      
    } catch (error) {
      logger.error('Failed to process CSV file', error, 'IMPORT')
      alert('เกิดข้อผิดพลาดในการประมวลผลไฟล์: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImport = async () => {
    if (!previewResult || previewResult.validRows.length === 0) {
      alert('ไม่มีข้อมูลที่ถูกต้องสำหรับการนำเข้า')
      return
    }

    setIsImporting(true)
    try {
      logger.info('Starting bulk import', { 
        validRows: previewResult.validRows.length,
        settings: importSettings 
      }, 'IMPORT')
      
      const result = await GraphQLAPI.bulkImportProducts(previewResult.validRows, importSettings)
      
      setImportResult(result.bulkImportProducts)
      logger.info('Bulk import completed', result.bulkImportProducts, 'IMPORT')
      
      // Call parent onImport with result
      onImport({
        file: uploadedFile,
        settings: importSettings,
        result: result.bulkImportProducts
      })
      
    } catch (error) {
      logger.error('Bulk import failed', error, 'IMPORT')
      alert('เกิดข้อผิดพลาดในการนำเข้าข้อมูล: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsImporting(false)
    }
  }

  const handleDownloadTemplate = () => {
    downloadCSVTemplate()
    logger.info('CSV template downloaded', {}, 'IMPORT')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">เพิ่มชุดสินค้า/นำเข้า/แก้ไข</h2>
        <p className="text-gray-600">นำเข้าข้อมูลสินค้าจากไฟล์ Excel หรือ CSV</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              อัปโหลดไฟล์
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-purple-400 bg-purple-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {uploadedFile ? (
                <div className="space-y-2">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                  <p className="text-sm font-medium text-gray-700">{uploadedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setUploadedFile(null)}
                  >
                    เปลี่ยนไฟล์
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      ลากไฟล์มาวางที่นี่ หรือ
                    </p>
                    <label className="cursor-pointer">
                      <span className="text-purple-600 hover:text-purple-700 font-medium">
                        เลือกไฟล์
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    รองรับไฟล์ Excel (.xlsx, .xls) และ CSV
                  </p>
                </div>
              )}
            </div>

            {/* Download Template */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">ไม่มีแม่แบบ?</p>
                  <p className="text-xs text-gray-500">ดาวน์โหลดไฟล์ตัวอย่างสำหรับการนำเข้า</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                  <Download className="h-4 w-4 mr-1" />
                  ดาวน์โหลดแม่แบบ
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Import Settings */}
        <Card>
          <CardHeader>
            <CardTitle>ตั้งค่าการนำเข้า</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="skipDuplicates"
                  checked={importSettings.skipDuplicates}
                  onChange={(e) => setImportSettings(prev => ({
                    ...prev,
                    skipDuplicates: e.target.checked
                  }))}
                  className="rounded"
                />
                <Label htmlFor="skipDuplicates" className="text-sm">
                  ข้ามสินค้าที่ซ้ำกัน
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="updateExisting"
                  checked={importSettings.updateExisting}
                  onChange={(e) => setImportSettings(prev => ({
                    ...prev,
                    updateExisting: e.target.checked
                  }))}
                  className="rounded"
                />
                <Label htmlFor="updateExisting" className="text-sm">
                  อัปเดตสินค้าที่มีอยู่แล้ว
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="createBackup"
                  checked={importSettings.createBackup}
                  onChange={(e) => setImportSettings(prev => ({
                    ...prev,
                    createBackup: e.target.checked
                  }))}
                  className="rounded"
                />
                <Label htmlFor="createBackup" className="text-sm">
                  สร้างข้อมูลสำรองก่อนนำเข้า
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm">หมายเหตุ (ไม่บังคับ)</Label>
              <Textarea
                id="notes"
                placeholder="เพิ่มหมายเหตุสำหรับการนำเข้าครั้งนี้..."
                className="h-20"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-3">
              <RefreshCw className="h-5 w-5 animate-spin text-purple-500" />
              <span className="text-gray-600">กำลังประมวลผลไฟล์...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Section */}
      {previewResult && !isProcessing && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>ตัวอย่างข้อมูล</span>
              <div className="flex space-x-4 text-sm">
                <span className="text-green-600">ถูกต้อง: {previewResult.summary.validRows}</span>
                <span className="text-red-600">ผิดพลาด: {previewResult.summary.invalidRows}</span>
                <span className="text-gray-600">รวม: {previewResult.summary.totalRows}</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{previewResult.summary.validRows}</div>
                <div className="text-sm text-green-700">รายการถูกต้อง</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{previewResult.summary.invalidRows}</div>
                <div className="text-sm text-red-700">รายการผิดพลาด</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-600">{previewResult.summary.totalRows}</div>
                <div className="text-sm text-gray-700">รายการทั้งหมด</div>
              </div>
            </div>

            {/* Valid Rows Preview */}
            {previewResult.validRows.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">ตัวอย่างรายการที่ถูกต้อง</h4>
                <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">ชื่อสินค้า</th>
                        <th className="text-left p-2">ราคาขาย</th>
                        <th className="text-left p-2">หน่วย</th>
                        <th className="text-left p-2">สต็อก</th>
                        <th className="text-left p-2">SKU</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewResult.validRows.slice(0, 5).map((row, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{row.product_name}</td>
                          <td className="p-2">฿{row.sale_price}</td>
                          <td className="p-2">{row.unit || '-'}</td>
                          <td className="p-2">{row.stock_quantity || 0}</td>
                          <td className="p-2">{row.sku || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewResult.validRows.length > 5 && (
                    <div className="text-center text-gray-500 text-xs mt-2">
                      และอีก {previewResult.validRows.length - 5} รายการ
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Invalid Rows */}
            {previewResult.invalidRows.length > 0 && (
              <div>
                <h4 className="font-medium text-red-700 mb-2">รายการที่มีข้อผิดพลาด</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {previewResult.invalidRows.slice(0, 10).map((row, index) => (
                    <Alert key={index} className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700">
                        <div className="font-medium">แถวที่ {row.row}: {row.data['ชื่อสินค้า'] || 'ไม่ระบุชื่อ'}</div>
                        <div className="text-sm">
                          {row.errors.map((error, errorIndex) => (
                            <div key={errorIndex}>• {error.message}</div>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                  {previewResult.invalidRows.length > 10 && (
                    <div className="text-center text-gray-500 text-xs">
                      และอีก {previewResult.invalidRows.length - 10} รายการที่มีข้อผิดพลาด
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Result */}
      {importResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className={`flex items-center ${importResult.success ? 'text-green-600' : 'text-orange-600'}`}>
              {importResult.success ? <CheckCircle className="h-5 w-5 mr-2" /> : <AlertTriangle className="h-5 w-5 mr-2" />}
              ผลลัพธ์การนำเข้า
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className={importResult.success ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
                <Info className="h-4 w-4" />
                <AlertDescription className={importResult.success ? 'text-green-700' : 'text-orange-700'}>
                  {importResult.message}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{importResult.imported}</div>
                  <div className="text-sm text-green-700">นำเข้าสำเร็จ</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                  <div className="text-sm text-red-700">นำเข้าไม่สำเร็จ</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-600">{importResult.skipped}</div>
                  <div className="text-sm text-yellow-700">ข้ามไป</div>
                </div>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-700 mb-2">ข้อผิดพลาด</h4>
                  <div className="bg-red-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                    {importResult.errors.map((error: string, index: number) => (
                      <div key={index} className="text-sm text-red-700">• {error}</div>
                    ))}
                  </div>
                </div>
              )}

              {importResult.results && importResult.results.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">รายละเอียด ({importResult.results.length} รายการ)</h4>
                  <div className="bg-gray-50 p-3 rounded-lg max-h-64 overflow-y-auto">
                    <div className="space-y-1 text-sm">
                      {importResult.results.slice(0, 20).map((result: any, index: number) => (
                        <div key={index} className="flex justify-between items-center">
                          <span>{result.product_name}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            result.status === 'CREATED' ? 'bg-green-100 text-green-700' :
                            result.status === 'UPDATED' ? 'bg-blue-100 text-blue-700' :
                            result.status === 'SKIPPED' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {result.status}
                          </span>
                        </div>
                      ))}
                      {importResult.results.length > 20 && (
                        <div className="text-center text-gray-500">
                          และอีก {importResult.results.length - 20} รายการ
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="outline" onClick={onBack}>
          ยกเลิก
        </Button>
        <Button 
          onClick={handleImport}
          disabled={!previewResult || previewResult.validRows.length === 0 || isImporting}
          className="bg-purple-500 hover:bg-purple-600"
        >
          {isImporting ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              กำลังนำเข้า...
            </>
          ) : (
            `เริ่มการนำเข้า (${previewResult?.validRows.length || 0} รายการ)`
          )}
        </Button>
      </div>
    </div>
  )
}
