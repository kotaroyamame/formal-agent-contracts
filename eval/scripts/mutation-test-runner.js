#!/usr/bin/env node

/**
 * Mutation Testing Framework for Formal Agent Contracts Evaluation
 * Node.js version without TypeScript
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const EVAL_ROOT = '/sessions/kind-funny-sagan/mnt/formal-agent-contracts/eval';
const WORK_DIR = '/sessions/kind-funny-sagan/mutation-test-work';

/**
 * Generate mutations for the given source code
 */
function generateMutations(sourceCode, sourceFile) {
  const mutations = [];

  // M-BOUNDARY: Change < to <=
  let boundaryLessThan = sourceCode.match(/<[^=]/g);
  if (boundaryLessThan && boundaryLessThan.length > 0) {
    mutations.push({
      operator: 'M-BOUNDARY',
      pattern: '<',
      replacement: '<=',
      context: 'less-than',
      description: 'Change < to <=',
    });
  }

  // M-BOUNDARY: Change > to >=
  let boundaryGreaterThan = sourceCode.match(/>[^=]/g);
  if (boundaryGreaterThan && boundaryGreaterThan.length > 0) {
    mutations.push({
      operator: 'M-BOUNDARY',
      pattern: '>',
      replacement: '>=',
      context: 'greater-than',
      description: 'Change > to >=',
    });
  }

  // M-OFF-BY-ONE: 1000000 to 999999 and 1000001
  if (sourceCode.includes('1000000')) {
    mutations.push({
      operator: 'M-OFF-BY-ONE',
      pattern: '1000000',
      replacement: '999999',
      description: 'Change 1000000 to 999999',
    });
    mutations.push({
      operator: 'M-OFF-BY-ONE',
      pattern: '1000000',
      replacement: '1000001',
      description: 'Change 1000000 to 1000001',
    });
  }

  // M-OFF-BY-ONE: Other 6+ digit numbers
  const numbers = sourceCode.match(/\b[0-9]{6,}\b/g);
  if (numbers) {
    const uniqueNumbers = new Set(numbers);
    for (const num of uniqueNumbers) {
      const n = parseInt(num);
      mutations.push({
        operator: 'M-OFF-BY-ONE',
        pattern: num,
        replacement: String(n - 1),
        description: `Change ${num} to ${n - 1}`,
      });
    }
  }

  // M-REMOVE-CHECK: Find throw statements
  const throwMatches = sourceCode.match(/if\s*\([^)]+\)\s*\{\s*(?:const\s+\w+[^}]*)?\s*throw\s+new\s+Error\([^)]*\)[^}]*\}/g);
  if (throwMatches) {
    // Add mutation to comment out one throw
    mutations.push({
      operator: 'M-REMOVE-CHECK',
      pattern: /if\s*\([^)]+\)\s*\{\s*(?:const\s+\w+[^}]*)?\s*throw\s+new\s+Error\([^)]*\)[^}]*\}/,
      replacement: '// validation removed',
      description: 'Remove validation check (if-throw)',
    });
  }

  // M-SWAP-OPERATOR: Change + to - (in balance operations)
  if (sourceCode.includes('balance') && sourceCode.includes('+')) {
    mutations.push({
      operator: 'M-SWAP-OPERATOR',
      pattern: '+',
      replacement: '-',
      context: 'balance-plus',
      description: 'Change + to - in balance operations',
    });
  }

  // M-SWAP-OPERATOR: Change - to + (in balance operations)
  if (sourceCode.includes('balance') && sourceCode.includes('-')) {
    mutations.push({
      operator: 'M-SWAP-OPERATOR',
      pattern: '-',
      replacement: '+',
      context: 'balance-minus',
      description: 'Change - to + in balance operations',
    });
  }

  // M-REMOVE-ATOMICITY: Look for balance checks before transfers
  if (sourceCode.includes('balance - amount')) {
    mutations.push({
      operator: 'M-REMOVE-ATOMICITY',
      pattern: 'if (this.balance - amount < 0)',
      replacement: 'if (false)', // will never throw
      description: 'Remove atomicity check',
    });
  }

  // M-NEGATE-CONDITION: Negate some conditions
  if (sourceCode.includes('amount > 0')) {
    mutations.push({
      operator: 'M-NEGATE-CONDITION',
      pattern: 'amount > 0',
      replacement: '!(amount > 0)',
      description: 'Negate amount > 0 condition',
    });
  }

  if (sourceCode.includes('if (amount <=')) {
    mutations.push({
      operator: 'M-NEGATE-CONDITION',
      pattern: 'if (amount <= 0)',
      replacement: 'if (!(amount <= 0))',
      description: 'Negate amount <= 0 condition',
    });
  }

  return mutations;
}

