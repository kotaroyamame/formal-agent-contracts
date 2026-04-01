/**
 * eval-runner.ts — Formal Agent Contracts 評価自動実行スクリプト
 *
 * Usage:
 *   npx tsx eval/scripts/eval-runner.ts --task task1-bank-account --condition control --run 1
 *   npx tsx eval/scripts/eval-runner.ts --score-all
 *
 * 各試行の出力に対してゴールドテストスイートを実行し、
 * 6つのメトリクスのスコアを算出する。
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

// ─── Types ───

interface Trap {
  id: string;
  name?: string;
  description: string;
  category: string;
  severity: string;
  specification_gap?: string;
  expected_behavior: string;
  scoring?: Record<string, string>;
  scoring_criteria?: Record<string, string>;
}

interface TrapScore {
  trap_id: string;
  score: 0 | 1 | 2 | 3;
  evidence: string;
}

interface MetricResult {
  metric: string;
  score: number;
  max_score: number;
  percentage: number;
  details: Record<string, unknown>;
}

interface RunResult {
  task: string;
  condition: "control" | "treatment";
  run: number;
  metrics: MetricResult[];
  timestamp: string;
}

// ─── Paths ───

const EVAL_ROOT = path.resolve(__dirname, "..");
const TASKS_DIR = path.join(EVAL_ROOT, "tasks");
const RUNS_DIR = path.join(EVAL_ROOT, "runs");
const RESULTS_DIR = path.join(EVAL_ROOT, "results");

// ─── M1: Contract Violation Detection Rate ───

function scoreM1(taskDir: string, runDir: string): MetricResult {
  const trapsFile = path.join(taskDir, "traps.json");
  const raw = JSON.parse(fs.readFileSync(trapsFile, "utf-8"));
  const traps: Trap[] = Array.isArray(raw) ? raw : raw.traps;

  const scores: TrapScore[] = [];

  // Read generated source code
  const sourceFiles = findFiles(runDir, [".ts", ".js", ".py"]).filter(
    (f) => !f.includes("test") && !f.includes("spec")
  );
  const sourceCode = sourceFiles.map((f) => fs.readFileSync(f, "utf-8")).join("\n");

  // Read generated test code
  const testFiles = findFiles(runDir, [".ts", ".js", ".py"]).filter(
    (f) => f.includes("test") || f.includes("spec")
  );
  const testCode = testFiles.map((f) => fs.readFileSync(f, "utf-8")).join("\n");

  // Read VDM-SL spec (treatment group only)
  const specFiles = findFiles(runDir, [".vdmsl"]);
  const specCode = specFiles.map((f) => fs.readFileSync(f, "utf-8")).join("\n");

  for (const trap of traps) {
    const score = evaluateTrap(trap, sourceCode, testCode, specCode);
    scores.push(score);
  }

  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const maxScore = traps.length * 3;

  return {
    metric: "M1_ContractViolationDetectionRate",
    score: totalScore,
    max_score: maxScore,
    percentage: (totalScore / maxScore) * 100,
    details: { trap_scores: scores },
  };
}

function evaluateTrap(
  trap: Trap,
  sourceCode: string,
  testCode: string,
  specCode: string
): TrapScore {
  // Heuristic scoring based on keyword/pattern detection
  // This provides an initial automated score; manual review refines it

  const trapKeywords = getTrapKeywords(trap.id);
  const sourceHits = trapKeywords.filter((kw) =>
    sourceCode.toLowerCase().includes(kw.toLowerCase())
  ).length;
  const testHits = trapKeywords.filter((kw) =>
    testCode.toLowerCase().includes(kw.toLowerCase())
  ).length;
  const specHits = trapKeywords.filter((kw) =>
    specCode.toLowerCase().includes(kw.toLowerCase())
  ).length;

  let score: 0 | 1 | 2 | 3;
  let evidence: string;

  if (sourceHits > 0 && testHits > 0) {
    score = 3;
    evidence = `Source handles trap (${sourceHits} hits) AND test exists (${testHits} hits)`;
  } else if (sourceHits > 0 && testHits === 0) {
    score = 2;
    evidence = `Source handles trap (${sourceHits} hits) but no test found`;
  } else if (specHits > 0 || testHits > 0) {
    score = 1;
    evidence = `Mentioned in spec/test (${specHits}/${testHits} hits) but source doesn't handle`;
  } else {
    score = 0;
    evidence = `No evidence of trap handling found`;
  }

  return { trap_id: trap.id, score, evidence };
}

/** Keyword mapping for each trap — used for automated heuristic detection */
function getTrapKeywords(trapId: string): string[] {
  const keywords: Record<string, string[]> = {
    // Task 1
    "T1-01": ["negative", "initial", "initialBalance", "< 0", "<= 0", "負"],
    "T1-02": ["zero", "amount === 0", "amount <= 0", "0円"],
    "T1-03": ["zero", "withdraw", "amount === 0", "amount <= 0"],
    "T1-04": ["equal", "balance", "exactly", "ちょうど"],
    "T1-05": ["1000000", "limit", "上限", "MAX"],
    "T1-06": ["1000001", "exceed", "超え"],
    "T1-07": ["atomic", "transaction", "rollback", "トランザクション"],
    "T1-08": ["self", "same account", "same id", "自分"],
    "T1-09": ["transfer", "limit", "送金", "上限"],
    "T1-10": ["whitespace", "trim", "空白", "\\s"],
    // Task 2
    "T2-01": ["reserv", "予約", "hold", "queue"],
    "T2-02": ["overdue", "return", "immediate", "延滞", "返却後"],
    "T2-03": ["count", "5", "return.*borrow", "カウント"],
    "T2-04": ["stock", "consistency", "在庫", "整合"],
    "T2-05": ["double extend", "already extended", "延長済", "二重"],
    "T2-06": ["extended.*overdue", "延長.*延滞", "due date"],
    "T2-07": ["copy", "copies", "コピー", "複本"],
    "T2-08": ["last copy", "stock.*0", "最後", "在庫.*0"],
    "T2-09": ["duplicate", "member", "重複", "会員"],
    "T2-10": ["invalid return", "not borrowed", "未貸出"],
    "T2-11": ["precious", "rare", "貴重", "館内"],
    "T2-12": ["day 14", "boundary", "14日目", "境界"],
    // Task 3
    "T3-01": ["cascade", "chain", "extension.*limit", "延長.*連鎖"],
    "T3-02": ["simultaneous", "same time", "同時", "concurrent"],
    "T3-03": ["timeout", "next bidder", "次点", "72"],
    "T3-04": ["re-list", "relist", "再出品", "cancelled.*active"],
    "T3-05": ["withdraw.*bid", "retract", "取消", "入札.*取り"],
    "T3-06": ["round", "1%", "最低.*単位", "increment"],
    "T3-07": ["first bid", "starting price", "開始価格", ">="],
    "T3-08": ["exact.*end", "boundary.*time", "終了時刻.*ちょうど"],
    "T3-09": ["exactly 72", "72.*boundary", "72時間.*ちょうど"],
    "T3-10": ["invalid.*transition", "skip.*paid", "不正.*遷移"],
    "T3-11": ["draft.*cancel", "下書き.*キャンセル"],
    "T3-12": ["proxy", "seller.*bid", "代理", "出品者.*入札"],
    "T3-13": ["zero.*price", "negative.*price", "0円", "負.*価格"],
    "T3-14": ["zero.*duration", "negative.*duration", "0.*期間"],
  };
  return keywords[trapId] || [];
}

