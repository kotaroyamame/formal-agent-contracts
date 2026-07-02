# Mutation Testing Report
## Formal Agent Contracts Evaluation — Phase 1 Enhancement

**Report Generated:** 2026-04-02
**Method:** Automated mutation injection and test execution
**Scope:** All 30 evaluation runs (15 control, 15 treatment) across 3 benchmark tasks
**Tool:** Custom mutation testing runner (eval/scripts/mutation-test-runner.js)

---

## Executive Summary

Mutation testing was applied to all 30 trial runs from the Formal Agent Contracts evaluation to assess the fault-detection capability of generated test suites. Both control and treatment groups achieved a **100% mutation kill rate** (46/46 mutations killed). Given the small mutation set (avg 1.5 per run) and the uniform ceiling, this indicates that AI-generated tests — with or without formal specification guidance — catch these shallow mutation types, but it provides no discriminative power between the groups (see Limitations).

A secondary observation: **more mutations were applicable to treatment code per run** (1.67 vs 1.40), and some mutation types (e.g., NEG-amount) had applicable sites only in treatment code. This reflects properties of the generated code (more mutable boundary/validation sites) rather than superior test detection, and is consistent with — though not independent confirmation of — more explicit, testable boundary conditions.

---

## Methodology

### Mutation Operators

Six semantic mutation operators were defined; per mutation-scores.json, only three produced applicable mutations in the evaluated code (numeric off-by-one NUM-*, boundary comparison LT-LE, condition negation NEG-*). M-REMOVE-CHECK, M-SWAP-OPERATOR, and M-REMOVE-ATOMICITY yielded no applied mutations:

| Operator | Description | Example |
|----------|-------------|---------|
| M-OFF-BY-ONE | Change numeric constants by ±1 | `1000000` → `999999` / `1000001` |
| M-BOUNDARY | Change `<` to `<=` or vice versa | `balance < limit` → `balance <= limit` |
| M-REMOVE-CHECK | Delete guard conditions | Remove `if (amount < 0) throw` |
| M-SWAP-OPERATOR | Replace arithmetic operators | `+` → `-` |
| M-NEGATE-CONDITION | Invert boolean conditions | `isActive` → `!isActive` |
| M-REMOVE-ATOMICITY | Remove state transition guards | Delete concurrency checks |

### Execution Process

For each of the 30 runs:
1. Identify mutable locations in source code using AST-pattern matching
2. Apply mutations one at a time (one-mutation-per-run model)
3. Execute the test suite against each mutant
4. Record killed (test failure) or survived (test passed)

---

## Results Summary

| Group | Runs | Total Mutations | Killed | Kill Rate | Avg Mutations/Run |
|-------|------|----------------|--------|-----------|-------------------|
| Control | 15 | 21 | 21 | **100%** | 1.40 |
| Treatment | 15 | 25 | 25 | **100%** | 1.67 |
| **Overall** | **30** | **46** | **46** | **100%** | 1.53 |

---

## Detailed Results

### Control Group (15 runs)

| Task | Run | Mutations | Killed | Mutation Types |
|------|-----|-----------|--------|---------------|
| task1-bank-account | 1 | 2 | 2 | NUM-1000000-1, LT-LE |
| task1-bank-account | 2 | 2 | 2 | NUM-1000000-1, LT-LE |
| task1-bank-account | 3 | 2 | 2 | NUM-1000000-1, LT-LE |
| task1-bank-account | 4 | 2 | 2 | NUM-1000000-1, LT-LE |
| task1-bank-account | 5 | 1 | 1 | LT-LE |
| task2-library | 1 | 1 | 1 | LT-LE |
| task2-library | 2 | 1 | 1 | LT-LE |
| task2-library | 3 | 1 | 1 | LT-LE |
| task2-library | 4 | 2 | 2 | NUM-3600000-1, LT-LE |
| task2-library | 5 | 1 | 1 | LT-LE |
| task3-auction | 1 | 1 | 1 | LT-LE |
| task3-auction | 2 | 1 | 1 | LT-LE |
| task3-auction | 3 | 1 | 1 | LT-LE |
| task3-auction | 4 | 2 | 2 | NUM-60000-1, LT-LE |
| task3-auction | 5 | 1 | 1 | LT-LE |

**Control Total:** 21 mutations, 21 killed (100%)

### Treatment Group (15 runs)

| Task | Run | Mutations | Killed | Mutation Types |
|------|-----|-----------|--------|---------------|
| task1-bank-account | 1 | 3 | 3 | NUM-1000000-1, LT-LE, **NEG-amount** |
| task1-bank-account | 2 | 2 | 2 | NUM-1000000-1, LT-LE |
| task1-bank-account | 3 | 2 | 2 | NUM-1000000-1, LT-LE |
| task1-bank-account | 4 | 3 | 3 | NUM-1000000-1, LT-LE, **NEG-amount** |
| task1-bank-account | 5 | 2 | 2 | NUM-1000000-1, LT-LE |
| task2-library | 1 | 1 | 1 | LT-LE |
| task2-library | 2 | 1 | 1 | LT-LE |
| task2-library | 3 | 1 | 1 | LT-LE |
| task2-library | 4 | 1 | 1 | LT-LE |
| task2-library | 5 | 1 | 1 | LT-LE |
| task3-auction | 1 | 1 | 1 | LT-LE |
| task3-auction | 2 | 2 | 2 | **NUM-300000-1**, LT-LE |
| task3-auction | 3 | 2 | 2 | **NUM-300000-1**, LT-LE |
| task3-auction | 4 | 1 | 1 | LT-LE |
| task3-auction | 5 | 2 | 2 | **NUM-300000-1**, LT-LE |

