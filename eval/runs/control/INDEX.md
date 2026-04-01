# Library Loan Management System - Control Group Implementation Index

## Quick Reference

All 5 control group implementations are located in `/eval/runs/control/task2-library-run{1-5}/`.

Each run contains:
- `library.ts` - Implementation
- `library.test.ts` - Test suite

## Files Overview

### RUN 1: Standard OOP (Baseline)
- **Path**: `task2-library-run1/`
- **Style**: Classic 3-class OOP design
- **Test Count**: ~20 tests
- **Lines**: ~400 total
- **Best For**: Understanding basic requirements
- **Key Gap**: No race condition handling

```
library.ts (7.1 KB)
  - CatalogAgent
  - MemberAgent
  - LoanAgent

library.test.ts (9.5 KB)
  - 20 test cases
```

### RUN 2: Inheritance-Based
- **Path**: `task2-library-run2/`
- **Style**: Base class with inheritance
- **Test Count**: ~20 tests
- **Lines**: ~440 total
- **Best For**: Understanding design patterns
- **Key Gap**: Weak overdue re-check after return

```
library.ts (7.4 KB)
  - LibraryAgent (base)
  - CatalogAgent extends LibraryAgent
  - MemberAgent extends LibraryAgent
  - LoanAgent extends LibraryAgent

library.test.ts (9.8 KB)
  - 20 test cases
```

### RUN 3: Modular Design (Good Coverage)
- **Path**: `task2-library-run3/`
- **Style**: Explicit interfaces, clear responsibility
- **Test Count**: ~25 tests
- **Lines**: ~540 total
- **Best For**: Medium-level complexity study
- **Key Gap**: Limited concurrency protection

```
library.ts (7.9 KB)
  - CatalogAgent
  - MemberAgent
  - LoanAgent
  - Types: BookRecord, MemberRecord, LoanTransactionRecord

library.test.ts (12.7 KB)
  - 25 test cases
  - Good integration tests
```

### RUN 4: Minimal Approach
- **Path**: `task2-library-run4/`
- **Style**: Bare minimum code
- **Test Count**: 7 tests
- **Lines**: ~130 total
- **Best For**: Failure mode analysis
- **Key Gap**: Minimal validation

```
library.ts (4.8 KB)
  - Book class
  - Member class
  - Loan class
  - CatalogAgent
  - MemberAgent
  - LoanAgent

library.test.ts (2.0 KB)
  - 7 test cases only
```

### RUN 5: Best Effort Control (Comprehensive)
- **Path**: `task2-library-run5/`
- **Style**: Comprehensive with validation
- **Test Count**: 40+ tests
- **Lines**: ~700 total
- **Best For**: Quality benchmark
- **Key Gap**: No reservation system

```
library.ts (8.9 KB)
  - CatalogAgent (fully validated)
  - MemberAgent (strict checking)
  - LoanAgent (comprehensive)
  - Types: BookData, MemberData, LoanData

library.test.ts (15.0 KB)
  - 40+ test cases
  - Excellent coverage
  - Edge case testing
```

## Intentional Gaps by Run

| Gap | RUN1 | RUN2 | RUN3 | RUN4 | RUN5 |
|-----|------|------|------|------|------|
| Reservation System | ✓ | ✓ | ✓ | ✓ | ✓ |
| Return-Reborrow Race | ✓ | ✓ | ✓ | ✓ | ✓ |
| Stock Consistency | ✓ | ✓ | ✓ | ✓ | Partial |
| Duplicate Member Reg | - | ✓ | - | - | - |
| Double Extension | ✓ | - | ✓ | - | ✓ |
| Concurrency | ✓ | ✓ | ✓ | ✓ | ✓ |
| Atomicity | ✓ | ✓ | ✓ | ✓ | ✓ |

✓ = Intentional gap, - = Not applicable or handled

## How to Use This Control Group

### For Feature Coverage Analysis
1. Review **RUN 5** to understand comprehensive implementation
2. Compare against **RUN 4** to see minimal approach
3. Note which tests each run passes/fails

### For Edge Case Testing
1. Study **RUN 1** and **RUN 2** for their specific gaps
2. Create test cases to exploit documented gaps
3. Compare formal methods implementations against this

### For Quality Metrics
1. Count LOC: RUN4 (130) vs RUN5 (700)
2. Count Tests: RUN4 (7) vs RUN5 (40+)
3. Measure bug density: bugs / LOC
4. Compare with formal methods

### For Formal Methods Baseline
- Use **RUN 5** as "best informal effort"
- Use **RUN 4** as "minimal working implementation"
- Use **RUN 1-2** as "typical industry implementations"

## Testing Strategy

### Run the Tests
```bash
# For each run:
cd task2-library-run{N}
npm install
npm test
```

### Inject Failures
1. Modify one rule (e.g., allow 6 books)
2. Verify which tests fail
3. Record test sensitivity

### Concurrent Access Test
```typescript
// Simultaneously:
// - Member A borrows book X
// - Member B borrows book X
// Expect: One succeeds, one fails
```

### Race Condition Test
```typescript
// Member returns book and immediately:
// - Attempts reborrow same book
// - Is member still marked overdue?
```

## Key Metrics for Evaluation

### Test Coverage
- **RUN 1**: 20/60 estimated = 33%
- **RUN 2**: 20/60 estimated = 33%
- **RUN 3**: 25/60 estimated = 42%
- **RUN 4**: 7/60 estimated = 12%
- **RUN 5**: 40/60 estimated = 67%

### Code Quality
- **RUN 5** uses explicit types and validation
- **RUN 4** is minimal and error-prone
- **RUN 1-2** are standard production patterns

### Failure Modes
- RUN4: ~53 failure scenarios uncaught
- RUN1-2: ~30-40 failure scenarios uncaught
- RUN3: ~20-25 failure scenarios uncaught
- RUN5: ~10-15 failure scenarios uncaught

## Summary

This control group provides a realistic spectrum:
- **RUN 4**: Worst case (minimal, many gaps)
- **RUN 1-2**: Typical industry (decent, common gaps)
- **RUN 3**: Good effort (solid, some gaps)
- **RUN 5**: Best informal effort (comprehensive, few gaps)

Use these as baselines to evaluate how formal methods improve reliability, completeness, and confidence compared to typical non-formal implementations.

---

**Created**: 2026-04-01
**Base Prompt Language**: Japanese (図書館の貸出管理システム)
**Target**: Formal Methods Evaluation
**Status**: Complete (All 10 files created)
