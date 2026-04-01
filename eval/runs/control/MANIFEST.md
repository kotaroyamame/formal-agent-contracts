# Control Group Manifest - Library Loan Management System

**Creation Date**: April 1, 2026  
**Project**: Formal Methods Evaluation  
**System**: Library Loan Management (図書館の貸出管理システム)  
**Language**: TypeScript  
**Evaluation Type**: Control Group (Non-Formal)

## Contents Summary

### Implementation Files (10 total)

#### RUN 1: Standard OOP Approach
- **Path**: `task2-library-run1/`
- **Files**: `library.ts` (295 lines), `library.test.ts` (311 lines)
- **Total**: 606 lines
- **Design**: Direct 3-class implementation
- **Tests**: ~20 test cases
- **Status**: Complete ✓

#### RUN 2: Inheritance-Based Design
- **Path**: `task2-library-run2/`
- **Files**: `library.ts` (306 lines), `library.test.ts` (299 lines)
- **Total**: 605 lines
- **Design**: Base class with inheritance pattern
- **Tests**: ~20 test cases
- **Status**: Complete ✓

#### RUN 3: Modular Agent Classes
- **Path**: `task2-library-run3/`
- **Files**: `library.ts` (304 lines), `library.test.ts` (402 lines)
- **Total**: 706 lines
- **Design**: Explicit interfaces, clear separation
- **Tests**: ~25 test cases
- **Status**: Complete ✓

#### RUN 4: Minimal Approach
- **Path**: `task2-library-run4/`
- **Files**: `library.ts` (208 lines), `library.test.ts` (67 lines)
- **Total**: 275 lines
- **Design**: Bare minimum, functional
- **Tests**: 7 test cases
- **Status**: Complete ✓

#### RUN 5: Best Effort Control
- **Path**: `task2-library-run5/`
- **Files**: `library.ts` (352 lines), `library.test.ts` (469 lines)
- **Total**: 821 lines
- **Design**: Comprehensive with validation
- **Tests**: 40+ test cases
- **Status**: Complete ✓

### Documentation Files (4 total)

1. **CONTROL_GROUP_SUMMARY.md**
   - Comparative analysis of all 5 runs
   - Design approaches
   - Intentional gaps per run
   - Test coverage summary
   - Code statistics

2. **INDEX.md**
   - Quick navigation guide
   - File overview for each run
   - Usage recommendations
   - Metrics and testing strategy

3. **INTENTIONAL_GAPS.md**
   - Detailed gap documentation
   - Severity levels (critical/high/medium/low)
   - Test cases for each gap
   - Root cause analysis
   - Impact assessment

4. **TEST_SCENARIOS.md**
   - 100+ test scenarios
   - Categorized by type (core/edge/race/consistency)
   - Expected pass rates by run
   - Execution commands
   - Scoring rubric

## File Tree

```
/eval/runs/control/
├── task2-library-run1/
│   ├── library.ts
│   └── library.test.ts
├── task2-library-run2/
│   ├── library.ts
│   └── library.test.ts
├── task2-library-run3/
│   ├── library.ts
│   └── library.test.ts
├── task2-library-run4/
│   ├── library.ts
│   └── library.test.ts
├── task2-library-run5/
│   ├── library.ts
│   └── library.test.ts
├── CONTROL_GROUP_SUMMARY.md
├── INDEX.md
├── INTENTIONAL_GAPS.md
├── TEST_SCENARIOS.md
└── MANIFEST.md (this file)
```

## Statistics

### Code Metrics
| Metric | RUN1 | RUN2 | RUN3 | RUN4 | RUN5 | Total |
|--------|------|------|------|------|------|-------|
| Implementation Lines | 295 | 306 | 304 | 208 | 352 | 1,465 |
| Test Lines | 311 | 299 | 402 | 67 | 469 | 1,548 |
| Total Lines | 606 | 605 | 706 | 275 | 821 | 3,013 |
| Test Cases | 20 | 20 | 25 | 7 | 40+ | 130+ |
| File Size (KB) | 16.6 | 17.3 | 20.7 | 6.8 | 23.9 | 85.3 |

### Quality Metrics
| Metric | RUN1 | RUN2 | RUN3 | RUN4 | RUN5 |
|--------|------|------|------|------|------|
| Test Coverage Est. | 33% | 33% | 42% | 12% | 67% |
| Known Gaps | 5 | 5 | 4 | 5+ | 4 |
| Error Validation | Partial | Partial | Partial | None | Full |
| Input Validation | Partial | Partial | Partial | None | Full |
| Concurrency Safe | No | No | No | No | No |

## Business Rules Implemented

