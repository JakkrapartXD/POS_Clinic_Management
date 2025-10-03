
# Automated Test Suite

This directory contains the automated test suite for the Clinic Management System.

## Structure

```
tests/automation/
├── src/
│   ├── setup.ts                 # Test setup and configuration
│   ├── unit/                    # Unit tests
│   │   ├── auth.service.test.ts
│   │   ├── patient.service.test.ts
│   │   └── inventory.service.test.ts
│   ├── integration/             # Integration tests
│   │   ├── patient-flow.test.ts
│   │   └── billing-flow.test.ts
│   └── e2e/                     # End-to-end tests
│       ├── patient-management.spec.ts
│       ├── medical-records.spec.ts
│       └── pharmacy-dispensing.spec.ts
├── scripts/                     # Test scripts
│   ├── setup-test-env.js
│   ├── cleanup-test-data.js
│   └── run-tests.js
├── package.json                 # Test dependencies
├── playwright.config.ts         # Playwright configuration
└── README.md                    # This file
```

## Prerequisites

1. Node.js 18+
2. PostgreSQL (for integration tests)
3. Redis (for integration tests)
4. Backend server running on port 4000
5. Frontend server running on port 3000

## Setup

1. Install dependencies:
   ```bash
   cd tests/automation
   npm install
   ```

2. Setup test environment:
   ```bash
   npm run setup
   ```

3. Install Playwright browsers (Desktop only):
   ```bash
   npx playwright install chromium firefox webkit msedge
   ```

## Running Tests

### All Tests
```bash
npm run test:all
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### E2E Tests Only
```bash
npm run test:e2e
```

### E2E Tests by Browser
```bash
# Chrome only
npm run test:e2e:chrome

# Firefox only
npm run test:e2e:firefox

# Safari only
npm run test:e2e:safari

# Edge only
npm run test:e2e:edge
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Scripts

### Setup Test Environment
```bash
node scripts/setup-test-env.js
```

### Cleanup Test Data
```bash
node scripts/cleanup-test-data.js
```

### Run Specific Test Type
```bash
node scripts/run-tests.js unit
node scripts/run-tests.js integration
node scripts/run-tests.js e2e
node scripts/run-tests.js all
```

## Test Configuration

### Environment Variables
- `TEST_DATABASE_URL`: Test database connection string
- `API_BASE_URL`: Backend API URL (default: http://localhost:4000)
- `FRONTEND_URL`: Frontend URL (default: http://localhost:3000)
- `JWT_SECRET`: JWT secret for testing
- `TEST_TIMEOUT`: Test timeout in milliseconds

### Test Data
Test data is automatically generated and cleaned up after each test run. The test data includes:
- Test users with different roles
- Test patients
- Test products and categories
- Test orders and prescriptions

## CI/CD Integration

The test suite is integrated with GitHub Actions for continuous integration. The workflow:
1. Sets up test environment (PostgreSQL, Redis)
2. Installs dependencies
3. Runs unit and integration tests
4. Runs E2E tests
5. Uploads test results and coverage reports

## Test Reports

Test results are generated in multiple formats:
- **HTML Report**: `test-results/index.html`
- **JSON Report**: `test-results/results.json`
- **JUnit Report**: `test-results/results.xml`
- **Coverage Report**: `coverage/index.html`

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check TEST_DATABASE_URL in .env.test

2. **Redis Connection Error**
   - Ensure Redis is running
   - Check REDIS_URL in .env.test

3. **Backend Server Not Running**
   - Start backend server: `cd backend && npm run dev`
   - Check API_BASE_URL in .env.test

4. **Frontend Server Not Running**
   - Start frontend server: `cd frontend && npm run dev`
   - Check FRONTEND_URL in .env.test

5. **Playwright Browser Issues**
   - Install desktop browsers: `npx playwright install chromium firefox webkit msedge`
   - Check browser dependencies

### Debug Mode

Run tests in debug mode:
```bash
DEBUG=* npm run test:unit
```

### Verbose Output

Run tests with verbose output:
```bash
npm run test:unit -- --verbose
```

## Contributing

When adding new tests:
1. Follow the existing naming conventions
2. Add proper test data cleanup
3. Include both positive and negative test cases
4. Add appropriate assertions
5. Update this README if needed

## Test Coverage

The test suite aims for:
- **Unit Tests**: 90%+ coverage
- **Integration Tests**: 80%+ coverage
- **E2E Tests**: Critical user flows

Run coverage report:
```bash
npm run test:coverage
```
