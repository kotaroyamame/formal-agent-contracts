# Library Loan Management System - Control Group Summary

## Overview

5 control group implementations of a Library Loan Management System (図書館の貸出管理システム) using TypeScript with 3-agent architecture. Each run demonstrates a different approach with intentional gaps to enable realistic evaluation against formal methods implementations.

## Base Requirements (All Runs)

### System Architecture
- **CatalogAgent**: Book registration, search, inventory management
- **MemberAgent**: Member registration, borrowing eligibility management
- **LoanAgent**: Borrow/return/extension management

### Business Rules
- Members can borrow max 5 books simultaneously
- Overdue members cannot borrow new books
- Zero-stock books cannot be borrowed
- Loan period: 14 days, extendable once (adds 7 days)
- Book categories: "一般" (general), "参考" (reference), "貴重" (precious)
- Precious books: library viewing only (no borrowing)

---

## RUN 1: Standard OOP Approach

**File Path**: `task2-library-run1/`
- `library.ts`: Standard 3 classes, direct implementation
- `library.test.ts`: Basic test coverage

### Design Approach
- Simple class-per-agent design
- Straightforward method implementations
- Maps for storage (Book, Member, Loan)
- ID generation via counter

### Intentional Gaps
1. No reservation system
2. No handling of return-then-immediately-borrow race conditions
3. Stock consistency between agents not guaranteed
4. Doesn't handle multiple copies of same book edge cases
5. No protection against double extension attempts

### Test Coverage
- Book registration and search
- Stock decrease/increase operations
- Member eligibility checks
- 5-book limit enforcement
- Borrow/return/extend operations
- Basic overdue detection

### Strengths
- Simple, readable code
- Clear separation of concerns
- All core rules implemented

### Known Weaknesses
- No concurrency handling
- Limited edge case testing
- Stock manipulation not atomic

---

## RUN 2: Inheritance-Based Design

**File Path**: `task2-library-run2/`
- `library.ts`: Base LibraryAgent class with inheritance
- `library.test.ts`: Tests for inheritance model

### Design Approach
- Abstract `LibraryAgent` base class
- `CatalogAgent`, `MemberAgent`, `LoanAgent` extend base
- Alternative method naming conventions
- Email field for members

### Intentional Gaps
1. No re-check of overdue status after member returns book and attempts immediate reborrow
2. Edge case: return 1 book when at 5-book limit, then immediately borrow another
3. Precious book edge cases with multiple copies unhandled
4. No duplicate member registration prevention
5. Weak overdue flag consistency when processing

### Test Coverage
- Book addition and search
- Category-based searches
- Availability tracking
- Member registration and loan tracking
- Borrow/return/extend operations
- Basic overdue detection

### Strengths
- Demonstrates inheritance pattern
- Good test organization
- Clearer eligibility checking

### Known Weaknesses
- Overdue member state not immediately checked before reborrow
- No validation of member uniqueness
- Return-immediate-reborrow race condition

---

## RUN 3: Modular Agent Classes (Better Coverage)

**File Path**: `task2-library-run3/`
- `library.ts`: More modular design with agent separation
- `library.test.ts`: Comprehensive test coverage

### Design Approach
- Separate agent responsibilities clearly
- Explicit interfaces (BookRecord, MemberRecord, LoanTransactionRecord)
- Status field tracking (active, returned, overdue)
- Extension count tracking
- ID formatting with padding

### Intentional Gaps
1. No reservation system
2. Stock consistency across agents not guaranteed under concurrent access
3. Extended-then-overdue scenario handling incomplete
4. Last copy edge case when multiple agents access concurrently
5. No rollback mechanism for failed multi-step operations

### Test Coverage
- Book management (register, search, tracking)
- Category-based searches
- Precious book restrictions
- Member management with overdue tracking
- 5-book limit with boundary testing
- Complete borrow-return-borrow lifecycle
- Multiple simultaneous loans
- Overdue detection and member suspension

### Strengths
- More comprehensive test coverage
- Better state tracking
- Good separation of concerns
- Tests cover integration scenarios
- Handles precious books correctly

### Known Weaknesses
- No reservation system
- Limited concurrency protection
- Stock consistency issues possible
- No atomic multi-step operations

---

## RUN 4: Minimal Approach

**File Path**: `task2-library-run4/`
- `library.ts`: Minimal validation, all features present
- `library.test.ts`: Minimal test suite

### Design Approach
- Simple classes with direct properties
- Minimal validation in methods
- Basic error handling (null returns)
- Fewest lines of code while still functional

### Intentional Gaps
1. Minimal input validation
2. Weak consistency checks across agents
3. Minimal test coverage
4. Most edge cases unhandled
5. No error messages for debugging

### Test Coverage
- Book registration
- Member registration
- Basic borrow/return
- Stock checking
- Precious book prevention
- Basic extension