All runs implement all core business rules:
- ✓ Book registration with categories (一般, 参考, 貴重)
- ✓ Book search (title, author, category)
- ✓ Member registration and status tracking
- ✓ 5-book borrowing limit
- ✓ Precious books: library viewing only
- ✓ Borrow/return operations
- ✓ Loan extension (once only, +7 days)
- ✓ Overdue detection and member suspension
- ✓ 14-day loan period

## Intentional Design Gaps

### Universal (All Runs)
1. No reservation system
2. No concurrency/atomicity
3. No audit trail
4. No penalty system
5. No formal persistence

### Run-Specific
- **RUN 1**: Race conditions, stock consistency
- **RUN 2**: Weak overdue flag management
- **RUN 3**: Limited concurrency protection
- **RUN 4**: Minimal validation everywhere
- **RUN 5**: No double-extension persistence

## How to Use This Control Group

### 1. Baseline Comparison
```
Formal Methods Implementation vs Control Group
- Measure improvement in test coverage
- Count bugs remaining after each approach
- Calculate cost-benefit ratio
```

### 2. Gap Analysis
```
Review INTENTIONAL_GAPS.md for:
- Which run has which gaps
- Severity of each gap
- Root cause of gap
- How formal methods prevents it
```

### 3. Test Development
```
Use TEST_SCENARIOS.md to:
- Create test cases for all scenarios
- Run against each run
- Verify which fail in which runs
- Ensure formal version passes all
```

### 4. Metrics Tracking
```
For each formal implementation:
- Compare test case count
- Compare code quality score
- Compare bug density
- Calculate improvement percentage
```

## Evaluation Checklist

- [ ] All 10 TypeScript files created
- [ ] All files syntactically valid (no parse errors)
- [ ] Each run has library.ts and library.test.ts
- [ ] Documentation complete (4 supporting files)
- [ ] Intentional gaps documented
- [ ] Test scenarios provided
- [ ] Manifest created

## Next Steps for Evaluator

1. **Run the Tests**
   ```bash
   cd task2-library-run5/
   npm install
   npm test
   ```

2. **Create Formal Specification**
   - Use VDM-SL or similar
   - Document all business rules
   - Prove correctness properties

3. **Generate Formal Implementation**
   - From specification
   - With tool support
   - With proof obligations

4. **Compare Results**
   - Test coverage: Formal vs Control
   - Bug count: Formal vs Control
   - Code size: Formal vs Control
   - Development time: Formal vs Control

5. **Generate Report**
   - Which run is closest to formal version?
   - How much better is formal version?
   - What gaps did formal methods catch?
   - What lessons learned?

## Key Insights for Evaluation

### RUN 1-3 (Typical Industry)
- These represent "pretty good" informal development
- Still have significant gaps in edge cases
- Missing concurrency/race condition handling
- Adequate for simple systems, risky for critical systems

### RUN 4 (Realistic Minimum)
- Shows what happens with minimal effort
- Many gaps that should alarm developers
- But still "technically works" for happy path
- Highlights importance of validation

### RUN 5 (Best Informal Effort)
- Represents careful, experienced developer
- 40+ test cases, good coverage
- Input validation and error handling
- Still has subtle gaps (race conditions, atomicity)
- Shows limits of informal verification

### Expected Formal Version
- All gaps fixed by specification/proof
- 0 undefined behaviors
- All invariants proven
- Atomicity guaranteed
- Race conditions prevented or proven safe

## Files Created

✓ `task2-library-run1/library.ts` (7,110 bytes)
✓ `task2-library-run1/library.test.ts` (9,464 bytes)
✓ `task2-library-run2/library.ts` (7,425 bytes)
✓ `task2-library-run2/library.test.ts` (9,844 bytes)
✓ `task2-library-run3/library.ts` (7,937 bytes)
✓ `task2-library-run3/library.test.ts` (12,729 bytes)
✓ `task2-library-run4/library.ts` (4,844 bytes)
✓ `task2-library-run4/library.test.ts` (1,979 bytes)
✓ `task2-library-run5/library.ts` (8,976 bytes)
✓ `task2-library-run5/library.test.ts` (14,996 bytes)
✓ `CONTROL_GROUP_SUMMARY.md`
✓ `INDEX.md`
✓ `INTENTIONAL_GAPS.md`
✓ `TEST_SCENARIOS.md`
✓ `MANIFEST.md` (this file)

**Total Files**: 15
**Total Size**: ~120 KB
**Total Lines of Code**: ~3,000 LOC

## Contact / Notes

**Project**: Formal Agent Contracts Evaluation  
**Base Language**: Japanese  
**System Domain**: Library Management  
**Evaluation Context**: Multi-agent system with 3 agents

This control group is ready for formal methods evaluation.
