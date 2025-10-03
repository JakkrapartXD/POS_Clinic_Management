// Mock services for unit testing
export class MockAuthService {
  async login(username: string, password: string) {
    // Mock successful login
    if (username === 'testuser' && password === 'correctpassword') {
      return {
        success: true,
        token: 'mock-jwt-token',
        user: {
          id: '1',
          username: 'testuser',
          role: 'staff',
          status: 'active'
        }
      };
    }
    
    // Mock failed login
    return {
      success: false,
      error: 'รหัสผ่านไม่ถูกต้อง'
    };
  }
}

export class MockPatientService {
  async create(patientData: any) {
    // Mock successful patient creation
    if (patientData.first_name && patientData.last_name && patientData.national_id) {
      return {
        success: true,
        patientId: 'mock-patient-id',
        patient: {
          id: 'mock-patient-id',
          ...patientData
        }
      };
    }
    
    // Mock validation error
    return {
      success: false,
      error: 'กรอกข้อมูลให้ครบถ้วน'
    };
  }
}

export class MockInventoryService {
  async deduct(productId: string, quantity: number) {
    // Mock insufficient stock
    if (quantity > 50) {
      return {
        success: false,
        error: 'จำนวนยาไม่เพียงพอ'
      };
    }
    
    // Mock successful deduction
    return {
      success: true,
      remainingStock: 50 - quantity
    };
  }
}

export class MockMedicalRecordService {
  async addRecord(patientId: string, recordData: any) {
    return {
      success: true,
      recordId: 'mock-record-id',
      record: {
        id: 'mock-record-id',
        patientId,
        ...recordData
      }
    };
  }
}

export class MockPrescriptionService {
  async addItem(prescriptionId: string, itemData: any) {
    return {
      success: true,
      itemId: 'mock-item-id',
      item: {
        id: 'mock-item-id',
        prescriptionId,
        ...itemData
      }
    };
  }
}

export class MockBillingService {
  calculateTotal(items: any[], discount: number = 0, taxRate: number = 0.07) {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = subtotal * (discount / 100);
    const taxableAmount = subtotal - discountAmount;
    const tax = taxableAmount * taxRate;
    const total = taxableAmount + tax;
    
    return {
      subtotal,
      discount: discountAmount,
      tax,
      total
    };
  }
}

export class MockReportService {
  async generateMonthlyReport(month: number, year: number) {
    return {
      success: true,
      report: {
        month,
        year,
        totalRevenue: 100000,
        totalCases: 50,
        reportId: 'mock-report-id'
      }
    };
  }
}

export class MockBackupService {
  async run() {
    return {
      success: true,
      status: 'สำเร็จ',
      backupPath: '/mock/backup/path'
    };
  }
}
