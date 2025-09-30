# Error Message Language Standardization

This document describes the standardization of error messages to use consistent Thai language throughout the application, eliminating confusing mixed Thai-English error messages.

## 🎯 **Problem Identified**

The application had mixed Thai-English error messages that could confuse users, particularly in:
- `throw new Error()` statements with English fallback messages
- Logger error messages in English
- Toast error messages mixing languages
- Inconsistent language usage across different error handling scenarios

## 🔧 **Changes Made**

### 1. **Data Backup Settings Page** (`/src/app/dashboard/settings/data/page.tsx`)

#### Throw Error Statements
- `'Failed to save settings'` → `'การบันทึกการตั้งค่าล้มเหลว'`
- `'Failed to toggle scheduler'` → `'การเปลี่ยนสถานะการสำรองอัตโนมัติล้มเหลว'`
- `'Failed to trigger scheduled backup'` → `'การเริ่มการสำรองตามตารางเวลาล้มเหลว'`
- `'Backup failed'` → `'การสำรองข้อมูลล้มเหลว'`
- `'Restore failed'` → `'การกู้คืนข้อมูลล้มเหลว'`
- `'Delete failed'` → `'การลบไฟล์ล้มเหลว'`
- `'Configuration failed'` → `'การตั้งค่า Google Drive ล้มเหลว'`
- `'Authorization failed'` → `'การยืนยัน Google Drive ล้มเหลว'`

#### Logger Messages
- `'Failed to load backup data'` → `'ไม่สามารถโหลดข้อมูลการสำรองได้'`
- `'Failed to auto-enable backup after Google Drive connection'` → `'ไม่สามารถเปิดการสำรองอัตโนมัติหลังเชื่อมต่อ Google Drive'`
- `'Failed to load Google Drive status'` → `'ไม่สามารถโหลดสถานะ Google Drive ได้'`
- `'Failed to load scheduler status'` → `'ไม่สามารถโหลดสถานะตัวจัดตารางเวลาได้'`
- `'Failed to save settings'` → `'ไม่สามารถบันทึกการตั้งค่าได้'`
- `'Failed to toggle scheduler'` → `'ไม่สามารถเปลี่ยนสถานะตัวจัดตารางเวลาได้'`
- `'Failed to trigger scheduled backup'` → `'ไม่สามารถเริ่มการสำรองตามตารางเวลาได้'`
- `'Manual backup failed'` → `'การสำรองข้อมูลด้วยตนเองล้มเหลว'`
- `'Data restore failed'` → `'การกู้คืนข้อมูลล้มเหลว'`
- `'Backup download failed'` → `'การดาวน์โหลดไฟล์สำรองล้มเหลว'`
- `'Delete backup failed'` → `'การลบไฟล์สำรองล้มเหลว'`
- `'Failed to extract date from filename'` → `'ไม่สามารถแยกวันที่จากชื่อไฟล์ได้'`

#### Logger Info Messages
- `'Auto backup enabled automatically after Google Drive connection'` → `'เปิดการสำรองอัตโนมัติโดยอัตโนมัติหลังเชื่อมต่อ Google Drive'`
- `'Downloading backup'` → `'กำลังดาวน์โหลดไฟล์สำรอง'`

### 2. **Patient Detail Page** (`/src/app/dashboard/patients/[id]/page.tsx`)

#### Toast Error Messages
- `'Failed to load patient data'` → `'ไม่สามารถโหลดข้อมูลผู้ป่วยได้'`

### 3. **Visit Detail Page** (`/src/app/dashboard/visits/[id]/page.tsx`)

#### Toast Error Messages
- `'Failed to load visit data'` → `'ไม่สามารถโหลดข้อมูลการเยี่ยมได้'`
- `'Failed to save SOAP notes'` → `'ไม่สามารถบันทึกบันทึก SOAP ได้'`
- `'Failed to save vitals'` → `'ไม่สามารถบันทึกสัญญาณชีพได้'`
- `'Failed to link order'` → `'ไม่สามารถเชื่อมโยงคำสั่งซื้อได้'`
- `'Failed to create queue ticket'` → `'ไม่สามารถสร้างตั๋วคิวได้'`

## 📋 **Translation Guidelines**

### Error Message Patterns
1. **Action Failed**: `'การ[action]ล้มเหลว'`
   - Example: `'การบันทึกข้อมูลล้มเหลว'` (Data saving failed)

2. **Cannot Perform Action**: `'ไม่สามารถ[action]ได้'`
   - Example: `'ไม่สามารถโหลดข้อมูลได้'` (Cannot load data)

3. **Process Failed**: `'การ[process]ล้มเหลว'`
   - Example: `'การสำรองข้อมูลล้มเหลว'` (Backup process failed)

### Common Terms
- **Load/โหลด**: `'โหลดข้อมูล'` (Load data)
- **Save/บันทึก**: `'บันทึกข้อมูล'` (Save data)
- **Delete/ลบ**: `'ลบไฟล์'` (Delete file)
- **Download/ดาวน์โหลด**: `'ดาวน์โหลดไฟล์'` (Download file)
- **Upload/อัพโหลด**: `'อัพโหลดไฟล์'` (Upload file)
- **Connect/เชื่อมต่อ**: `'เชื่อมต่อ'` (Connect)
- **Configure/ตั้งค่า**: `'ตั้งค่า'` (Configure)
- **Authorize/ยืนยัน**: `'ยืนยัน'` (Authorize)

## 🎯 **Benefits Achieved**

1. **Consistent User Experience**: All error messages now use Thai language consistently
2. **Reduced Confusion**: Users no longer see mixed Thai-English error messages
3. **Better Localization**: Error messages match the UI language (Thai)
4. **Professional Appearance**: Consistent language usage throughout the application
5. **Improved Accessibility**: Thai-speaking users can better understand error conditions

## 🔍 **Verification**

All changes have been verified to:
- ✅ Use consistent Thai language
- ✅ Maintain proper error handling functionality
- ✅ Pass linting checks
- ✅ Preserve original error handling logic
- ✅ Follow established translation patterns

## 📝 **Future Considerations**

1. **Consistent Pattern**: Continue using the established Thai error message patterns for new features
2. **Translation Review**: Regular review of error messages for consistency
3. **User Testing**: Test error messages with Thai-speaking users for clarity
4. **Documentation**: Maintain this document as a reference for future development

## 🛠️ **Implementation Notes**

- All changes maintain backward compatibility
- Error handling logic remains unchanged
- Only the display language has been standardized
- Logger messages are now consistent with user-facing messages
- Toast notifications provide clear Thai error descriptions

This standardization ensures a professional, consistent user experience for Thai-speaking users while maintaining the technical functionality of error handling throughout the application.