**Treatment Total:** 25 mutations, 25 killed (100%)

---

## Per-Task Analysis

### Task 1: Bank Account System (Low Complexity)

| Metric | Control (5 runs) | Treatment (5 runs) |
|--------|-------------------|---------------------|
| Total Mutations | 9 | 12 |
| Avg Mutations/Run | 1.8 | **2.4** |
| Kill Rate | 100% | 100% |
| Unique Mutation Types | 2 (NUM, LT-LE) | **3 (NUM, LT-LE, NEG)** |

Treatment runs produced code with more mutable boundary conditions. The `NEG-amount` mutation type (negation of the amount parameter in validation) appeared exclusively in 2/5 treatment runs, which is consistent with — though at n=5 not sufficient to establish — formal specifications leading to more explicit parameter validation in the generated code.

### Task 2: Library System (Medium Complexity)

| Metric | Control (5 runs) | Treatment (5 runs) |
|--------|-------------------|---------------------|
| Total Mutations | 6 | 5 |
| Avg Mutations/Run | 1.2 | 1.0 |
| Kill Rate | 100% | 100% |
| Unique Mutation Types | 2 (NUM, LT-LE) | 1 (LT-LE) |

Task 2 showed similar performance. One numeric constant mutation (NUM-3600000-1) was applicable only to control code — treatment code had no matching site, likely due to implementation differences in timeout handling.

### Task 3: Auction System (High Complexity)

| Metric | Control (5 runs) | Treatment (5 runs) |
|--------|-------------------|---------------------|
| Total Mutations | 6 | **8** |
| Avg Mutations/Run | 1.2 | **1.6** |
| Kill Rate | 100% | 100% |
| NUM boundary hits | 1/5 (20%) | **3/5 (60%)** |

Numeric-constant mutations were applicable more consistently in treatment runs' auction timeout logic (NUM-300000-1 in 3/5 runs vs NUM-60000-1 in 1/5 control runs), suggesting that formal specs produced more explicit boundary definitions in the generated code.

---

## Interpretation

### Primary Finding: Tests Are Functionally Sound

The 100% kill rate for both groups shows that the generated test suites detected all 46 injected mutations (avg 1.5 per run). This is a **positive baseline result**, but the small mutation count and the ceiling effect (see Limitations) mean it neither measures overall code quality nor differentiates the two conditions.

### Secondary Finding: Treatment Code Exposes a Broader Mutation Surface

| Metric | Control | Treatment | Difference |
|--------|---------|-----------|------------|
| Avg mutations/run | 1.40 | 1.67 | +19.3% |
| Unique mutation types (Task 1) | 2 | 3 | +1 type |
| NUM boundary consistency (Task 3) | 20% | 60% | +40pp |

The treatment group's broader mutation surface suggests that formal specification-guided development produces code with **more explicit boundary conditions**. This is consistent with the primary evaluation's M2 (Spec Coverage) result of +42.8pp.

### Relationship to Primary Evaluation Metrics

| Primary Metric | Primary Result | Mutation Testing Support |
|---------------|----------------|--------------------------|
| M1 (Correctness) | +11.8pp | Both groups kill all applied mutations — no group difference detectable on this metric due to the 100% ceiling |
| M2 (Spec Coverage) | +42.8pp | More diverse mutation types applicable to treatment code — a property of the generated code |
| M4 (Explicitness) | +91.1pp | Not directly measured by mutation testing |
| M6 (Test Structure) | +20.3pp | More applicable mutation sites per run in treatment code — a property of the generated code, not direct evidence of broader test targeting |

### Limitations

1. **Ceiling effect**: 100% kill rate prevents differentiation on this metric alone
2. **Limited mutation operators**: 6 operators defined but only 3 produced applicable mutations; semantic/concurrency mutations could reveal larger differences
3. **Small mutation count per run**: Avg 1.5 mutations limits statistical power
4. **Framework differences**: Jest (control) vs Vitest (treatment) could affect mutation applicability

---

## Conclusion

The mutation testing phase shows that both control and treatment groups produce test suites that caught all 46 injected mutations (100% kill rate); because both groups hit this ceiling, the metric does not discriminate between them. A secondary observation — more applicable mutation sites per run in treatment code (1.67 vs 1.40, +19.3%) and additional applicable mutation types (NEG-amount) — is directionally consistent with the primary evaluation's findings, particularly M2 (Spec Coverage +42.8pp) and M6 (Test Structure +20.3pp), but it reflects the structure of the generated code rather than test quality, and does not independently confirm that formal specification-guided development produces more thorough and explicit code.

---

## Raw Data

- Results: [mutation-scores.json](mutation-scores.json)
- Test runner: [mutation-test-runner.js](../scripts/mutation-test-runner.js)
- Primary evaluation: [scores.json](scores.json)