/**
 * Apply a single mutation and return the mutated code
 */
function applyMutation(sourceCode, mutation) {
  if (mutation.context === 'less-than') {
    // Only replace < that's not followed by =
    return sourceCode.replace(/<(?!=)/g, '<=');
  } else if (mutation.context === 'greater-than') {
    // Only replace > that's not followed by =
    return sourceCode.replace(/>(?!=)/g, '>=');
  } else if (mutation.context === 'balance-plus') {
    // Replace + in balance operations
    return sourceCode.replace(/balance\s*\+\s*/g, (match) => match.replace('+', '-'));
  } else if (mutation.context === 'balance-minus') {
    // Replace - in balance operations
    return sourceCode.replace(/balance\s*-\s*/g, (match) => match.replace('-', '+'));
  } else if (typeof mutation.replacement === 'string') {
    return sourceCode.replace(mutation.pattern, mutation.replacement);
  }
  return sourceCode;
}

/**
 * Run Jest tests on the mutated code
 */
function runTests(workDir, testFileName, sourceFileName, sourceCode) {
  try {
    // Write source to work directory
    const sourcePathInWork = path.join(workDir, sourceFileName);
    fs.writeFileSync(sourcePathInWork, sourceCode);

    // Run jest
    try {
      execSync(`cd ${workDir} && npx jest "${testFileName}" --no-coverage --silent 2>&1`, {
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 30000,
      });
      // Tests passed - mutation survived
      return false;
    } catch (error) {
      // Tests failed - mutation was killed
      return true;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Process a single run
 */
function processRun(runPath) {
  const runName = path.relative(EVAL_ROOT, runPath).split(path.sep).slice(0, 2).join('/');

  // Find source and test files
  const files = fs.readdirSync(runPath);
  const sourceFile = files.find(f => f.endsWith('.ts') && !f.endsWith('.test.ts'));
  const testFile = files.find(f => f.endsWith('.test.ts'));

  if (!sourceFile || !testFile) {
    return null;
  }

  const sourceFilePath = path.join(runPath, sourceFile);
  const testFilePath = path.join(runPath, testFile);

  console.log(`[PROCESS] ${runName}`);

  // Read files
  const originalSource = fs.readFileSync(sourceFilePath, 'utf-8');
  const testContent = fs.readFileSync(testFilePath, 'utf-8');

  // Generate mutations
  const mutations = generateMutations(originalSource, sourceFilePath);

  if (mutations.length === 0) {
    console.log(`  -> No mutations found`);
    return {
      runPath,
      runName,
      sourceFile,
      testFile,
      totalMutations: 0,
      killedMutations: 0,
      survivedMutations: 0,
      errorMutations: 0,
      killRate: 0,
      mutations: [],
    };
  }

  const mutationResults = [];
  let killedCount = 0;
  let survivedCount = 0;
  let errorCount = 0;

  // Write test file once
  const testPathInWork = path.join(WORK_DIR, testFile);
  fs.writeFileSync(testPathInWork, testContent);

  // Apply each mutation
  for (let i = 0; i < mutations.length; i++) {
    const mutation = mutations[i];

    try {
      // Apply mutation
      let mutatedSource = applyMutation(originalSource, mutation);

      // Check if actually changed
      if (mutatedSource === originalSource) {
        continue;
      }

      // Run tests with mutated code
      const killed = runTests(WORK_DIR, testFile, sourceFile, mutatedSource);

      if (killed) {
        killedCount++;
      } else {
        survivedCount++;
      }

      mutationResults.push({
        mutationId: `${mutation.operator}-${i}`,
        operator: mutation.operator,
        description: mutation.description,
        killed,
      });

    } catch (error) {
      errorCount++;
      mutationResults.push({
        mutationId: `${mutation.operator}-${i}`,
        operator: mutation.operator,
        description: mutation.description,
        killed: false,
        error: error.message,
      });
    }
  }

  const totalMutations = killedCount + survivedCount + errorCount;
  const killRate = totalMutations > 0 ? (killedCount / totalMutations) * 100 : 0;

  console.log(`  -> ${killedCount}/${totalMutations} mutations killed (${killRate.toFixed(2)}%)`);

  return {
    runPath,
    runName,
    sourceFile,
    testFile,
    totalMutations,
    killedMutations: killedCount,
    survivedMutations: survivedCount,
    errorMutations: errorCount,
    killRate,
    mutations: mutationResults,
  };
}

/**
 * Main function
 */
function main() {
  console.log('='.repeat(80));
  console.log('Mutation Testing Framework - Formal Agent Contracts Evaluation');
  console.log('='.repeat(80));
  console.log();

  // Create Jest config
  const jestConfig = `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  testMatch: ['**/*.test.ts'],
};`;
  fs.writeFileSync(path.join(WORK_DIR, 'jest.config.js'), jestConfig);

  // Find all runs
  const runsDir = path.join(EVAL_ROOT, 'runs');
  const allRuns = [];

  for (const group of ['control', 'treatment']) {
    const groupDir = path.join(runsDir, group);
    if (fs.existsSync(groupDir)) {
      const taskDirs = fs.readdirSync(groupDir);
      for (const taskDir of taskDirs) {
        const runPath = path.join(groupDir, taskDir);
        if (fs.statSync(runPath).isDirectory()) {
          allRuns.push(runPath);
        }
      }
    }
  }

  allRuns.sort();

  console.log(`Found ${allRuns.length} runs to process`);
  console.log();

  // Process all runs
  const results = [];
  for (let i = 0; i < allRuns.length; i++) {
    const runPath = allRuns[i];
    const result = processRun(runPath);
    if (result) {
      results.push(result);
    }
    process.stdout.write(`Progress: ${i + 1}/${allRuns.length}\r`);
  }
  console.log();
  console.log(`Completed processing ${results.length} runs.`);
  console.log();

  // Calculate summary statistics
  const totalMutations = results.reduce((sum, r) => sum + r.totalMutations, 0);
  const totalKilled = results.reduce((sum, r) => sum + r.killedMutations, 0);
  const overallKillRate = totalMutations > 0 ? (totalKilled / totalMutations) * 100 : 0;

  const controlResults = results.filter(r => r.runName.includes('/control/'));
  const treatmentResults = results.filter(r => r.runName.includes('/treatment/'));

  const controlKillRate = controlResults.length > 0
    ? (controlResults.reduce((sum, r) => sum + r.killedMutations, 0) /
       controlResults.reduce((sum, r) => sum + r.totalMutations, 0)) * 100
    : 0;

  const treatmentKillRate = treatmentResults.length > 0
    ? (treatmentResults.reduce((sum, r) => sum + r.killedMutations, 0) /
       treatmentResults.reduce((sum, r) => sum + r.totalMutations, 0)) * 100
    : 0;

  console.log('='.repeat(80));
  console.log('SUMMARY STATISTICS');
  console.log('='.repeat(80));
  console.log(`Overall Kill Rate: ${overallKillRate.toFixed(2)}% (${totalKilled}/${totalMutations})`);
  console.log(`Control Group: ${controlKillRate.toFixed(2)}% (${controlResults.length} runs)`);
  console.log(`Treatment Group: ${treatmentKillRate.toFixed(2)}% (${treatmentResults.length} runs)`);
  console.log();

  // Save results
  const outputPath = path.join(EVAL_ROOT, 'results', 'mutation-scores.json');
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const output = {
    timestamp: new Date().toISOString(),
    summary: {
      totalRuns: results.length,
      totalMutations,
      totalKilled,
      overallKillRate,
      controlGroupKillRate: controlKillRate,
      treatmentGroupKillRate: treatmentKillRate,
      controlRunCount: controlResults.length,
      treatmentRunCount: treatmentResults.length,
    },
    results,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`Results saved to: ${outputPath}`);
}

main();
