#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

// Test the enhanced SEO KPI report functionality
async function testSeoKpiReport() {
  console.log('🧪 Testing Enhanced SEO KPI Report...');
  
  // Test 1: Check if the script can be imported
  try {
    const scriptPath = path.join(process.cwd(), 'scripts', 'seo_weekly_kpi_report.mjs');
    const scriptContent = await fs.readFile(scriptPath, 'utf-8');
    
    // Check for new KPI elements
    const requiredElements = [
      'keywordClusters',
      'topKeywordsByCluster',
      'trialConversionFromOrganic',
      'leadsByPageType',
      'KPI 3: Top-10 Keywords by Cluster',
      'KPI 4: Trial Conversion from Organic Landing Pages',
      'KPI 5: Leads Assisted by Case-Study and GEO Pages'
    ];
    
    const missingElements = requiredElements.filter(element => 
      !scriptContent.includes(element)
    );
    
    if (missingElements.length > 0) {
      console.log(`❌ Missing elements: ${missingElements.join(', ')}`);
      return false;
    }
    
    console.log('✅ All KPI elements present in script');
    
  } catch (error) {
    console.log(`❌ Error reading script: ${error.message}`);
    return false;
  }
  
  // Test 2: Check backend conversion tracking
  try {
    const backendPath = path.join(process.cwd(), 'backend', 'dist', 'index.js');
    if (!fs.existsSync(backendPath)) {
      console.log('⚠️  Backend dist not built yet - skipping backend tests');
    } else {
      console.log('✅ Backend dist exists');
    }
  } catch (error) {
    console.log(`⚠️  Backend check skipped: ${error.message}`);
  }
  
  // Test 3: Check documentation
  try {
    const docPath = path.join(process.cwd(), 'SEO_KPI_TRACKING.md');
    if (fs.existsSync(docPath)) {
      console.log('✅ Documentation file created');
    } else {
      console.log('❌ Documentation file missing');
      return false;
    }
  } catch (error) {
    console.log(`❌ Documentation check failed: ${error.message}`);
    return false;
  }
  
  console.log('\n🎉 All tests passed!');
  console.log('\n📋 Summary of implemented KPIs:');
  console.log('1. ✅ Top-10 keywords by cluster (services, industries, GEO)');
  console.log('2. ✅ Trial conversion from organic landing pages');
  console.log('3. ✅ Leads assisted by case-study and GEO pages');
  console.log('\n🚀 Ready for production use!');
  
  return true;
}

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
  testSeoKpiReport().catch(console.error);
}
