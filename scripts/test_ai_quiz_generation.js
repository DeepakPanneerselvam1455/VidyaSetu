#!/usr/bin/env node

/**
 * Test script for AI Quiz Generation (Task 13)
 * Tests the generateQuizQuestions function with various topics and configurations
 * 
 * Usage: node scripts/test_ai_quiz_generation.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test cases for AI quiz generation
const testCases = [
    {
        name: 'Basic Topic Generation',
        topic: 'Photosynthesis',
        difficulty: 'Beginner',
        count: 3,
        type: 'multiple-choice',
        courseInfo: { title: 'Biology 101', description: 'Introduction to Biology' }
    },
    {
        name: 'Advanced Topic with Objectives',
        topic: 'Quantum Mechanics',
        difficulty: 'Advanced',
        count: 5,
        type: 'multiple-choice',
        courseInfo: { title: 'Physics 301', description: 'Advanced Physics' },
        objectives: 'Understand wave-particle duality and quantum superposition'
    },
    {
        name: 'Mixed Question Types',
        topic: 'Constitutional Law',
        difficulty: 'Intermediate',
        count: 4,
        type: 'mixed',
        courseInfo: { title: 'Law 201', description: 'Constitutional Law Basics' }
    }
];

async function testAIGeneration() {
    console.log('🚀 Starting AI Quiz Generation Tests\n');
    console.log('=' .repeat(60));

    let passedTests = 0;
    let failedTests = 0;

    for (const testCase of testCases) {
        console.log(`\n📝 Test: ${testCase.name}`);
        console.log('-'.repeat(60));

        try {
            console.log(`   Topic: ${testCase.topic}`);
            console.log(`   Difficulty: ${testCase.difficulty}`);
            console.log(`   Count: ${testCase.count}`);
            console.log(`   Type: ${testCase.type}`);

            const { data, error } = await supabase.functions.invoke('generate-quiz', {
                body: {
                    topic: testCase.topic,
                    difficulty: testCase.difficulty,
                    count: testCase.count,
                    type: testCase.type,
                    courseInfo: testCase.courseInfo,
                    objectives: testCase.objectives || ''
                }
            });

            if (error) {
                console.error(`   ❌ Error: ${error.message}`);
                failedTests++;
                continue;
            }

            if (!data || !Array.isArray(data)) {
                console.error(`   ❌ Invalid response format`);
                failedTests++;
                continue;
            }

            // Validate response
            let isValid = true;
            for (let i = 0; i < data.length; i++) {
                const q = data[i];
                if (!q.question || !q.correctAnswer || !Array.isArray(q.options)) {
                    console.error(`   ❌ Question ${i + 1} missing required fields`);
                    isValid = false;
                    break;
                }
            }

            if (isValid) {
                console.log(`   ✅ Generated ${data.length} valid questions`);
                console.log(`   Sample question: "${data[0].question.substring(0, 60)}..."`);
                console.log(`   Options: ${data[0].options.length} options provided`);
                passedTests++;
            } else {
                failedTests++;
            }

        } catch (err) {
            console.error(`   ❌ Exception: ${err.message}`);
            failedTests++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 Test Results:`);
    console.log(`   ✅ Passed: ${passedTests}/${testCases.length}`);
    console.log(`   ❌ Failed: ${failedTests}/${testCases.length}`);
    console.log(`   Success Rate: ${((passedTests / testCases.length) * 100).toFixed(1)}%\n`);

    process.exit(failedTests > 0 ? 1 : 0);
}

testAIGeneration().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
