// Test edge cases for the pipeline
const { runPipeline } = require('./dist/runPipeline.js');

async function testEdgeCases() {
  console.log('🧪 TESTING EDGE CASES\n');

  const testCases = [
    {
      name: 'Empty string (should fail gracefully)',
      input: '',
      shouldFail: true
    },
    {
      name: 'Very short input',
      input: 'Hi.',
      shouldFail: false
    },
    {
      name: 'Long input (>200 chars)',
      input: 'This is a very long diary entry that goes on and on about many different topics and themes and should still be processed correctly by the pipeline even though it contains more than 200 characters and has multiple sentences with various punctuation marks and emotional indicators like excitement! and questions? and other complex emotional states that need to be parsed and understood by the system.',
      shouldFail: false
    },
    {
      name: 'Emoji-heavy input',
      input: '😀 Today was amazing! 🎉 I felt so happy 😊 and excited 🔥 about the new project. My team 👥 was supportive 💪 and we celebrated 🎊 our success! 🌟✨',
      shouldFail: false
    },
    {
      name: 'Mixed emojis and text',
      input: 'Feeling 😔 sad today but trying to stay 💪 strong. Work is 😰 stressful but I know things will get 🌈 better soon! 🙏',
      shouldFail: false
    },
    {
      name: 'Only emojis',
      input: '😀😊🎉💪🌟✨🔥',
      shouldFail: false
    },
    {
      name: 'Special characters and symbols',
      input: 'Today I worked on @project #awesome with $budget constraints & time limits... but it went well! (surprisingly)',
      shouldFail: false
    },
    {
      name: 'Unicode and international characters',
      input: 'Aujourd\'hui était formidable! 今日は素晴らしい日でした。 Сегодня был замечательный день! 🌍',
      shouldFail: false
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📝 Testing: ${testCase.name}`);
    console.log(`Input: "${testCase.input}" (${testCase.input.length} chars)`);
    
    try {
      const result = await runPipeline(testCase.input, `test-${Date.now()}`);
      
      if (testCase.shouldFail) {
        console.log('❌ Expected failure but got success');
      } else {
        console.log('✅ Success!');
        console.log(`   Response: "${result.response_text}"`);
        console.log(`   Time: ${result.execution_time}ms`);
        console.log(`   Cost: ${result.total_cost}`);
      }
    } catch (error) {
      if (testCase.shouldFail) {
        console.log('✅ Expected failure:', error.message);
      } else {
        console.log('❌ Unexpected failure:', error.message);
      }
    }
  }
}

// Run tests
testEdgeCases().catch(console.error);
