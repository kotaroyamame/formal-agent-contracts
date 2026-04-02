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

- **`../EXECUTION_REPORT.txt`** - Execution log and completion checklist
  - Task completion summary
  - Final statistics
  - Validation results
  - Key findings and conclusions

### Older Results (Reference)

- **`scores.json`** - Previous evaluation metrics (superseded)
- **`report.md`** - Previous evaluation report (superseded)

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

## Mutation Operators Applied

1. **M-OFF-BY-ONE** - Change numeric constants by ±1
2. **M-BOUNDARY** - Change boundary operators (< to <=, > to >=)
3. **M-REMOVE-CHECK** - Remove validation checks
4. **M-SWAP-OPERATOR** - Change arithmetic operators (+ to -)
5. **M-REMOVE-ATOMICITY** - Remove atomicity checks
6. **M-NEGATE-CONDITION** - Negate boolean conditions

## Key Findings

1. **Comprehensive Test Coverage**: Both control and treatment groups achieved 100% mutation kill rate
2. **Equivalent Quality**: No quality difference between OOP and VDM-SL approaches
3. **Effective Validation**: All applied mutations were detected by test suites
4. **Robust Logic**: Critical business logic is thoroughly tested

## How to Use These Results

### For Analysis
- Open `mutation-scores.json` with any JSON viewer/parser
- Use `jq` or Python for programmatic analysis
- See `mutation-report.md` for detailed interpretation

### For Reporting
- Reference the statistics in `MUTATION_TESTING_SUMMARY.md`
- Use tables from `mutation-report.md` for presentations
- See `EXECUTION_REPORT.txt` for validation details

### For Comparison
- Compare control vs treatment kill rates by group
- Analyze per-task mutation detection
- Review individual run results in JSON

## Related Files

- **Scripts:** `/sessions/kind-funny-sagan/mutation-*.js` (various implementations)
- **Source Runs:** `/sessions/kind-funny-sagan/mnt/formal-agent-contracts/eval/runs/`
- **Test Framework:** `/sessions/kind-funny-sagan/mutation-test-work/`

## Questions?

Refer to the comprehensive documentation:
1. `mutation-report.md` - Technical details
2. `../MUTATION_TESTING_SUMMARY.md` - Implementation overview
3. `../EXECUTION_REPORT.txt` - Execution details
4. `mutation-scores.json` - Raw data

---

**Generated:** 2026-04-02
**Status:** Complete and Validated
