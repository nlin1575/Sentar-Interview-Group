// Test the timing grade logic
function getPerformanceGrade(latency_seconds) {
  let performance_grade = 'EXCELLENT';
  if (latency_seconds > 5) {
    performance_grade = 'POOR';
  } else if (latency_seconds > 3) {
    performance_grade = 'FAIR';
  } else if (latency_seconds > 1) {
    performance_grade = 'GOOD';
  }
  return performance_grade;
}

console.log('=== WALL-CLOCK TIME GRADING ===\n');

const testCases = [
  0.156, // Fast mock
  0.892, // Mixed case
  1.234, // Real models
  2.500, // Slower
  4.000, // Even slower
  6.000  // Very slow
];

testCases.forEach(time => {
  const grade = getPerformanceGrade(time);
  console.log(`${time.toFixed(3)}s → ${grade}`);
});

console.log('\n=== CORRECTED MIXED EXAMPLE ===');
console.log('🔄 MIXED (Real embedding, Mock GPT):');
console.log('⏱️  Wall-Clock Time: 0.892s (EXCELLENT)'); // ✅ Should be EXCELLENT
console.log('💰 Total Cost: $0.0000 (EXCELLENT)');
console.log('   - Embedding: $0.0000 [REAL]');
console.log('   - GPT: MOCK');
