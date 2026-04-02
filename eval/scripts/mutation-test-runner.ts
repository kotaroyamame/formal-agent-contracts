/**
 * Mutation Testing Framework for Formal Agent Contracts Evaluation
 *
 * This script applies semantic mutations to source code and runs tests to measure
 * how many mutations are "killed" (detected) by the test suite.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface MutationResult {
  mutationId: string;
  operator: string;
  description: string;
  killed: boolean;
  error?: string;
}

interface RunResult {
  runPath: string;
  runName: string;
  sourceFile: string;
  testFile: string;
  totalMutations: number;
  killedMutations: number;
  survivedMutations: number;
  errorMutations: number;
  killRate: number;
  mutations: MutationResult[];
}

// Mutation operators
type MutationOperator =
  | 'M-BOUNDARY'
  | 'M-OFF-BY-ONE'
  | 'M-REMOVE-CHECK'
  | 'M-SWAP-OPERATOR'
  | 'M-REMOVE-ATOMICITY'
  | 'M-NEGATE-CONDITION';

interface Mutation {
  operator: MutationOperator;
  pattern: RegExp | string;
  replacement: string | ((match: string) => string);
  description: string;
}

const EVAL_ROOT = '/sessions/kind-funny-sagan/mnt/formal-agent-contracts/eval';
const WORK_DIR = '/sessions/kind-funny-sagan/mutation-test-work';

/**
 * Find all source file mutations applicable to the given source code
 */
function generateMutations(sourceCode: string, sourceFile: string): Mutation[] {
  const mutations: Mutation[] = [];
  const fileName = path.basename(sourceFile);

  // M-BOUNDARY: Change < to <= and > to >=
  if (sourceCode.includes('<') && !sourceCode.includes('<<')) {
    mutations.push({
      operator: 'M-BOUNDARY',
      pattern: /([^<])<([^=<])/g,
      replacement: (match) => match.replace('<', '<='),
      description: 'Change < to <=',
    });
  }
  if (sourceCode.includes('>') && !sourceCode.includes('>>')) {
    mutations.push({
      operator: 'M-BOUNDARY',
      pattern: /([^>])>([^=>-])/g,
      replacement: (match) => match.replace('>', '>='),
      description: 'Change > to >=',
    });
  }

  // M-OFF-BY-ONE: Numeric constant mutations (1000000, 1000001, 999999, etc.)
  const numberPattern = /\b(\d{6,})\b/g;
  if (numberPattern.test(sourceCode)) {
    mutations.push({
      operator: 'M-OFF-BY-ONE',
      pattern: /\b1000000\b/g,
      replacement: '999999',
      description: 'Change 1000000 to 999999',
    });
    mutations.push({
      operator: 'M-OFF-BY-ONE',
      pattern: /\b1000000\b/g,
      replacement: '1000001',
      description: 'Change 1000000 to 1000001',
    });
  }

  // M-REMOVE-CHECK: Remove validation checks (if-throw blocks)
  // Pattern: if (...) { throw new Error(...) }
  if (sourceCode.includes('throw new Error')) {
    mutations.push({
      operator: 'M-REMOVE-CHECK',
      pattern: /if\s*\([^)]+\)\s*\{\s*(?:const\s+\w+[^}]*?)?\s*throw\s+new\s+Error\([^)]*\)[^}]*\}/g,
      replacement: '// removed check',
      description: 'Remove validation check',
    });
  }

  // M-SWAP-OPERATOR: Change + to - and vice versa
  if (sourceCode.includes('+')) {
    mutations.push({
      operator: 'M-SWAP-OPERATOR',
      pattern: /([^+])\+([^=+])/g,
      replacement: (match) => match.replace('+', '-'),
      description: 'Change + to -',
    });
  }
  if (sourceCode.includes('-')) {
    mutations.push({
      operator: 'M-SWAP-OPERATOR',
      pattern: /([^-])-([^=\-])/g,
      replacement: (match) => match.replace('-', '+'),
      description: 'Change - to +',
    });
  }

  // M-REMOVE-ATOMICITY: Remove balance check before deduction
  if (sourceCode.includes('balance') && sourceCode.includes('-=')) {
    mutations.push({
      operator: 'M-REMOVE-ATOMICITY',
      pattern: /if\s*\([^)]*\.balance[^)]*\)\s*\{\s*throw[^}]*\}/g,
      replacement: '// atomicity check removed',
      description: 'Remove balance validation before transfer',
    });
  }

  // M-NEGATE-CONDITION: Add ! to boolean conditions
  if (sourceCode.includes('if')) {
    mutations.push({
      operator: 'M-NEGATE-CONDITION',
      pattern: /if\s*\(\s*([^!][^)]*)\s*\)/g,
      replacement: 'if (!($1)',
      description: 'Negate if condition',
    });
  }

  return mutations;
}

