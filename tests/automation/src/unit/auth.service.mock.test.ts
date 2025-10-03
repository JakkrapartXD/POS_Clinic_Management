import { MockAuthService } from '../mocks/services';

describe('AuthService Unit Tests (Mocked)', () => {
  let authService: MockAuthService;

  beforeEach(() => {
    authService = new MockAuthService();
  });

  describe('UT-001: AuthService.login - Successful login', () => {
    it('should allow login and create JWT token for valid user', async () => {
      // Arrange
      const username = 'testuser';
      const password = 'correctpassword';

      // Act
      const result = await authService.login(username, password);

      // Assert
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.username).toBe(username);
      expect(result.user.role).toBe('staff');
      expect(result.user.status).toBe('active');
    });
  });

  describe('UT-002: AuthService.login - Incorrect password', () => {
    it('should reject login and show error message for wrong password', async () => {
      // Arrange
      const username = 'testuser';
      const wrongPassword = 'wrongpassword';

      // Act
      const result = await authService.login(username, wrongPassword);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('รหัสผ่านไม่ถูกต้อง');
    });
  });

  describe('UT-003: AuthService.login - Non-existent user', () => {
    it('should reject login for non-existent user', async () => {
      // Arrange
      const username = 'nonexistentuser';
      const password = 'anypassword';

      // Act
      const result = await authService.login(username, password);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('รหัสผ่านไม่ถูกต้อง');
    });
  });
});
