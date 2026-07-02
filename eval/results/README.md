# Mutation Testing Results

This directory contains the complete results of the mutation testing framework applied to the Formal Agent Contracts evaluation.

## Quick Summary

- **Total Runs:** 30 (15 control, 15 treatment)
- **Total Mutations:** 46
- **Kill Rate:** 100% (all mutations detected)
- **Execution Time:** ~94 seconds

## Files in This Directory

### Primary Results

- **`mutation-scores.json`** - Complete mutation testing data in JSON format
  - Detailed results for all 30 runs
  - Individual mutation outcomes
  - Per-run and group statistics
  - Use this for machine-readable analysis

### Documentation

- **`mutation-report.md`** - Comprehensive technical report
  - Methodology and mutation operators
  - Detailed results breakdown
  - Analysis and interpretation
  - Control vs Treatment group comparison

- **`../MUTATION_TESTING_SUMMARY.md`** - Executive summary
  - Implementation details
  - Performance metrics
  - Key findings and conclusions
  - Technical stack information

- **`../EXECUTION_REPORT.txt`** - Execution log and completion checklist (generated in the original run environment; not included in this repository)
  - Task completion summary
  - Final statistics
  - Validation results
  - Key findings and conclusions

### Primary Evaluation Results

- **`scores.json`** - Primary evaluation metrics (M1/M2/M4/M6)
- **`report.md`** - Primary evaluation report (metrics M1/M2/M4/M6); the mutation testing results complement, rather than supersede, it

## Mutation Testing Results Summary

### By Group

| Group | Runs | Mutations | Killed | Rate |
|-------|------|-----------|--------|------|
| Control (OOP) | 15 | 21 | 21 | 100% |
| Treatment (VDM-SL) | 15 | 25 | 25 | 100% |

### By Task

| Task | Mutations | Killed | Rate |
|------|-----------|--------|------|
| task1-bank-account | 21 | 21 | 100% |
| task2-library | 11 | 11 | 100% |
| task3-auction | 14 | 14 | 100% |

## Mutation Operators Defined

1. **M-OFF-BY-ONE** - Change numeric constants by ±1
2. **M-BOUNDARY** - Change boundary operators (< to <=, > to >=)
3. **M-REMOVE-CHECK** - Remove validation checks
4. **M-SWAP-OPERATOR** - Change arithmetic operators (+ to -)
5. **M-REMOVE-ATOMICITY** - Remove atomicity checks
6. **M-NEGATE-CONDITION** - Negate boolean conditions

Of these, only M-OFF-BY-ONE/M-BOUNDARY (NUM-*, LT-LE) and M-NEGATE-CONDITION (NEG-*) produced applicable mutations in the evaluated code; the remaining operators yielded no applied mutations (see `mutation-scores.json`).

## Key Findings

1. **High kill rate on applied mutations**: Both groups killed all 46 applied mutations (avg ~1.5 per run) — a positive signal, though too few mutations to establish comprehensive coverage
2. **No difference detected on this metric**: Both groups reached the 100% ceiling, so mutation kill rate had no discriminative power here; equivalence between the approaches cannot be concluded from it
3. **Effective Validation**: All applied mutations were detected by test suites
4. **Mutated sites covered**: The specific mutated locations (limits, comparison operators, sign checks) are exercised by tests; thoroughness beyond these ~1.5 mutations per run was not measured

## How to Use These Results

### For Analysis
- Open `mutation-scores.json` with any JSON viewer/parser
- Use `jq` or Python for programmatic analysis
- See `mutation-report.md` for detailed interpretation

### For Reporting
- Reference the statistics in `MUTATION_TESTING_SUMMARY.md`
- Use tables from `mutation-report.md` for presentations
- See `../MUTATION_TESTING_SUMMARY.md` for validation details

### For Comparison
- Compare control vs treatment kill rates by group
- Analyze per-task mutation detection
- Review individual run results in JSON

## Related Files

- **Scripts:** `../scripts/mutation-test-runner.js` / `../scripts/mutation-test-runner.ts` (committed runner; other `mutation-*.js` development variants from the original run sandbox were not preserved in this repository)
- **Source Runs:** `../runs/`
- **Test Framework:** `../scripts/` (the sandbox working directory used during the original run was not preserved)

## Questions?

Refer to the comprehensive documentation:
1. `mutation-report.md` - Technical details
2. `../MUTATION_TESTING_SUMMARY.md` - Implementation overview
3. `mutation-scores.json` - Raw data

---

**Generated:** 2026-04-02
**Status:** Complete (results recorded in `mutation-scores.json`; independent validation was not performed — note that `control/task1-bank-account-run1` lists `__gold_tests__.ts` as its mutated source file and should be reviewed)
