# Test Commands for Presentation

## 🚀 Quick Test Commands

### Run Individual Test Files

#### Queue System Test
```bash
npx playwright test queue-system.spec.ts --project=chromium  --headed
```

#### Patient Management Test
```bash
npx playwright test patient-management.spec.ts --project=chromium  --headed
```

#### Pharmacy Dispensing Test
```bash
npx playwright test pharmacy-dispensing.spec.ts --project=chromium  --headed
```

#### Queue Flow Integration Test
```bash
# Test queue flow integration
npm test -- --testPathPattern=queue-flow-simple
```

#### Unit Test
```bash
# Test Vat
cd frontend
npm test vat-utils
```

## 🎯 Quick Demo Script (All Tests)
```bash
# Run all tests for presentation with visual browser and slow motion
npx playwright test queue-system.spec.ts patient-management.spec.ts pharmacy-dispensing.spec.ts --headed --reporter=html --project=chromium 
```

## 📊 Test Reports
```bash
# Generate HTML report
npx playwright show-report

# Generate JSON report
npx playwright test --reporter=json

# Generate JUnit report
npx playwright test --reporter=junit
```
#### `Export audit logs สำหรับ 1 วัน`
```bash
./scripts/export-daily-audit-logs.sh [date] [output_file]
# Example: ./scripts/export-daily-audit-logs.sh 2025-10-10
```

#### `Export logs ทั้งหมดจาก Redis (audit, session, rate limiting)`
```bash
./scripts/export-redis-logs.sh [output_file]
# Example: ./scripts/export-redis-logs.sh
```

## 📝 Notes for Presentation
- Use `--headed` to show browser during demo
- Use `--slow-mo=2000` for slower execution (easier to follow)
- Use `--ui` for interactive debugging
- Use `--reporter=html` for detailed reports
- Use `--trace on` to capture detailed execution traces
