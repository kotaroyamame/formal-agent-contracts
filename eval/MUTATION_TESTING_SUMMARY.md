# Mutation Testing Framework - Implementation Summary

## Overview

A lightweight mutation testing harness (46 mutations total, avg ~1.5 per run) was implemented for the Formal Agent Contracts evaluation to probe test suite quality across 30 trial runs (15 control group, 15 treatment group).

## Execution Results

### Final Statistics
- **Runs Processed:** 30 (15 control + 15 treatment)
- **Total Mutations Applied:** 46
- **Total Mutations Killed:** 46
- **Overall Kill Rate:** 100%

### Group Comparison

| Group | Runs | Mutations | Killed | Kill Rate |
|-------|------|-----------|--------|-----------|
| Control (OOP) | 15 | 21 | 21 | 100% |
| Treatment (VDM-SL) | 15 | 25 | 25 | 100% |
| **TOTAL** | **30** | **46** | **46** | **100%** |

### Task Breakdown

| Task | Runs | Mutations | Killed | Kill Rate |
|------|------|-----------|--------|-----------|
| task1-bank-account | 10 | 21 | 21 | 100% |
| task2-library | 10 | 11 | 11 | 100% |
| task3-auction | 10 | 14 | 14 | 100% |

## Implementation Details

### Mutation Framework (mutation-fast.js)

**Location:** originally `/sessions/kind-funny-sagan/mutation-fast.js` in the run sandbox (not preserved in this repository); the in-repo equivalent is `eval/scripts/mutation-test-runner.js`

**Key Features:**
1. Automatic test framework detection (Jest for control, Vitest for treatment)
2. Semantic mutation operators defined (six in total):
   - M-OFF-BY-ONE: Numeric constant variations (±1)
   - M-BOUNDARY: Boundary condition changes (< to <=, > to >=)
   - M-SWAP-OPERATOR: Arithmetic operator substitution (+ to -) — yielded no applied mutations in the evaluated code
   - M-NEGATE-CONDITION: Boolean condition inversion
   - M-REMOVE-CHECK: Remove validation checks — yielded no applied mutations in the evaluated code
   - M-REMOVE-ATOMICITY: Remove state transition guards — yielded no applied mutations in the evaluated code

   Of these, only M-OFF-BY-ONE (NUM-*), M-BOUNDARY (LT-LE), and M-NEGATE-CONDITION (NEG-*) produced applied mutations (see mutation-scores.json).

3. Parallel test execution with timeout handling (5-6 seconds per mutation)
4. Automatic mutation result tracking

### Mutation Detection Strategy

For each run:
1. Read original source code (.ts file)
2. Generate applicable mutations based on code patterns
3. Apply each mutation independently
4. Execute corresponding test suite (.test.ts)
5. Record: killed (test failed) or survived (test passed)

### Key Patterns Detected

**Numeric Mutations (NUM-*):**
- 1000000 → 999999, 1000001 (withdrawal/transfer limits)

**Boundary Mutations (LT-LE):**
- amount <= 0 → boundary checks for positive values
- < vs <= comparisons

**Condition Mutations (NEG-*):**
- amount > 0 negation
- !member / !book / !account checks

(Arithmetic operator-swap patterns were defined but no applicable sites existed in the evaluated code — no operator-swap mutations were applied.)

## Results Analysis

### Test Suite Quality

Both control and treatment groups achieved **100% mutation kill rate** on the applied mutations, indicating:

1. **Coverage of mutated sites:** Test suites detect all applied mutations (avg ~1.5 per run)
2. **Validation at those sites:** The mutated business-logic locations are tested
3. **No detectable gap on this metric:** Both approaches hit the 100% ceiling, so kill rate cannot differentiate them

### By Approach

**Control Group (Standard OOP):**
- Bank Account tests: Strong mutation detection
- Library system tests: Condition coverage at mutated sites
- Auction system tests: Effective boundary validation

**Treatment Group (VDM-SL Formal Methods):**
- Bank Account tests: Additional pre/post-condition checks
- Library system tests: State invariant validation
- Auction system tests: State machine mutation detection

### Mutation Distribution

- **Numeric off-by-one mutations (NUM-*):** 14/14 killed (100%)
- **Boundary comparison mutations (LT-LE):** 30/30 killed (100%)
- **Condition negation mutations (NEG-*):** 2/2 killed (100%)

## Output Files

**Primary Results:**
- `eval/results/mutation-scores.json`
  - Detailed mutation results for all 30 runs
  - Per-run and per-group statistics
  - Individual mutation outcomes

**Reports:**
- `eval/results/mutation-report.md`
  - Analysis report
  - Methodology documentation
  - Detailed findings and interpretation

**Scripts:**
- `eval/scripts/mutation-test-runner.ts`
  - Original TypeScript implementation (archived)
- `eval/scripts/mutation-test-runner.js`
  - Runner implementation (Node.js); the sandbox variant `mutation-fast.js` and its development/optimization variants (`mutation-*.js`) were not preserved in this repository

## Technical Stack

- **Node.js v22** with native module support
- **Jest** for control group tests
- **Vitest** for treatment group tests
- **ts-jest** for TypeScript compilation
- **Automatic framework detection** for test execution

## Performance Metrics

- **Total Execution Time:** ~94 seconds
- **Average Per Run:** ~3.1 seconds
- **Timeout Per Mutation:** 5-6 seconds

## Conclusions

1. **Test Quality:** Both control (OOP) and treatment (VDM-SL) test suites detected all of the small set of applied mutations (46 total, avg ~1.5 per run); effectiveness against deeper semantic or concurrency faults was not assessed

2. **Formal Methods Impact:** No difference in mutation kill rate was observed (both approaches 100%); because both groups hit the ceiling, this metric cannot detect a quality difference in either direction

3. **Coverage Signal:** The mutation testing indicates the mutated business-logic locations are covered by tests; with ~1.5 mutations per run it does not validate thorough testing overall

4. **Observation:** Within these benchmark tasks, neither approach showed a test-effectiveness disadvantage on the applied mutations; production-readiness was not evaluated, so the choice between approaches should rest on other evidence (maintainability, verification capabilities, and the primary evaluation's stated limitations)

## Future Enhancements

1. **Extended Mutation Set:** Additional mutation operators (CRUD operations, boundary-crossing, off-by-one in iterations)
2. **Parallel Execution:** Multi-threaded mutation application for faster execution
3. **Advanced Metrics:** Mutation impact analysis, code coverage correlation
4. **Integration:** Continuous mutation testing in CI/CD pipeline

---

**Report Generated:** 2026-04-02
**Framework Version:** 1.0
**Status:** Complete
