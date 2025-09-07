"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowLeft, 
  Download, 
  Upload, 
  Database, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Settings,
  Calendar,
  HardDrive,
  Shield,
  RefreshCw
} from "lucide-react"
import Link from "next/link"
import PageGuard from "@/components/guards/page-guard"
import { logger } from "@/lib/logger"

interface BackupStatus {
  id: string
  type: 'full' | 'incremental'
  status: 'running' | 'completed' | 'failed'
  progress: number
  startTime: Date
  endTime?: Date
  size?: string
  error?: string
}

export default function DataBackupPage() {
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true)
  const [backupSchedule, setBackupSchedule] = useState("daily")
  const [backupTime, setBackupTime] = useState("02:00")
  const [retentionDays, setRetentionDays] = useState("30")
  const [isBackupRunning, setIsBackupRunning] = useState(false)
  const [backupProgress, setBackupProgress] = useState(0)
  const [backupHistory, setBackupHistory] = useState<BackupStatus[]>([])

  useEffect(() => {
    // Load backup history
    loadBackupHistory()
  }, [])

  const loadBackupHistory = async () => {
    try {
      // Mock data for demonstration
      const mockHistory: BackupStatus[] = [
        {
          id: "1",
          type: "full",
          status: "completed",
          progress: 100,
          startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() - 24 * 60 * 60 * 1000 + 5 * 60 * 1000),
          size: "125 MB"
        },
        {
          id: "2",
          type: "incremental",
          status: "completed",
          progress: 100,
          startTime: new Date(Date.now() - 12 * 60 * 60 * 1000),
          endTime: new Date(Date.now() - 12 * 60 * 60 * 1000 + 2 * 60 * 1000),
          size: "15 MB"
        },
        {
          id: "3",
          type: "full",
          status: "failed",
          progress: 45,
          startTime: new Date(Date.now() - 48 * 60 * 60 * 1000),
          error: "Connection timeout"
        }
      ]
      setBackupHistory(mockHistory)
    } catch (error) {
      logger.error('Failed to load backup history', error, 'SETTINGS')
    }
  }

  const handleManualBackup = async (type: 'full' | 'incremental') => {
    try {
      setIsBackupRunning(true)
      setBackupProgress(0)
      
      logger.info('Starting manual backup', { type }, 'BACKUP')
      
      // Simulate backup progress
      const interval = setInterval(() => {
        setBackupProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            setIsBackupRunning(false)
            
            // Add to history
            const newBackup: BackupStatus = {
              id: Date.now().toString(),
              type,
              status: 'completed',
              progress: 100,
              startTime: new Date(Date.now() - 30000),
              endTime: new Date(),
              size: type === 'full' ? '120 MB' : '8 MB'
            }
            setBackupHistory(prev => [newBackup, ...prev])
            
            logger.info('Manual backup completed', { type, size: newBackup.size }, 'BACKUP')
            alert(`${type === 'full' ? 'การสำรองข้อมูลแบบเต็ม' : 'การสำรองข้อมูลแบบเพิ่มเติม'}เสร็จสิ้น`)
            return 100
          }
          return prev + 10
        })
      }, 500)
      
    } catch (error) {
      logger.error('Manual backup failed', error, 'BACKUP')
      setIsBackupRunning(false)
      setBackupProgress(0)
      alert('การสำรองข้อมูลล้มเหลว')
    }
  }

  const handleRestoreBackup = async (backupId: string) => {
    if (!confirm('คุณต้องการกู้คืนข้อมูลจากการสำรองนี้หรือไม่? การดำเนินการนี้จะเขียนทับข้อมูลปัจจุบัน')) {
      return
    }
    
    try {
      logger.info('Starting data restore', { backupId }, 'BACKUP')
      alert('เริ่มกู้คืนข้อมูล...')
      // Implementation for restore would go here
    } catch (error) {
      logger.error('Data restore failed', error, 'BACKUP')
      alert('การกู้คืนข้อมูลล้มเหลว')
    }
  }

  const handleDownloadBackup = async (backupId: string) => {
    try {
      logger.info('Downloading backup', { backupId }, 'BACKUP')
      alert('เริ่มดาวน์โหลดไฟล์สำรองข้อมูล...')
      // Implementation for download would go here
    } catch (error) {
      logger.error('Backup download failed', error, 'BACKUP')
      alert('การดาวน์โหลดล้มเหลว')
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const formatDuration = (start: Date, end?: Date) => {
    if (!end) return '-'
    const diff = end.getTime() - start.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <PageGuard requiredPermission="settings">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Link href="/dashboard/settings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold">การสำรองข้อมูล</h1>
            <p className="text-sm text-gray-500">จัดการการสำรองและกู้คืนข้อมูลระบบ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Auto Backup Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>การตั้งค่าการสำรองอัตโนมัติ</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enable Auto Backup */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">เปิดใช้งานการสำรองอัตโนมัติ</Label>
                    <p className="text-xs text-gray-500 mt-1">ระบบจะสำรองข้อมูลตามกำหนดเวลาที่ตั้งไว้</p>
                  </div>
                  <Switch 
                    checked={autoBackupEnabled}
                    onCheckedChange={setAutoBackupEnabled}
                  />
                </div>

                <Separator />

                {/* Backup Schedule */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">ความถี่ในการสำรอง</Label>
                    <Select value={backupSchedule} onValueChange={setBackupSchedule}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">ทุกชั่วโมง</SelectItem>
                        <SelectItem value="daily">ทุกวัน</SelectItem>
                        <SelectItem value="weekly">ทุกสัปดาห์</SelectItem>
                        <SelectItem value="monthly">ทุกเดือน</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">เวลาที่สำรอง</Label>
                    <Input
                      type="time"
                      value={backupTime}
                      onChange={(e) => setBackupTime(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">เก็บข้อมูลสำรอง (วัน)</Label>
                    <Input
                      type="number"
                      value={retentionDays}
                      onChange={(e) => setRetentionDays(e.target.value)}
                      min="1"
                      max="365"
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">ข้อมูลสำรองที่เก่ากว่านี้จะถูกลบอัตโนมัติ</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>บันทึกการตั้งค่า</Button>
                </div>
              </CardContent>
            </Card>

            {/* Manual Backup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>การสำรองข้อมูลด้วยตนเอง</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isBackupRunning && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">กำลังสำรองข้อมูล...</span>
                    </div>
                    <Progress value={backupProgress} className="w-full" />
                    <p className="text-xs text-blue-600 mt-1">{backupProgress}% เสร็จสิ้น</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    onClick={() => handleManualBackup('full')}
                    disabled={isBackupRunning}
                    className="h-20 flex-col"
                  >
                    <Database className="h-6 w-6 mb-2" />
                    <span>สำรองข้อมูลแบบเต็ม</span>
                    <span className="text-xs opacity-75">Full Backup</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => handleManualBackup('incremental')}
                    disabled={isBackupRunning}
                    className="h-20 flex-col"
                  >
                    <HardDrive className="h-6 w-6 mb-2" />
                    <span>สำรองข้อมูลแบบเพิ่มเติม</span>
                    <span className="text-xs opacity-75">Incremental Backup</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Backup History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>ประวัติการสำรองข้อมูล</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {backupHistory.map((backup) => (
                    <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${
                          backup.status === 'completed' ? 'bg-green-100' :
                          backup.status === 'failed' ? 'bg-red-100' : 'bg-blue-100'
                        }`}>
                          {backup.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : backup.status === 'failed' ? (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          ) : (
                            <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={backup.type === 'full' ? 'default' : 'secondary'}>
                              {backup.type === 'full' ? 'เต็ม' : 'เพิ่มเติม'}
                            </Badge>
                            <span className="text-sm font-medium">
                              {formatDate(backup.startTime)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {backup.status === 'completed' && (
                              <>ขนาด: {backup.size} • ใช้เวลา: {formatDuration(backup.startTime, backup.endTime)}</>
                            )}
                            {backup.status === 'failed' && (
                              <span className="text-red-600">ล้มเหลว: {backup.error}</span>
                            )}
                            {backup.status === 'running' && (
                              <span className="text-blue-600">กำลังดำเนินการ... {backup.progress}%</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {backup.status === 'completed' && (
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadBackup(backup.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestoreBackup(backup.id)}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>สถานะระบบ</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">ฐานข้อมูล</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    ปกติ
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">พื้นที่จัดเก็บ</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    ปกติ
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">การสำรองล่าสุด</span>
                  <span className="text-xs text-gray-500">24 ชม. ที่แล้ว</span>
                </div>
              </CardContent>
            </Card>

            {/* Storage Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <HardDrive className="h-5 w-5" />
                  <span>พื้นที่จัดเก็บ</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>ใช้แล้ว</span>
                    <span>2.1 GB / 10 GB</span>
                  </div>
                  <Progress value={21} className="w-full" />
                </div>
                <div className="text-xs text-gray-500">
                  <p>• ฐานข้อมูล: 1.8 GB</p>
                  <p>• ไฟล์สำรอง: 250 MB</p>
                  <p>• รูปภาพ: 50 MB</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>การดำเนินการด่วน</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  กำหนดการสำรอง
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  ดาวน์โหลดทั้งหมด
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  ตั้งค่าขั้นสูง
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageGuard>
  )
}
