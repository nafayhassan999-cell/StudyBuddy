/**
 * Test cases for Gemini AI Integration
 * Run with: npx jest lib/gemini.test.ts
 * Or: npx ts-node lib/gemini.test.ts (for quick manual testing)
 */

import { getFallbackResponse, formatStudyPrompt, callGemini } from './gemini';

// ============ Test Suite for getFallbackResponse ============

function testGetFallbackResponse() {
  console.log('\n🧪 Testing getFallbackResponse...\n');
  
  const testCases = [
    { input: 'Hello there!', expectedContains: 'StudyBuddy AI', description: 'greeting with hello' },
    { input: 'Hi, how are you?', expectedContains: 'StudyBuddy AI', description: 'greeting with hi' },
    { input: 'Hey!', expectedContains: 'StudyBuddy AI', description: 'greeting with hey' },
    { input: 'Help me with math homework', expectedContains: 'Math', description: 'math question' },
    { input: 'I need help with calculus', expectedContains: 'Math', description: 'calculus question' },
    { input: 'Solve this equation', expectedContains: 'Math', description: 'equation question' },
    { input: 'Explain physics to me', expectedContains: 'Science', description: 'physics question' },
    { input: 'What is chemistry?', expectedContains: 'Science', description: 'chemistry question' },
    { input: 'Help with biology', expectedContains: 'Science', description: 'biology question' },
    { input: 'How do I study better?', expectedContains: 'Active Recall', description: 'study question' },
    { input: 'Tips for learning', expectedContains: 'Active Recall', description: 'learning question' },
    { input: 'How to memorize things?', expectedContains: 'Active Recall', description: 'memorization question' },
    { input: 'Random unrelated question', expectedContains: 'study', description: 'default response' },
  ];

  let passed = 0;
  let failed = 0;

  testCases.forEach(({ input, expectedContains, description }) => {
    const result = getFallbackResponse(input);
    const success = result.toLowerCase().includes(expectedContains.toLowerCase());
    
    if (success) {
      console.log(`  ✅ PASS: ${description}`);
      passed++;
    } else {
      console.log(`  ❌ FAIL: ${description}`);
      console.log(`     Input: "${input}"`);
      console.log(`     Expected to contain: "${expectedContains}"`);
      console.log(`     Got: "${result.substring(0, 100)}..."`);
      failed++;
    }
  });

  console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

// ============ Test Suite for formatStudyPrompt ============

function testFormatStudyPrompt() {
  console.log('\n🧪 Testing formatStudyPrompt...\n');
  
  let passed = 0;
  let failed = 0;

  // Test 1: Basic question without context
  const result1 = formatStudyPrompt('What is photosynthesis?');
  const test1Pass = result1.includes('StudyBuddy AI') && 
                    result1.includes('What is photosynthesis?') &&
                    result1.includes('educational');
  
  if (test1Pass) {
    console.log('  ✅ PASS: Basic question without context');
    passed++;
  } else {
    console.log('  ❌ FAIL: Basic question without context');
    failed++;
  }

  // Test 2: Question with context
  const result2 = formatStudyPrompt('Explain derivatives', 'Calculus class');
  const test2Pass = result2.includes('Context: Calculus class') && 
                    result2.includes('Explain derivatives');
  
  if (test2Pass) {
    console.log('  ✅ PASS: Question with context');
    passed++;
  } else {
    console.log('  ❌ FAIL: Question with context');
    failed++;
  }

  // Test 3: Empty question
  const result3 = formatStudyPrompt('');
  const test3Pass = result3.includes('StudyBuddy AI');
  
  if (test3Pass) {
    console.log('  ✅ PASS: Empty question handling');
    passed++;
  } else {
    console.log('  ❌ FAIL: Empty question handling');
    failed++;
  }

  console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

// ============ Test Suite for callGemini (requires API key) ============

async function testCallGemini() {
  console.log('\n🧪 Testing callGemini...\n');
  
  let passed = 0;
  let failed = 0;

  // Test 1: Missing API key
  const originalKey = process.env.GEMINI_API_KEY;
  const originalPublicKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  delete process.env.GEMINI_API_KEY;
  delete process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  try {
    await callGemini('Test prompt');
    console.log('  ❌ FAIL: Should throw error for missing API key');
    failed++;
  } catch (error: any) {
    if (error.message.includes('Missing GEMINI_API_KEY')) {
      console.log('  ✅ PASS: Throws error for missing API key');
      passed++;
    } else {
      console.log('  ❌ FAIL: Wrong error message for missing API key');
      failed++;
    }
  }
  
  // Restore keys
  if (originalKey) process.env.GEMINI_API_KEY = originalKey;
  if (originalPublicKey) process.env.NEXT_PUBLIC_GEMINI_API_KEY = originalPublicKey;

  // Test 2: API call (only if key is available)
  if (originalKey || originalPublicKey) {
    try {
      console.log('  ⏳ Testing live API call (this may take a moment)...');
      const response = await callGemini('Say "test successful" in exactly those words.');
      
      if (response && response.length > 0) {
        console.log('  ✅ PASS: API call returned response');
        console.log(`     Response preview: "${response.substring(0, 50)}..."`);
        passed++;
      } else {
        console.log('  ❌ FAIL: API call returned empty response');
        failed++;
      }
    } catch (error: any) {
      console.log(`  ⚠️ SKIP: API call failed (${error.message})`);
      console.log('     This may be due to rate limiting or invalid API key');
    }
  } else {
    console.log('  ⚠️ SKIP: Live API test (no API key configured)');
  }

  console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

// ============ Run All Tests ============

async function runAllTests() {
  console.log('═══════════════════════════════════════════');
  console.log('  🔬 Gemini Module Test Suite');
  console.log('═══════════════════════════════════════════');

  const results: boolean[] = [];

  results.push(testGetFallbackResponse());
  results.push(testFormatStudyPrompt());
  results.push(await testCallGemini());

  console.log('═══════════════════════════════════════════');
  const allPassed = results.every(r => r);
  if (allPassed) {
    console.log('  ✅ All test suites passed!');
  } else {
    console.log('  ❌ Some tests failed');
  }
  console.log('═══════════════════════════════════════════\n');

  return allPassed;
}

// Run tests if this file is executed directly
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
