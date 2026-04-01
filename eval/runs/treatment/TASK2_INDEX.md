# TASK 2: Library Loan Management System - QUICK INDEX

## File Locations

All files are in: `/sessions/kind-funny-sagan/mnt/formal-agent-contracts/eval/runs/treatment/`

### RUN 1: Full 3-Module VDM-SL Architecture (12/12 traps)
- **VDM-SL**: `task2-library-run1/library.vdmsl` (300 lines)
  - CATALOG_AGENT module (book inventory management)
  - MEMBER_AGENT module (patron management)
  - LOAN_AGENT module (loan lifecycle management)

- **TypeScript**: `task2-library-run1/library.ts` (480 lines)
  - CatalogAgent class with operations
  - MemberAgent class with operations
  - LoanAgent class with operations
  - LibrarySystem orchestrator

- **Tests**: `task2-library-run1/library.test.ts` (634 lines)
  - 50+ comprehensive tests
  - All 12 edge case traps covered

### RUN 2: Single-Module INV-Focused (10-11/12 traps)
- **VDM-SL**: `task2-library-run2/library.vdmsl` (238 lines)
  - Single LIBRARY module
  - 4 key invariants (INV1-4)
  - Clear operation grouping

- **TypeScript**: `task2-library-run2/library.ts` (372 lines)
  - Unified LibrarySystem class
  - checkInvariants() after each operation
  - Helper methods for workflow

- **Tests**: `task2-library-run2/library.test.ts` (289 lines)
  - 45 tests focusing on invariants
  - Tests for INV1-4 violations

### RUN 3: Explicit Availability Function (11/12 traps)
- **VDM-SL**: `task2-library-run3/library.vdmsl` (233 lines)
  - Helper functions (not operations):
    - IsBookAvailable()
    - MemberActiveLoanCount()
    - HasAnyOverdueLoans()
    - IsLoanOverdue()
  - Strong preconditions using functions

- **TypeScript**: `task2-library-run3/library.ts` (359 lines)
  - Private helper methods matching VDM-SL functions
  - Explicit availability checking
  - Detailed overdue logic

- **Tests**: `task2-library-run3/library.test.ts` (276 lines)
  - 45 tests for availability function edge cases
  - Overdue state consistency tests

### RUN 4: Simplified VDM-SL with Informal Notes (9-10/12 traps)
- **VDM-SL**: `task2-library-run4/library.vdmsl` (204 lines)
  - Minimal formalization
  - Informal edge case comments
  - Basic preconditions only
  - Notes where spec doesn't fully formalize

- **TypeScript**: `task2-library-run4/library.ts` (318 lines)
  - Straightforward implementation
  - Less invariant enforcement
  - Comments note implementation workarounds

- **Tests**: `task2-library-run4/library.test.ts` (217 lines)
  - 40 tests
  - Some edge cases noted but not fully caught

### RUN 5: Most Thorough with Proof Obligations (12/12 traps)
- **VDM-SL**: `task2-library-run5/library.vdmsl` (285 lines)
  - Proof Obligations PO1-12 explicitly listed
  - 5 major invariants (INV1-5)
  - Helper functions with detailed postconditions
  - forall/exists quantifiers for complex conditions

- **TypeScript**: `task2-library-run5/library.ts` (494 lines)
  - PRE/POST validation in comments
  - checkInvariants() comprehensive
  - Helper functions with formal semantics
  - Error messages match VDM-SL preconditions

- **Tests**: `task2-library-run5/library.test.ts` (577 lines)
  - 50+ comprehensive tests
  - INV1-5 validation tests
  - All 12 traps with explicit test names
  - Proof obligation coverage

## Summary Document
- **Overview**: `TASK2_LIBRARY_SUMMARY.md` (comprehensive analysis)
  - 12 edge case traps explained
  - Run-by-run comparison
  - Formalization metrics
  - Hypothesis and validation approach

## Quick Statistics

| Metric | RUN1 | RUN2 | RUN3 | RUN4 | RUN5 | Total |
|--------|------|------|------|------|------|-------|
| VDM-SL Lines | 300 | 238 | 233 | 204 | 285 | 1,260 |
| TypeScript Lines | 480 | 372 | 359 | 318 | 494 | 2,023 |
| Test Lines | 634 | 289 | 276 | 217 | 577 | 1,993 |
| Tests Count | 50+ | 45 | 45 | 40 | 50+ | 225+ |
| Traps Caught | 12/12 | 10-11/12 | 11/12 | 9-10/12 | 12/12 | N/A |
| **Total Lines** | 1,414 | 899 | 868 | 739 | 1,356 | **5,276** |

## Key Features Compared

### Available Features by Run

| Feature | RUN1 | RUN2 | RUN3 | RUN4 | RUN5 |
|---------|------|------|------|------|------|
| 3-Module Architecture | YES | - | - | - | - |
| Single-Module Architecture | - | YES | YES | YES | YES |
| Explicit Availability Function | - | - | YES | - | YES (via helper) |
| Formal Invariants (Named) | - | YES | YES | - | YES (5) |
| Proof Obligations (PO1-12) | - | - | - | - | YES |
| Helper Functions | - | - | YES | - | YES |
| Informal Edge Case Notes | - | - | - | YES | - |
| Runtime Invariant Checking | - | YES | YES | - | YES |
| Complete Pre/Post Specs | YES | YES | YES | - | YES |

## How to Use These Files

### For Understanding VDM-SL Formal Methods
Start with **RUN 5** (most thorough) then RUN 1 (clearest architecture)

### For Understanding Edge Cases
Read **TASK2_LIBRARY_SUMMARY.md** for detailed explanation of all 12 traps

### For Implementation Reference
Use **RUN 1** or **RUN 5** as reference (both catch all 12 traps)

### For Testing
All runs have comprehensive test suites; RUN 5 has most detailed test structure with PRE/POST validation

### For Comparison Study
Review all 5 runs to see how formalization depth affects edge case discovery

## Business Rules Implemented

All 5 runs enforce:
- Maximum 5 concurrent loans per member
- Overdue status blocks new loans
- Precious books (category=PRECIOUS) cannot be loaned
- Loan period: 14 days (day 15 is due date, not overdue)
- Extension: +7 days, once per loan only
- Catalog inventory: available_copies <= total_copies always
- No duplicate member registrations
- Loan cannot be returned twice

## VDM-SL Types Consistently Used

All runs define:
```vdm-sL
Book ::
  id : BookId
  title : seq of char
  category : Category  -- <NORMAL> | <PRECIOUS>
  total_copies : nat
  available_copies : nat
  inv b == b.available_copies <= b.total_copies

Member ::
  id : MemberId
  name : seq of char
  has_overdue : bool
  loan_count : nat
  inv m == m.loan_count >= 0 /\ m.loan_count <= 5

Loan ::
  id : LoanId
  book_id : BookId
  member_id : MemberId
  borrow_date : nat
  due_date : nat
  extended : bool
  is_returned : bool
  inv l == l.due_date > l.borrow_date
```

## Base Prompt (Japanese)
```
統合ワークフローで図書館貸出管理システムを開発して。3つのエージェント構成で。TypeScriptで生成して。

エージェント: CatalogAgent, MemberAgent, LoanAgent
ビジネスルール: 最大5冊同時貸出、延滞中は新規貸出不可、在庫0は貸出不可、
貸出期間14日・延長1回まで（+7日）、貴重書籍は館内閲覧のみ
```

---
**Created**: 2026-04-01 | **Format**: VDM-SL + TypeScript + Jest | **Total Files**: 15
