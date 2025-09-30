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
  RefreshCw,
  Cloud,
  FileText,
  Trash2,
  ExternalLink,
  Loader2,
  CloudOff
} from "lucide-react"
import Link from "next/link"
import PageGuard from "@/components/guards/page-guard"
import { logger } from "@/lib/logger"
import { BackupAPI, type GoogleDriveConfig, type BackupFile, type GoogleDriveStatus, type SchedulerConfig, type SchedulerStatus } from "@/clients/backup"
import toast from "react-hot-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"

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
  
  // Google Drive states
  const [googleDriveEnabled, setGoogleDriveEnabled] = useState(false)
  const [googleDriveStatus, setGoogleDriveStatus] = useState<GoogleDriveStatus>({ connected: false, configured: false })
  const [googleConfigJson, setGoogleConfigJson] = useState('')
  const [isConfiguring, setIsConfiguring] = useState(false)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [authUrl, setAuthUrl] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  
  // Backup data states
  const [localBackups, setLocalBackups] = useState<BackupFile[]>([])
  const [googleDriveBackups, setGoogleDriveBackups] = useState<BackupFile[]>([])
  const [backupStats, setBackupStats] = useState<{ totalLocalBackups: number; totalGoogleDriveBackups: number; totalLocalSize: number; lastBackupTime?: string }>({ totalLocalBackups: 0, totalGoogleDriveBackups: 0, totalLocalSize: 0 })
  
  // Scheduler states
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus>({ enabled: false, frequency: 'daily', time: '02:00', isRunning: false })
  const [schedulerConfig, setSchedulerConfig] = useState<SchedulerConfig>({
    enabled: false,
    frequency: 'daily',
    time: '02:00',
    uploadToGoogleDrive: false,
    keepLocalCopy: true,
    retentionDays: 30
  })

  useEffect(() => {
    // Load backup data
    const initializeData = async () => {
      await loadBackupData()
      await loadSchedulerStatus() // โหลด scheduler ก่อน
      await loadGoogleDriveStatus() // แล้วค่อยโหลด Google Drive
    }
    initializeData()
  }, [])

  const loadBackupData = async () => {
    try {
      const response = await BackupAPI.listBackups()
      if (response.success) {
        setLocalBackups(response.local)
        setGoogleDriveBackups(response.googleDrive)
        setBackupStats(response.stats)
        
        // Convert to legacy format for existing UI
        const combinedHistory: BackupStatus[] = [
          ...response.local.map(backup => ({
            id: backup.id,
            type: backup.type,
            status: 'completed' as const,
            progress: 100,
            startTime: new Date(backup.created),
            endTime: new Date(backup.created),
            size: BackupAPI.formatBytes(backup.size)
          })),
          ...response.googleDrive.map(backup => ({
            id: backup.id,
            type: backup.type,
            status: 'completed' as const,
            progress: 100,
            startTime: new Date(backup.created),
            endTime: new Date(backup.created),
            size: BackupAPI.formatBytes(backup.size)
          }))
        ]
        setBackupHistory(combinedHistory)
      }
    } catch (error) {
      logger.error('ไม่สามารถโหลดข้อมูลการสำรองได้', error as Error, 'SETTINGS')
    }
  }
  
  const loadGoogleDriveStatus = async () => {
    try {
      const status = await BackupAPI.getGoogleDriveStatus()
      setGoogleDriveStatus(status)
      setGoogleDriveEnabled(status.connected)
      
      // ถ้า Google Drive เชื่อมต่อแล้ว และ auto backup ยังปิดอยู่ ให้เปิดโดยอัตโนมัติ
      if (status.connected && !autoBackupEnabled) {
        setAutoBackupEnabled(true)
        // บันทึกการตั้งค่าโดยอัตโนมัติ
        const newConfig: Partial<SchedulerConfig> = {
          enabled: true,
          frequency: backupSchedule as any,
          time: backupTime,
          uploadToGoogleDrive: true,
          keepLocalCopy: true,
          retentionDays: parseInt(retentionDays)
        }
        
        try {
          const response = await BackupAPI.updateSchedulerConfig(newConfig)
          if (response.success) {
            await loadSchedulerStatus() // รีโหลดสถานะ
            logger.info('เปิดการสำรองอัตโนมัติโดยอัตโนมัติหลังเชื่อมต่อ Google Drive')
          }
        } catch (error) {
          logger.error('ไม่สามารถเปิดการสำรองอัตโนมัติหลังเชื่อมต่อ Google Drive', error as Error, 'SETTINGS')
        }
      }
    } catch (error) {
      logger.error('ไม่สามารถโหลดสถานะ Google Drive ได้', error as Error, 'SETTINGS')
    }
  }
  
  const loadSchedulerStatus = async () => {
    try {
      const response = await BackupAPI.getSchedulerStatus()
      if (response.success) {
        setSchedulerStatus(response.status)
        setSchedulerConfig(response.config)
        setAutoBackupEnabled(response.config.enabled)
        setBackupSchedule(response.config.frequency)
        setBackupTime(response.config.time)
        setRetentionDays(response.config.retentionDays.toString())
        setGoogleDriveEnabled(response.config.uploadToGoogleDrive && googleDriveStatus.connected)
      }
    } catch (error) {
      logger.error('ไม่สามารถโหลดสถานะตัวจัดตารางเวลาได้', error as Error, 'SETTINGS')
    }
  }
  
  const handleSaveSettings = async () => {
    try {
      const newConfig: Partial<SchedulerConfig> = {
        enabled: autoBackupEnabled,
        frequency: backupSchedule as any,
        time: backupTime,
        uploadToGoogleDrive: googleDriveEnabled,
        keepLocalCopy: true,
        retentionDays: parseInt(retentionDays)
      }
      
      const response = await BackupAPI.updateSchedulerConfig(newConfig)
      
      if (response.success) {
        toast.success('บันทึกการตั้งค่าเสร็จสิ้น!')
        await loadSchedulerStatus()
      } else {
        throw new Error(response.error || 'การบันทึกการตั้งค่าล้มเหลว')
      }
    } catch (error) {
      logger.error('ไม่สามารถบันทึกการตั้งค่าได้', error as Error, 'SETTINGS')
      toast.error(`การบันทึกการตั้งค่าล้มเหลว: ${(error as Error).message}`)
    }
  }

  const handleToggleScheduler = async (enabled: boolean) => {
    try {
      // อัพเดต state ก่อน
      setAutoBackupEnabled(enabled)
      
      // สร้าง config ใหม่
      const newConfig: Partial<SchedulerConfig> = {
        enabled: enabled,
        frequency: backupSchedule as any,
        time: backupTime,
        uploadToGoogleDrive: googleDriveEnabled,
        keepLocalCopy: true,
        retentionDays: parseInt(retentionDays)
      }
      
      // อัพเดต config ใน backend
      const response = await BackupAPI.updateSchedulerConfig(newConfig)
      
      if (response.success) {
        toast.success(`การสำรองอัตโนมัติ${enabled ? 'เปิด' : 'ปิด'}แล้ว!`)
        await loadSchedulerStatus()
      } else {
        // ถ้าล้มเหลว ให้ย้อนกลับ state
        setAutoBackupEnabled(!enabled)
        throw new Error(response.error || 'การเปลี่ยนสถานะการสำรองอัตโนมัติล้มเหลว')
      }
    } catch (error) {
      logger.error('ไม่สามารถเปลี่ยนสถานะตัวจัดตารางเวลาได้', error as Error, 'SETTINGS')
      toast.error(`การ${enabled ? 'เปิด' : 'ปิด'}การสำรองอัตโนมัติล้มเหลว: ${(error as Error).message}`)
    }
  }

  const handleTriggerScheduledBackup = async () => {
    try {
      const response = await BackupAPI.triggerScheduledBackup()
      
      if (response.success) {
        toast.success('เริ่มการสำรองข้อมูลตามตารางเวลาที่กำหนดแล้ว!')
        await loadBackupData() // รีโหลดข้อมูล backup
      } else {
        throw new Error(response.error || 'การเริ่มการสำรองตามตารางเวลาล้มเหลว')
      }
    } catch (error) {
      logger.error('ไม่สามารถเริ่มการสำรองตามตารางเวลาได้', error as Error, 'SETTINGS')
      toast.error(`การเริ่มการสำรองตามตารางเวลาล้มเหลว: ${(error as Error).message}`)
    }
  }

  const handleManualBackup = async (uploadToGoogleDrive: boolean = false) => {
    try {
      setIsBackupRunning(true)
      setBackupProgress(0)
      
      logger.info('Starting manual backup', { uploadToGoogleDrive }, 'BACKUP')
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setBackupProgress(prev => Math.min(prev + 5, 95))
      }, 200)
      
      const response = await BackupAPI.createBackup({
        uploadToGoogleDrive,
        keepLocalCopy: true
      })
      
      clearInterval(progressInterval)
      setBackupProgress(100)
      
      if (response.success) {
        toast.success(`การสำรองข้อมูลเสร็จสิ้น! ${uploadToGoogleDrive ? '(อัพโหลดไป Google Drive แล้ว)' : ''}`)
        await loadBackupData() // Reload backup list
      } else {
        throw new Error(response.error || 'การสำรองข้อมูลล้มเหลว')
      }
      
    } catch (error) {
      logger.error('การสำรองข้อมูลด้วยตนเองล้มเหลว', error as Error, 'BACKUP')
      toast.error(`การสำรองข้อมูลล้มเหลว: ${(error as Error).message}`)
    } finally {
      setIsBackupRunning(false)
      setBackupProgress(0)
    }
  }

  const handleRestoreBackup = async (type: 'local' | 'google-drive', backupId: string) => {
    if (!confirm('คุณต้องการกู้คืนข้อมูลจากการสำรองนี้หรือไม่? การดำเนินการนี้จะเขียนทับข้อมูลปัจจุบัน')) {
      return
    }
    
    try {
      logger.info('Starting data restore', { type, backupId }, 'BACKUP')
      
      const response = await BackupAPI.restoreBackup(type, backupId)
      
      if (response.success) {
        toast.success('กู้คืนข้อมูลเสร็จสิ้น!')
      } else {
        throw new Error(response.error || 'การกู้คืนข้อมูลล้มเหลว')
      }
    } catch (error) {
      logger.error('การกู้คืนข้อมูลล้มเหลว', error as Error, 'BACKUP')
      toast.error(`การกู้คืนข้อมูลล้มเหลว: ${(error as Error).message}`)
    }
  }

  const handleDownloadBackup = async (filename: string) => {
    try {
      logger.info('กำลังดาวน์โหลดไฟล์สำรอง', { filename }, 'BACKUP')
      await BackupAPI.triggerDownload(filename)
    } catch (error) {
      logger.error('การดาวน์โหลดไฟล์สำรองล้มเหลว', error as Error, 'BACKUP')
      toast.error(`การดาวน์โหลดล้มเหลว: ${(error as Error).message}`)
    }
  }
  
  const handleDeleteBackup = async (type: 'local' | 'google-drive', backupId: string) => {
    if (!confirm('คุณต้องการลบไฟล์สำรองข้อมูลนี้หรือไม่?')) {
      return
    }
    
    try {
      const response = await BackupAPI.deleteBackup(type, backupId)
      
      if (response.success) {
        toast.success('ลบไฟล์สำรองข้อมูลเสร็จสิ้น')
        await loadBackupData()
      } else {
        throw new Error(response.error || 'การลบไฟล์ล้มเหลว')
      }
      } catch (error) {
        logger.error('การลบไฟล์สำรองล้มเหลว', error as Error, 'BACKUP')
        toast.error(`การลบไฟล์ล้มเหลว: ${(error as Error).message}`)
      }
  }
  
  const handleConfigureGoogleDrive = async () => {
    try {
      setIsConfiguring(true)
      
      const config = JSON.parse(googleConfigJson) as GoogleDriveConfig
      const response = await BackupAPI.configureGoogleDrive(config)
      
      if (response.success && response.authUrl) {
        setAuthUrl(response.authUrl)
        setShowConfigDialog(false)
        setShowAuthDialog(true)
      } else {
        throw new Error(response.message || 'การตั้งค่า Google Drive ล้มเหลว')
      }
    } catch (error) {
      toast.error(`การตั้งค่า Google Drive ล้มเหลว: ${(error as Error).message}`)
    } finally {
      setIsConfiguring(false)
    }
  }
  
  const handleAuthorizeGoogleDrive = async () => {
    try {
      setIsConfiguring(true)
      
      const response = await BackupAPI.authorizeGoogleDrive(authCode)
      
      if (response.success) {
        toast.success('เชื่อมต่อ Google Drive เสร็จสิ้น!')
        setShowAuthDialog(false)
        setAuthCode('')
        await loadGoogleDriveStatus()
      } else {
        throw new Error(response.message || 'การยืนยัน Google Drive ล้มเหลว')
      }
    } catch (error) {
      toast.error(`การยืนยัน Google Drive ล้มเหลว: ${(error as Error).message}`)
    } finally {
      setIsConfiguring(false)
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

  // ฟังก์ชันแปลงวันที่จากชื่อไฟล์
  const extractDateFromFilename = (filename: string) => {
    try {
      // ตัวอย่างชื่อไฟล์: pharmacy_backup_2025-09-08T09-02-06-749Z.sql
      const match = filename.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/);
      if (match) {
        // แปลง 2025-09-08T09-02-06-749Z เป็น 2025-09-08T09:02:06.749Z
        const isoString = match[1].replace(/-(\d{2})-(\d{2})-(\d{3})Z$/, ':$1:$2.$3Z');
        return new Date(isoString);
      }
    } catch (error) {
      logger.debug('ไม่สามารถแยกวันที่จากชื่อไฟล์ได้:', filename);
    }
    return null;
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
                    onCheckedChange={handleToggleScheduler}
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

                <Separator />
                
                {/* Google Drive Integration */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">การเชื่อมต่อ Google Drive</Label>
                    <div className="flex items-center justify-between mt-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          googleDriveStatus.connected ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <span className="text-sm font-medium">
                            {googleDriveStatus.connected ? 'เชื่อมต่อแล้ว' : 'ไม่ได้เชื่อมต่อ'}
                          </span>
                          {googleDriveStatus.userInfo && (
                            <p className="text-xs text-gray-500">{googleDriveStatus.userInfo.email}</p>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowConfigDialog(true)}
                      >
                        {googleDriveStatus.connected ? 'จัดการ' : 'เชื่อมต่อ'}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">สำรองไปยัง Google Drive</Label>
                      <p className="text-xs text-gray-500 mt-1">อัพโหลดไฟล์สำรองไปยัง Google Drive อัตโนมัติ</p>
                    </div>
                    <Switch 
                      checked={googleDriveEnabled && googleDriveStatus.connected}
                      onCheckedChange={setGoogleDriveEnabled}
                      disabled={!googleDriveStatus.connected}
                    />
                  </div>

                  {googleDriveStatus.storageInfo && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm font-medium text-blue-900">พื้นที่จัดเก็บ Google Drive</div>
                      <div className="text-xs text-blue-700 mt-1">
                        ใช้แล้ว: {BackupAPI.formatBytes(parseInt(googleDriveStatus.storageInfo.usage))} / {BackupAPI.formatBytes(parseInt(googleDriveStatus.storageInfo.limit))}
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min((parseInt(googleDriveStatus.storageInfo.usage) / parseInt(googleDriveStatus.storageInfo.limit)) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    สถานะ: 
                    <span className={`font-medium ml-1 ${
                      schedulerStatus.enabled ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {schedulerStatus.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                    {schedulerStatus.enabled && schedulerStatus.nextRun && (
                      <span className="text-xs text-gray-500 ml-2">
                        ครั้งถัดไป: {BackupAPI.formatDate(schedulerStatus.nextRun)}
                      </span>
                    )}
                    {googleDriveStatus.connected && !schedulerStatus.enabled && (
                      <span className="text-xs text-blue-600 ml-2">
                        (Google Drive พร้อมใช้งาน - กดบันทึกเพื่อเปิดใช้งาน)
                      </span>
                    )}
                  </div>
                  <Button onClick={handleSaveSettings}>บันทึกการตั้งค่า</Button>
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => handleManualBackup(false)}
                    disabled={isBackupRunning}
                    className="h-20 flex-col"
                  >
                    {isBackupRunning ? (
                      <Loader2 className="h-6 w-6 mb-2 animate-spin" />
                    ) : (
                      <Database className="h-6 w-6 mb-2" />
                    )}
                    <span>สำรองข้อมูลแบบ Local</span>
                    <span className="text-xs opacity-75">Local Backup</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => handleManualBackup(true)}
                    disabled={isBackupRunning || !googleDriveStatus.connected}
                    className="h-20 flex-col"
                  >
                    {isBackupRunning ? (
                      <Loader2 className="h-6 w-6 mb-2 animate-spin" />
                    ) : googleDriveStatus.connected ? (
                      <Cloud className="h-6 w-6 mb-2" />
                    ) : (
                      <CloudOff className="h-6 w-6 mb-2" />
                    )}
                    <span>สำรองไป Google Drive</span>
                    <span className="text-xs opacity-75">
                      {googleDriveStatus.connected ? 'Cloud Backup' : 'ไม่ได้เชื่อมต่อ'}
                    </span>
                  </Button>

                  <Button 
                    variant="secondary"
                    onClick={handleTriggerScheduledBackup}
                    disabled={isBackupRunning}
                    className="h-20 flex-col"
                  >
                    {isBackupRunning ? (
                      <Loader2 className="h-6 w-6 mb-2 animate-spin" />
                    ) : (
                      <Clock className="h-6 w-6 mb-2" />
                    )}
                    <span>ทดสอบตามตารางเวลา</span>
                    <span className="text-xs opacity-75">Scheduled Test</span>
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
                              {(() => {
                                // หาชื่อไฟล์จาก local หรือ Google Drive backup
                                const localBackup = localBackups.find(b => b.id === backup.id);
                                const googleBackup = googleDriveBackups.find(b => b.id === backup.id);
                                const filename = localBackup?.name || googleBackup?.name;
                                
                                // ถ้ามีชื่อไฟล์ ให้แปลงวันที่จากชื่อไฟล์
                                if (filename) {
                                  const extractedDate = extractDateFromFilename(filename);
                                  if (extractedDate) {
                                    return formatDate(extractedDate);
                                  }
                                }
                                
                                // ถ้าแปลงไม่ได้ ใช้วันที่จาก backup.startTime
                                return formatDate(backup.startTime);
                              })()}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {backup.status === 'completed' && (
                              <>ขนาด: {backup.size}</>
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
                          {/* Show different actions based on backup type */}
                          {localBackups.find(b => b.id === backup.id) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadBackup(localBackups.find(b => b.id === backup.id)!.name)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          {googleDriveBackups.find(b => b.id === backup.id) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(googleDriveBackups.find(b => b.id === backup.id)!.webViewLink, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const isLocal = localBackups.find(b => b.id === backup.id)
                              const isGoogleDrive = googleDriveBackups.find(b => b.id === backup.id)
                              if (isLocal) {
                                handleRestoreBackup('local', isLocal.name)
                              } else if (isGoogleDrive) {
                                handleRestoreBackup('google-drive', backup.id)
                              }
                            }}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const isLocal = localBackups.find(b => b.id === backup.id)
                              const isGoogleDrive = googleDriveBackups.find(b => b.id === backup.id)
                              if (isLocal) {
                                handleDeleteBackup('local', isLocal.name)
                              } else if (isGoogleDrive) {
                                handleDeleteBackup('google-drive', backup.id)
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
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
                  <span className="text-xs text-gray-500">
                    {backupStats.lastBackupTime 
                      ? BackupAPI.formatDate(backupStats.lastBackupTime)
                      : 'ไม่มีข้อมูล'
                    }
                  </span>
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
                  <span>{BackupAPI.formatBytes(backupStats.totalLocalSize)} / ∞</span>
                </div>
                <Progress value={Math.min((backupStats.totalLocalSize / (10 * 1024 * 1024 * 1024)) * 100, 100)} className="w-full" />
                </div>
                <div className="text-xs text-gray-500">
                  <p>• ไฟล์สำรอง Local: {backupStats.totalLocalBackups} ไฟล์</p>
                  <p>• ไฟล์สำรอง Google Drive: {backupStats.totalGoogleDriveBackups} ไฟล์</p>
                  <p>• ขนาดรวม Local: {BackupAPI.formatBytes(backupStats.totalLocalSize)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Google Drive Configuration Dialog */}
        <AlertDialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
          <AlertDialogContent className="max-w-2xl bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle>ตั้งค่า Google Drive</AlertDialogTitle>
              <AlertDialogDescription>
                อัพโหลดไฟล์ JSON ที่ได้จาก Google Cloud Console OAuth Client
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>ไฟล์ JSON Configuration</Label>
                <Textarea
                  value={googleConfigJson}
                  onChange={(e) => setGoogleConfigJson(e.target.value)}
                  placeholder={JSON.stringify({
                    "web": {
                      "client_id": "your-client-id.apps.googleusercontent.com",
                      "project_id": "your-project-id",
                      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                      "token_uri": "https://oauth2.googleapis.com/token",
                      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                      "client_secret": "your-client-secret",
                      "redirect_uris": ["http://localhost:4000/auth/google/callback"],
                      "javascript_origins": ["http://localhost:3000", "http://localhost:4000"]
                    }
                  }, null, 2)}
                  className="min-h-[200px] font-mono text-xs"
                />
              </div>
              
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="text-sm font-medium text-yellow-800">คำแนะนำ:</div>
                <div className="text-xs text-yellow-700 mt-1">
                  1. ไปที่ Google Cloud Console<br/>
                  2. สร้าง OAuth 2.0 Client ID<br/>
                  3. ดาวน์โหลดไฟล์ JSON และวางที่นี่
                </div>
              </div>
            </div>
            
            <AlertDialogFooter>
              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfigureGoogleDrive}
                disabled={!googleConfigJson.trim() || isConfiguring}
              >
                {isConfiguring ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    กำลังตั้งค่า...
                  </>
                ) : (
                  'ตั้งค่า'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* Google Drive Authorization Dialog */}
        <AlertDialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
          <AlertDialogContent className="bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle>ยืนยันการเข้าถึง Google Drive</AlertDialogTitle>
              <AlertDialogDescription>
                กรุณาเปิด URL ด้านล่าง และคัดลอกรหัสที่ได้กลับมา
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Authorization URL</Label>
                <div className="flex space-x-2">
                  <Input 
                    value={authUrl} 
                    readOnly 
                    className="font-mono text-xs"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(authUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <Label>รหัสยืนยัน</Label>
                <Input
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  placeholder="วางรหัสยืนยันที่ได้จาก Google"
                />
              </div>
            </div>
            
            <AlertDialogFooter>
              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleAuthorizeGoogleDrive}
                disabled={!authCode.trim() || isConfiguring}
              >
                {isConfiguring ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    กำลังยืนยัน...
                  </>
                ) : (
                  'ยืนยัน'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageGuard>
  )
}