/**
 * Apply a single mutation to source code
 */
function applyMutation(sourceCode: string, mutation: Mutation): string {
  if (typeof mutation.replacement === 'string') {
    return sourceCode.replace(mutation.pattern, mutation.replacement);
  } else {
    return sourceCode.replace(mutation.pattern, mutation.replacement);
  }
}

/**
 * Run Jest tests on a specific source/test pair
 */
function runTests(
  workDir: string,
  testFileName: string,
  sourceFileName: string,
  sourceCode: string
): boolean {
  try {
    // Write mutated source to work directory
    const sourcePathInWork = path.join(workDir, sourceFileName);
    fs.writeFileSync(sourcePathInWork, sourceCode);

    // Run jest on the test file
    const jestConfig = path.join(workDir, 'jest.config.js');
    const testPath = path.join(workDir, testFileName);

    try {
      execSync(
        `cd ${workDir} && npx jest "${testPath}" --no-coverage --silent 2>&1`,
        { encoding: 'utf-8', stdio: 'pipe' }
      );
      // All tests passed - mutation survived
      return false;
    } catch (error: any) {
      // Tests failed - mutation was killed
      return true;
    }
  } catch (error: any) {
    console.error(`Test execution error: ${error.message}`);
    return false;
  }
}

/**
 * Process a single run
 */
function processRun(runPath: string): RunResult | null {
  const runName = path.relative(EVAL_ROOT, runPath).split(path.sep).slice(0, 2).join('/');

  // Find source and test files
  const files = fs.readdirSync(runPath);
  const sourceFile = files.find(f => f.endsWith('.ts') && !f.endsWith('.test.ts'));
  const testFile = files.find(f => f.endsWith('.test.ts'));

  if (!sourceFile || !testFile) {
    console.log(`[SKIP] ${runName}: Missing source or test file`);
    return null;
  }

  const sourceFilePath = path.join(runPath, sourceFile);
  const testFilePath = path.join(runPath, testFile);

  console.log(`[PROCESS] ${runName}`);

  // Read original source
  const originalSource = fs.readFileSync(sourceFilePath, 'utf-8');

  // Generate mutations
  const mutations = generateMutations(originalSource, sourceFilePath);
  const mutationResults: MutationResult[] = [];

  let killedCount = 0;
  let survivedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < mutations.length; i++) {
    const mutation = mutations[i];

    // Try to apply mutation
    let mutatedSource = originalSource;
    try {
      mutatedSource = applyMutation(originalSource, mutation);

      // Check if mutation actually changed the code
      if (mutatedSource === originalSource) {
        // Mutation didn't match - skip
        continue;
      }

      // Copy test file to work directory
      const testContent = fs.readFileSync(testFilePath, 'utf-8');
      const testPathInWork = path.join(WORK_DIR, testFile);
      fs.writeFileSync(testPathInWork, testContent);

      // Run tests with mutated source
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

    } catch (error: any) {
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
 * Main entry point
 */
async function main() {
  console.log('='.repeat(80));
  console.log('Mutation Testing Framework - Formal Agent Contracts Evaluation');
  console.log('='.repeat(80));
  console.log();

  // Create Jest config in work directory
  const jestConfig = `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: ['**/*.ts', '!**/*.test.ts'],
};`;
  fs.writeFileSync(path.join(WORK_DIR, 'jest.config.js'), jestConfig);

  // Write tsconfig.json for ts-jest
  const tsConfig = {
    compilerOptions: {
      target: 'ES2020',
      module: 'commonjs',
      lib: ['ES2020'],
      declaration: true,
      outDir: './dist',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
    },
  };
  fs.writeFileSync(path.join(WORK_DIR, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));

  // Find all runs
  const runsDir = path.join(EVAL_ROOT, 'runs');
  const allRuns: string[] = [];

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
  const results: RunResult[] = [];
  for (let i = 0; i < allRuns.length; i++) {
    const runPath = allRuns[i];
    const result = processRun(runPath);
    if (result) {
      results.push(result);
    }
    process.stdout.write(`Progress: ${i + 1}/${allRuns.length}\r`);
  }
  console.log(`\nCompleted processing all runs.`);
  console.log();

  // Calculate summary statistics
  const totalMutations = results.reduce((sum, r) => sum + r.totalMutations, 0);
  const totalKilled = results.reduce((sum, r) => sum + r.killedMutations, 0);
  const overallKillRate = totalMutations > 0 ? (totalKilled / totalMutations) * 100 : 0;

  // Group results by control/treatment
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
  console.log(`Control Group Kill Rate: ${controlKillRate.toFixed(2)}%`);
  console.log(`Treatment Group Kill Rate: ${treatmentKillRate.toFixed(2)}%`);
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
    },
    results,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`Results saved to: ${outputPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