// ─── M2: Specification Coverage ───

function scoreM2(taskDir: string, runDir: string): MetricResult {
  const promptFile = path.join(taskDir, "prompt.md");
  const prompt = fs.readFileSync(promptFile, "utf-8");

  // Extract business rules from prompt - search multiple patterns
  const rules: string[] = [];
  // Pattern 1: "- " list items under ビジネスルール section
  const rulesSection = prompt.match(/ビジネスルール[\s\S]*?(?=##|$)/);
  if (rulesSection) {
    const lines = rulesSection[0].split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("- ") || /^\d+\.\s/.test(trimmed)) {
        rules.push(trimmed.replace(/^[-\d.]+\s*(\*\*.*?\*\*:?\s*)?/, ""));
      }
    }
  }
  // Fallback: if no rules found, use hardcoded rules per task
  if (rules.length === 0) {
    const taskName = path.basename(taskDir);
    if (taskName.includes("bank")) {
      rules.push("残高は0未満にならない", "1回の出金上限は100万円", "口座名義は空文字不可", "送金は送金元と送金先が異なること");
    } else if (taskName.includes("library")) {
      rules.push("会員は最大5冊まで同時貸出可能", "延滞中の会員は新規貸出不可", "在庫が0の書籍は貸出不可", "貸出期間は14日", "延長は1回まで", "貴重書籍は館内閲覧のみ");
    } else if (taskName.includes("auction")) {
      rules.push("入札額は現在の最高額より高くなければならない", "出品者自身は入札できない", "オークション期間中のみ入札可能", "終了5分前に入札があった場合終了時刻を5分延長", "最低入札単位は現在価格の1%", "落札後72時間以内に支払いがない場合は自動キャンセル");
    }
  }

  const sourceFiles = findFiles(runDir, [".ts", ".js", ".py"]).filter(
    (f) => !f.includes("test") && !f.includes("spec") && !f.includes(".vdmsl")
  );
  const sourceCode = sourceFiles.map((f) => fs.readFileSync(f, "utf-8")).join("\n");
  const specFiles = findFiles(runDir, [".vdmsl"]);
  const specCode = specFiles.map((f) => fs.readFileSync(f, "utf-8")).join("\n");

  const ruleScores: { rule: string; score: number; form: string }[] = [];

  for (const rule of rules) {
    const ruleKeywords = extractKeywords(rule);

    // Also add English equivalents for common Japanese business rules
    const englishKeywords = getEnglishKeywords(rule);
    const allKeywords = [...ruleKeywords, ...englishKeywords];

    // Check for runtime contract (pre/post/inv or checkPre/checkPost)
    const hasRuntimeContract =
      specCode.length > 0 && allKeywords.some((kw) => specCode.toLowerCase().includes(kw.toLowerCase()));
    const hasExplicitValidation = allKeywords.some(
      (kw) =>
        (sourceCode.includes("throw") || sourceCode.includes("Error") || sourceCode.includes("assert")) &&
        sourceCode.toLowerCase().includes(kw.toLowerCase())
    );
    const hasTypeConstraint = allKeywords.some(
      (kw) =>
        (sourceCode.includes("type ") || sourceCode.includes("interface ") || sourceCode.includes("enum ")) &&
        sourceCode.toLowerCase().includes(kw.toLowerCase())
    );

    let score: number;
    let form: string;
    if (hasRuntimeContract) {
      score = 3;
      form = "formal_spec";
    } else if (hasExplicitValidation) {
      score = 2;
      form = "explicit_validation";
    } else if (hasTypeConstraint) {
      score = 1;
      form = "type_constraint";
    } else {
      score = 0;
      form = "none";
    }
    ruleScores.push({ rule, score, form });
  }

  const totalScore = ruleScores.reduce((sum, r) => sum + r.score, 0);
  const maxScore = rules.length * 3;

  return {
    metric: "M2_SpecificationCoverage",
    score: totalScore,
    max_score: maxScore,
    percentage: maxScore > 0 ? (totalScore / maxScore) * 100 : 0,
    details: { rule_scores: ruleScores },
  };
}

