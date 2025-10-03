
#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const testType = process.argv[2] || 'all';
const projectRoot = path.resolve(__dirname, '../../..');

console.log(`🧪 Running ${testType} tests...`);

try {
  switch (testType) {
    case 'unit':
      console.log('Running unit tests...');
      execSync('npm run test:unit', { 
        cwd: automationDir,
        stdio: 'inherit' 
      });
      break;
      
    case 'integration':
      console.log('Running integration tests...');
      execSync('npm run test:integration', { 
        cwd: automationDir,
        stdio: 'inherit' 
      });
      break;
      
    case 'e2e':
      console.log('Running E2E tests...');
      execSync('npm run test:e2e', { 
        cwd: automationDir,
        stdio: 'inherit' 
      });
      break;
      
    case 'all':
      console.log('Running all tests...');
      execSync('npm run test:all', { 
        cwd: automationDir,
        stdio: 'inherit' 
      });
      break;
      
    default:
      console.error('Invalid test type. Use: unit, integration, e2e, or all');
      process.exit(1);
  }
  
  console.log('✅ Tests completed successfully');
} catch (error) {
  console.error('❌ Tests failed:', error.message);
  process.exit(1);
}
