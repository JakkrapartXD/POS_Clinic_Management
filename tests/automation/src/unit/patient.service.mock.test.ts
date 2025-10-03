import { MockPatientService } from '../mocks/services';

describe('PatientService Unit Tests (Mocked)', () => {
  let patientService: MockPatientService;

  beforeEach(() => {
    patientService = new MockPatientService();
  });

  describe('UT-003: PatientService.create - Valid patient data', () => {
    it('should save new patient to database and return patientId', async () => {
      // Arrange
      const validPatientData = {
        first_name: 'TestPatient',
        last_name: 'TestLastName',
        national_id: '1234567890123',
        phone: '0812345678',
        email: 'test@example.com',
        date_of_birth: '1990-01-01',
        gender: 'male'
      };

      // Act
      const result = await patientService.create(validPatientData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.patientId).toBeDefined();
      expect(result.patient).toBeDefined();
      expect(result.patient.first_name).toBe(validPatientData.first_name);
      expect(result.patient.last_name).toBe(validPatientData.last_name);
      expect(result.patient.national_id).toBe(validPatientData.national_id);
    });
  });

  describe('UT-004: PatientService.create - Incomplete data', () => {
    it('should show error message and not save data for incomplete information', async () => {
      // Arrange
      const incompletePatientData = {
        first_name: 'TestPatient',
        // Missing required fields: last_name, national_id
        phone: '0812345678',
        email: 'test@example.com'
      };

      // Act
      const result = await patientService.create(incompletePatientData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('กรอกข้อมูลให้ครบถ้วน');
    });
  });

  describe('UT-005: PatientService.create - Missing critical fields', () => {
    it('should reject patient creation when critical fields are missing', async () => {
      // Arrange
      const invalidPatientData = {
        first_name: 'TestPatient',
        last_name: 'TestLastName'
        // Missing national_id
      };

      // Act
      const result = await patientService.create(invalidPatientData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('กรอกข้อมูลให้ครบถ้วน');
    });
  });
});