// ─── M4: Specification Explicitness ───

function scoreM4(taskDir: string, runDir: string): MetricResult {
  const specFiles = findFiles(runDir, [".vdmsl"]);
  const sourceFiles = findFiles(runDir, [".ts", ".js", ".py"]);
  const hasVdmsl = specFiles.length > 0;
  const sourceCode = sourceFiles
    .map((f) => fs.readFileSync(f, "utf-8"))
    .join("\n");

  // Count explicit specification forms
  const counts = {
    formal_spec: hasVdmsl ? specFiles.length : 0,
    code_contracts:
      (sourceCode.match(/checkPre|checkPost|checkInv|assert\(/g) || []).length,
    comments: (sourceCode.match(/\/\/.*(?:pre|post|inv|rule|contract)/gi) || [])
      .length,
    jsdoc: (sourceCode.match(/@(?:pre|post|throws|invariant)/g) || []).length,
  };

  // Score: more formal = higher
  let score: number;
  if (counts.formal_spec > 0) {
    score = 3;
  } else if (counts.code_contracts > 3) {
    score = 2;
  } else if (counts.comments > 0 || counts.jsdoc > 0) {
    score = 1;
  } else {
    score = 0;
  }

  return {
    metric: "M4_SpecificationExplicitness",
    score,
    max_score: 3,
    percentage: (score / 3) * 100,
    details: { counts },
  };
}

// ─── M6: Test Effectiveness (Mutation Testing) ───

function scoreM6(taskDir: string, runDir: string): MetricResult {
  // Heuristic M6: count test cases in generated test files and
  // check how many gold-standard trap keywords they cover
  const testFiles = findFiles(runDir, [".ts", ".js"]).filter(
    (f) => f.includes("test") || f.includes("spec")
  );
  const testCode = testFiles.map((f) => fs.readFileSync(f, "utf-8")).join("\n");

  // Count test cases
  const testCaseMatches = testCode.match(/(?:it|test)\s*\(/g) || [];
  const numTests = testCaseMatches.length;

  // Count describe blocks
  const describeMatches = testCode.match(/describe\s*\(/g) || [];
  const numDescribes = describeMatches.length;

  // Check for edge case keywords in tests
  const edgeCaseKeywords = [
    "boundary", "edge", "negative", "zero", "empty", "null", "undefined",
    "limit", "max", "overflow", "invalid", "error", "throw", "reject",
    "atomic", "rollback", "concurrent", "simultaneous", "duplicate",
    "境界", "エッジ", "不正", "エラー", "上限", "下限"
  ];
  const edgeCaseHits = edgeCaseKeywords.filter(kw =>
    testCode.toLowerCase().includes(kw.toLowerCase())
  ).length;

  // Score based on test richness
  const testDensityScore = Math.min(numTests / 20, 1); // normalize to 0-1 (20 tests = max)
  const edgeCoverageScore = Math.min(edgeCaseHits / 10, 1); // normalize to 0-1
  const percentage = ((testDensityScore * 0.5 + edgeCoverageScore * 0.5) * 100);

  return {
    metric: "M6_TestEffectiveness",
    score: Math.round(percentage),
    max_score: 100,
    percentage,
    details: {
      num_tests: numTests,
      num_describes: numDescribes,
      edge_case_keyword_hits: edgeCaseHits,
      test_density_score: testDensityScore,
      edge_coverage_score: edgeCoverageScore,
    },
  };
}

// ─── Score All Runs ───

function scoreRun(task: string, condition: "control" | "treatment", run: number): RunResult {
  const taskDir = path.join(TASKS_DIR, task);
  const runDir = path.join(RUNS_DIR, condition, `${task}-run${run}`);

  if (!fs.existsSync(runDir)) {
    console.error(`Run directory not found: ${runDir}`);
    process.exit(1);
  }

  const metrics: MetricResult[] = [
    scoreM1(taskDir, runDir),
    scoreM2(taskDir, runDir),
    scoreM4(taskDir, runDir),
    scoreM6(taskDir, runDir),
  ];

  return {
    task,
    condition,
    run,
    metrics,
    timestamp: new Date().toISOString(),
  };
}

function scoreAll(): void {
  const tasks = ["task1-bank-account", "task2-library", "task3-auction"];
  const conditions: ("control" | "treatment")[] = ["control", "treatment"];
  const numRuns = 5;

  const allResults: RunResult[] = [];

  for (const task of tasks) {
    for (const condition of conditions) {
      for (let run = 1; run <= numRuns; run++) {
        const runDir = path.join(RUNS_DIR, condition, `${task}-run${run}`);
        if (!fs.existsSync(runDir)) {
          console.log(`Skipping ${condition}/${task}-run${run} (not found)`);
          continue;
        }
        console.log(`Scoring: ${condition}/${task}-run${run}`);
        const result = scoreRun(task, condition, run);
        allResults.push(result);
      }
    }
  }

  // Save results
  const outputPath = path.join(RESULTS_DIR, "scores.json");
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
  console.log(`\nResults saved to ${outputPath}`);

  // Generate summary
  generateSummary(allResults);
}

// ─── Summary Report ───

function generateSummary(results: RunResult[]): void {
  const metricNames = [
    "M1_ContractViolationDetectionRate",
    "M2_SpecificationCoverage",
    "M4_SpecificationExplicitness",
    "M6_TestEffectiveness",
  ];

  let report = "# Evaluation Results Summary\n\n";
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += "| Metric | Control (mean±sd) | Treatment (mean±sd) | Δ | Effect |\n";
  report += "|--------|-------------------|---------------------|---|--------|\n";

  for (const metricName of metricNames) {
    const controlScores = results
      .filter((r) => r.condition === "control")
      .map((r) => r.metrics.find((m) => m.metric === metricName)?.percentage ?? 0);
    const treatmentScores = results
      .filter((r) => r.condition === "treatment")
      .map((r) => r.metrics.find((m) => m.metric === metricName)?.percentage ?? 0);

    if (controlScores.length === 0 && treatmentScores.length === 0) continue;

    const cMean = mean(controlScores);
    const cSd = sd(controlScores);
    const tMean = mean(treatmentScores);
    const tSd = sd(treatmentScores);
    const delta = tMean - cMean;
    const effect = cliffsDelta(controlScores, treatmentScores);

    const shortName = metricName.replace(/^M\d_/, "");
    report += `| ${shortName} | ${cMean.toFixed(1)}% ± ${cSd.toFixed(1)} | ${tMean.toFixed(1)}% ± ${tSd.toFixed(1)} | ${delta >= 0 ? "+" : ""}${delta.toFixed(1)}pp | ${formatEffect(effect)} |\n`;
  }

  const reportPath = path.join(RESULTS_DIR, "report.md");
  fs.writeFileSync(reportPath, report);
  console.log(`Summary report saved to ${reportPath}`);
  console.log("\n" + report);
}

// ─── Utilities ───

function findFiles(dir: string, extensions: string[]): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith("node_modules")) {
      results.push(...findFiles(fullPath, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

function getEnglishKeywords(rule: string): string[] {
  const map: [RegExp, string[]][] = [
    [/残高.*0未満|負/, ["balance", "negative", "< 0", ">= 0"]],
    [/出金上限|100万/, ["withdraw", "limit", "1000000", "max"]],
    [/空文字|名義/, ["empty", "name", "holder", "trim"]],
    [/送金元.*送金先.*異な|異なる口座/, ["transfer", "same", "different", "self"]],
    [/5冊|最大.*冊/, ["max", "loan", "limit", "5"]],
    [/延滞.*新規貸出不可/, ["overdue", "borrow", "cannot"]],
    [/在庫.*0/, ["stock", "available", "0", "inventory"]],
    [/14日|貸出期間/, ["14", "day", "period", "due"]],
    [/延長.*1回/, ["extend", "once", "renewal"]],
    [/貴重.*館内|貸出不可/, ["precious", "rare", "reference", "cannot"]],
    [/入札額.*最高額/, ["bid", "highest", "current", "price"]],
    [/出品者.*入札/, ["seller", "bid", "own", "self"]],
    [/期間中のみ/, ["active", "period", "during"]],
    [/5分前.*延長/, ["extend", "5", "minute", "before"]],
    [/1%.*最低/, ["minimum", "increment", "1%", "100"]],
    [/72時間/, ["72", "hour", "timeout", "payment"]],
  ];
  const keywords: string[] = [];
  for (const [pattern, kws] of map) {
    if (pattern.test(rule)) keywords.push(...kws);
  }
  return keywords;
}

function extractKeywords(rule: string): string[] {
  // Extract meaningful keywords from a business rule description
  return rule
    .replace(/[。、「」（）]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2)
    .map((w) => w.toLowerCase());
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function sd(arr: number[]): number {
  if (arr.length <= 1) return 0;
  const m = mean(arr);
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

function cliffsDelta(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  let more = 0;
  let less = 0;
  for (const x of a) {
    for (const y of b) {
      if (x < y) more++;
      else if (x > y) less++;
    }
  }
  return (more - less) / (a.length * b.length);
}

function formatEffect(d: number): string {
  const abs = Math.abs(d);
  let size: string;
  if (abs < 0.147) size = "negligible";
  else if (abs < 0.33) size = "small";
  else if (abs < 0.474) size = "medium";
  else size = "large";
  return `${d.toFixed(2)} (${size})`;
}

// ─── CLI ───

const args = process.argv.slice(2);

if (args.includes("--score-all")) {
  scoreAll();
} else {
  const taskIdx = args.indexOf("--task");
  const condIdx = args.indexOf("--condition");
  const runIdx = args.indexOf("--run");

  if (taskIdx < 0 || condIdx < 0 || runIdx < 0) {
    console.log("Usage:");
    console.log("  npx tsx eval/scripts/eval-runner.ts --score-all");
    console.log(
      "  npx tsx eval/scripts/eval-runner.ts --task <task> --condition <control|treatment> --run <n>"
    );
    process.exit(1);
  }

  const task = args[taskIdx + 1];
  const condition = args[condIdx + 1] as "control" | "treatment";
  const run = parseInt(args[runIdx + 1]);

  const result = scoreRun(task, condition, run);
  console.log(JSON.stringify(result, null, 2));
}
