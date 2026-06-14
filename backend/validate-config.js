const fs = require('fs');
const path = require('path');

console.log('🔍 Validating project configuration...\n');

let errors = 0;
let warnings = 0;

// Check backend .env
const backendEnvPath = path.join(__dirname, '.env');
if (!fs.existsSync(backendEnvPath)) {
  console.error('❌ Backend .env file not found');
  console.log('   Create it from .env.example: cp .env.example .env');
  errors++;
} else {
  console.log('✅ Backend .env file exists');
  
  const envContent = fs.readFileSync(backendEnvPath, 'utf8');
  const requiredVars = [
    'MONGODB_CONNECTION',
    'JWT_SECRET',
    'PORT',
    'CLIENT_URL',
    'PYTHON_SERVICE_URL'
  ];
  
  requiredVars.forEach(varName => {
    if (!envContent.includes(`${varName}=`) || envContent.match(new RegExp(`${varName}=\\s*$`, 'm'))) {
      console.warn(`⚠️  ${varName} is not set in .env`);
      warnings++;
    } else {
      console.log(`   ✓ ${varName} is configured`);
    }
  });
  
  if (!envContent.includes('GROQ_API_KEY=')) {
    console.warn('⚠️  No AI API key configured (GROQ_API_KEY)');
    console.log('   AI recommendations will not work without an API key');
    warnings++;
  }
}

// Check node_modules
const backendModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(backendModulesPath)) {
  console.error('\n❌ Backend node_modules not found');
  console.log('   Run: npm install');
  errors++;
} else {
  console.log('\n✅ Backend dependencies installed');
}

// Check if MongoDB is accessible (basic check)
const mongoose = require('mongoose');
require('dotenv').config();

if (process.env.MONGODB_CONNECTION) {
  console.log('\n🔌 Testing MongoDB connection...');
  mongoose.connect(process.env.MONGODB_CONNECTION, {
    serverSelectionTimeoutMS: 5000
  })
  .then(() => {
    console.log('✅ MongoDB connection successful');
    mongoose.connection.close();
    printSummary();
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    errors++;
    printSummary();
  });
} else {
  console.log('\n⚠️  Cannot test MongoDB (connection string not configured)');
  warnings++;
  printSummary();
}

function printSummary() {
  console.log('\n' + '='.repeat(50));
  console.log('📊 Validation Summary:');
  console.log(`   Errors: ${errors}`);
  console.log(`   Warnings: ${warnings}`);
  
  if (errors === 0 && warnings === 0) {
    console.log('\n✨ All checks passed! Backend is ready to run.');
    console.log('   Start the server: npm start');
  } else if (errors === 0) {
    console.log('\n⚠️  Some warnings found, but backend should work.');
    console.log('   Review warnings above for optimal configuration.');
  } else {
    console.log('\n❌ Errors found! Please fix them before starting the server.');
  }
  console.log('='.repeat(50) + '\n');
  
  process.exit(errors > 0 ? 1 : 0);
}