### Strengths
- Simplest codebase
- All core features work
- Easy to understand

### Known Weaknesses
- Almost no edge case handling
- Minimal validation
- Minimal tests (only 7 test cases)
- Limited error information
- Poor test message clarity

---

## RUN 5: Best Effort Control (Comprehensive)

**File Path**: `task2-library-run5/`
- `library.ts`: Most comprehensive implementation
- `library.test.ts`: Extensive test coverage

### Design Approach
- Interface-based design (BookData, MemberData, LoanData)
- Explicit status tracking (borrowed, returned, overdue)
- Validation and error throwing
- Clear method naming with detection patterns
- Extension count and overdue count tracking
- Last-updated timestamps

### Intentional Gaps
1. No reservation system
2. Limited atomicity for concurrent operations
3. Doesn't track overdue-return-immediate-reborrow sequences
4. No tracking of double extension attempts across restarts
5. No multi-step transaction rollback

### Test Coverage
- Input validation (rejects empty names, negative stock)
- Book registration with all categories
- Search by title, category, author
- Available copy tracking with boundary checks
- Member registration and validation
- Active loan tracking
- 5-book limit with strict enforcement
- Overdue status management
- Comprehensive borrow operation tests
  - Non-existent book/member prevention
  - Out-of-stock prevention
  - Precious book prevention
  - Overdue member prevention
  - 5-book limit boundary (return 1, borrow 1 cycle)
- Return operation tests
- Extension operation tests (one extension only)
- Overdue detection and member suspension
- Integration tests (multiple loans, lifecycle)

### Strengths
- Most comprehensive implementation
- Excellent test coverage (40+ test cases)
- Input validation with error throwing
- Clear status tracking
- Boundary condition testing
- Integration test scenarios
- Good method organization
- Clear error messages

### Known Weaknesses
- Still no reservation system
- Limited concurrency protection
- No atomic multi-operation rollback
- Overdue-then-reborrow edge case not fully handled

---

## Comparative Analysis

| Feature | RUN1 | RUN2 | RUN3 | RUN4 | RUN5 |
|---------|------|------|------|------|------|
| Code Organization | Good | Inheritance | Modular | Minimal | Excellent |
| Test Cases | ~20 | ~20 | ~25 | 7 | 40+ |
| Input Validation | Partial | Partial | Partial | None | Full |
| Edge Case Handling | Low | Low | Medium | Very Low | High |
| Precious Book Check | Yes | Yes | Yes | Yes | Yes |
| 5-Book Limit | Yes | Yes | Yes | Yes | Yes |
| Overdue Detection | Yes | Yes | Yes | Yes | Yes |
| Extension Logic | Yes | Yes | Yes | Yes | Yes |
| Error Messages | No | No | Limited | None | Clear |
| Status Tracking | Simple | Simple | Better | Basic | Excellent |
| Integration Tests | Minimal | Minimal | Good | None | Good |

---

## Common Gaps Across All Runs

1. **No Reservation System**: No way to reserve books before availability
2. **No Formal Concurrency**: Concurrent access could cause race conditions
3. **Limited Atomicity**: Multi-step operations not atomic
4. **No Audit Trail**: No history of operations
5. **No Penalty System**: No late fees or penalties
6. **State Consistency**: No guarantee of consistency between agents
7. **Double Extension**: Weak protection in some runs
8. **Return-Reborrow Race**: Not handled in most runs

---

## Testing Strategy for Evaluation

These control implementations should be tested against formal methods implementations to measure:

1. **Functional Correctness**: Do all business rules work as specified?
2. **Edge Case Handling**: Which edge cases cause failures?
3. **State Consistency**: Can agents get out of sync?
4. **Race Conditions**: What happens with concurrent access?
5. **Error Recovery**: How do they handle invalid operations?
6. **Test Coverage**: How many tests does each approach require?

---

## Code Statistics

### RUN 1
- implementation.ts: ~150 lines
- tests.ts: ~250 lines
- Total: ~400 lines

### RUN 2
- implementation.ts: ~160 lines
- tests.ts: ~280 lines
- Total: ~440 lines

### RUN 3
- implementation.ts: ~190 lines
- tests.ts: ~350 lines
- Total: ~540 lines

### RUN 4
- implementation.ts: ~90 lines
- tests.ts: ~40 lines
- Total: ~130 lines

### RUN 5
- implementation.ts: ~250 lines
- tests.ts: ~450 lines
- Total: ~700 lines

---

## Recommendations for Formal Methods Comparison

1. **Focus on edge cases** that RUN 4 and RUN 1-2 miss
2. **Test concurrency scenarios** systematically
3. **Verify state consistency** across agent interactions
4. **Check atomicity** of multi-step operations
5. **Validate error handling** robustness
6. **Compare test coverage** needed for same level of confidence

All implementations satisfy the base prompt but vary significantly in quality, completeness, and reliability.
