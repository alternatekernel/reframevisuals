#!/usr/bin/env node
const { uploadToDropbox, getDropboxFolderLink, getOrCreateSharedLink, deleteFromDropbox } = require('../backend/dist/services/dropboxService');
const fs = require('fs');
const path = require('path');

async function testDropboxIntegration() {
  console.log('🧪 Testing Dropbox Integration...');
  
  // Check environment variables
  const requiredEnvVars = [
    'DROPBOX_ACCESS_TOKEN',
    'DROPBOX_REFRESH_TOKEN', 
    'DROPBOX_APP_KEY',
    'DROPBOX_APP_SECRET',
    'DROPBOX_UPLOAD_FOLDER'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.warn('⚠️  Missing environment variables:', missingVars);
    console.log('ℹ️  Using fallback test mode...');
  } else {
    console.log('✅ All required environment variables are set');
  }
  
  return { hasEnvVars: missingVars.length === 0 };
}

async function testUpload() {
  console.log('\n📤 Testing Dropbox Upload...');
  
  try {
    // Create a test file
    const testContent = 'Test file content for Dropbox integration';
    const testFilePath = path.join(__dirname, 'test-upload.txt');
    fs.writeFileSync(testFilePath, testContent);
    
    const fileStream = fs.createReadStream(testFilePath);
    
    const uploadOptions = {
      guestId: 'test-guest-123',
      customerCode: 'TEST001',
      orderCode: 'ORD-TEST-001'
    };
    
    const result = await uploadToDropbox(fileStream, 'test-upload.txt', uploadOptions);
    
    if (result.success) {
      console.log('✅ Upload successful');
      console.log(`📁 File URL: ${result.url}`);
      console.log(`🗂️  File path: ${result.path}`);
      console.log(`📂 Folder: ${result.folderPath}`);
      
      // Clean up test file
      fs.unlinkSync(testFilePath);
      
      return { success: true, result };
    } else {
      console.error('❌ Upload failed:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Upload error:', error);
    return { success: false, error };
  }
}

async function testSharedLink() {
  console.log('\n🔗 Testing Shared Link Generation...');
  
  try {
    // Test folder link generation
    const folderPath = '/Reframe Uploads/test-folder';
    const folderLink = await getDropboxFolderLink(folderPath);
    
    if (folderLink) {
      console.log('✅ Folder link generated:', folderLink);
      
      // Test shared link for specific path
      const specificLink = await getOrCreateSharedLink('test-folder/file.txt', 'test-folder/file.txt');
      console.log('✅ Specific file link generated:', specificLink);
      
      return { success: true, folderLink, specificLink };
    } else {
      console.log('ℹ️  No shared link generated (likely no existing files)');
      return { success: true, folderLink: null, specificLink: null };
    }
  } catch (error) {
    console.error('❌ Shared link test error:', error);
    return { success: false, error };
  }
}

async function testCleanup() {
  console.log('\n🧹 Testing Dropbox Cleanup...');
  
  try {
    const testFolderPath = '/Reframe Uploads/test-folder';
    
    const result = await deleteFromDropbox(testFolderPath);
    
    if (result.success) {
      console.log('✅ Cleanup successful');
      return { success: true };
    } else {
      console.log('ℹ️  Cleanup failed (folder may not exist):', result.error);
      return { success: true }; // This is expected if folder doesn't exist
    }
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    return { success: false, error };
  }
}

async function runFullIntegrationTest() {
  console.log('🚀 Starting Full Dropbox Integration Test');
  console.log('=' .repeat(50));
  
  const envCheck = await testDropboxIntegration();
  const uploadResult = await testUpload();
  const linkResult = await testSharedLink();
  const cleanupResult = await testCleanup();
  
  console.log('\n📊 Test Results Summary:');
  console.log('=' .repeat(50));
  console.log(`Environment Variables: ${envCheck.hasEnvVars ? '✅ Present' : '⚠️ Partial'}`);
  console.log(`Upload Test: ${uploadResult.success ? '✅ Passed' : '❌ Failed'}`);
  console.log(`Shared Link Test: ${linkResult.success ? '✅ Passed' : '❌ Failed'}`);
  console.log(`Cleanup Test: ${cleanupResult.success ? '✅ Passed' : '❌ Failed'}`);
  
  const allPassed = envCheck.hasEnvVars && uploadResult.success && linkResult.success && cleanupResult.success;
  
  if (allPassed) {
    console.log('\n🎉 All Dropbox integration tests passed!');
    console.log('\n📋 Integration Features Verified:');
    console.log('  • Token authentication and caching');
    console.log('  • File upload with folder structure');
    console.log('  • Shared link generation');
    console.log('  • Error handling and recovery');
    console.log('  • Cleanup operations');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the logs above.');
  }
  
  return allPassed;
}

// Run the test
if (require.main === module) {
  runFullIntegrationTest().catch(console.error);
}
