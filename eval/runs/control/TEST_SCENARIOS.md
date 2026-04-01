# Library Loan Management System - Test Scenarios

This document provides a comprehensive list of test scenarios for evaluating the control group implementations and formal methods implementations.

## Core Feature Tests (All Should Pass)

### Book Management
- [ ] Register book with all categories (一般, 参考, 貴重)
- [ ] Search books by title
- [ ] Search books by author
- [ ] Search books by category
- [ ] Track available copies correctly
- [ ] Cannot borrow precious books
- [ ] Cannot borrow out-of-stock books

### Member Management
- [ ] Register new member
- [ ] Track member status (active/suspended)
- [ ] Enforce 5-book borrowing limit
- [ ] Mark member as overdue
- [ ] Clear overdue status
- [ ] Prevent overdue members from borrowing

### Loan Operations
- [ ] Borrow available book successfully
- [ ] Return borrowed book successfully
- [ ] Extend loan once (adds 7 days)
- [ ] Cannot extend beyond once
- [ ] Cannot extend returned loan
- [ ] Detect overdue loans
- [ ] Get loan details by ID

## Edge Case Tests (RUN 5 Should Pass, Others May Fail)

### Boundary Tests
- [ ] Borrow 5th book (limit boundary)
- [ ] Try to borrow 6th book (exceeds limit)
- [ ] Return 1 book when at limit (get to 4 books)
- [ ] Immediately borrow after return (return to 5)
- [ ] Borrow last copy of book
- [ ] Second member cannot borrow last copy

### Overdue Scenario Tests
- [ ] Member becomes overdue while holding loan
- [ ] Overdue member cannot borrow new books
- [ ] Member returns overdue book
- [ ] Overdue status cleared after return
- [ ] Member can reborrow after overdue cleared
- [ ] Multiple members overdue simultaneously
- [ ] Detect overdue on extended loan

### Stock Consistency Tests
- [ ] Stock decreases on borrow
- [ ] Stock increases on return
- [ ] Stock never goes negative
- [ ] Cannot borrow when stock = 0
- [ ] Stock updates visible to other members
- [ ] Multiple copies tracked per book

### Error Handling Tests
- [ ] Cannot borrow non-existent book
- [ ] Cannot borrow with invalid member ID
- [ ] Cannot return non-existent loan
- [ ] Cannot extend non-existent loan
- [ ] Clear error messages on failure

## Race Condition Tests (All Likely Fail)

### Concurrent Borrow
```
Scenario: Two members borrow last copy simultaneously
- [ ] Thread A checks stock (1 available)
- [ ] Thread B checks stock (1 available)
- [ ] Thread A borrows (stock = 0)
- [ ] Thread B attempts to borrow
- [ ] Thread B should fail (no stock)
- [ ] Result: Only A succeeds, B fails
```

### Return-Then-Reborrow
```
Scenario: Member returns and immediately reborrows
- [ ] Member A returns Book X
- [ ] Loan record updated, stock increased
- [ ] Member A immediately borrows Book X
- [ ] Should succeed (no delay)
- [ ] Stock should be 0
- [ ] Member should have 1 loan
```

### Partial Operation Failure
```
Scenario: Borrow fails midway
- [ ] Reserve stock (succeeds)
- [ ] Create loan record (succeeds)
- [ ] Add to member loans (fails - at limit)
- [ ] Stock should still be available
- [ ] System should be consistent
- [ ] No orphaned data
```

## Data Consistency Tests (Most Fail)

### Cross-Agent Consistency
- [ ] Member loan count = LoanAgent active loans
- [ ] Book stock = sum of copies - borrowed
- [ ] No loans for non-existent members
- [ ] No loans for non-existent books
- [ ] Every loan has corresponding book and member

### State Invariants
- [ ] stock >= 0 always
- [ ] stock <= totalCopies always
- [ ] activeLoans.length <= 5 always
- [ ] overdue flag matches actual overdue loans
- [ ] no duplicate loan IDs
- [ ] no unreturned loans with return date

### Rollback Consistency
- [ ] Failed borrow: stock unchanged
- [ ] Failed borrow: member loans unchanged
- [ ] Failed return: stock unchanged
- [ ] Failed return: member loans unchanged

## Validation Tests (RUN 5 Should Pass, Others May Fail)

### Input Validation
- [ ] Reject empty book title
- [ ] Reject negative stock
- [ ] Reject empty member name
- [ ] Reject invalid category
- [ ] Reject null/undefined values
- [ ] Clear error messages

### Business Rule Validation
- [ ] Cannot create loan without member
- [ ] Cannot create loan without book
- [ ] Cannot borrow precious book
- [ ] Cannot borrow when overdue
- [ ] Cannot exceed 5-book limit
- [ ] Cannot extend twice

## Persistence Tests (None Pass - In Memory)

- [ ] Data survives system restart
- [ ] Extension count persists
- [ ] Overdue status persists
- [ ] Loan history preserved
- [ ] Member status preserved

## Performance Tests (Not Typically Tested)

- [ ] Search performance with 1000 books
- [ ] Borrow performance with 100 members
- [ ] No N+1 query problems
- [ ] Consistent response times

## Integration Tests

### Complete Lifecycle
```
1. Register member
2. Register book
3. Borrow book
4. Extend loan
5. Return book
6. Borrow again
7. Make overdue
8. Mark overdue
9. Return and verify status cleared
```

### Multiple Members
```
1. Register members A, B, C
2. A borrows book X
3. B tries to borrow book X (fails)
4. C tries to borrow book X (fails)
5. A returns book X
6. B borrows book X (succeeds)
7. C tries again (fails)
```

### Multiple Books
```
1. Register books X, Y, Z
2. Member borrows all 3
3. Member tries to borrow 4th (fails)
4. Member returns Y
5. Member borrows 4th (succeeds)
6. Member at 5-book limit
7. Member returns X
8. Member borrows 5th (succeeds)
```

## Test Coverage by RUN

### RUN 1 (Standard OOP)
- Core Features: ✓ (mostly)
- Edge Cases: ~ (some)
- Race Conditions: ✗ (no)
- Data Consistency: ~ (partial)
- Validation: ~ (weak)
- Tests: ~20

### RUN 2 (Inheritance)
- Core Features: ✓ (good)
- Edge Cases: ~ (some)
- Race Conditions: ✗ (no)
- Data Consistency: ~ (partial)
- Validation: ~ (weak)
- Tests: ~20

### RUN 3 (Modular)
- Core Features: ✓ (good)
- Edge Cases: ~ (some)
- Race Conditions: ✗ (no)
- Data Consistency: ~ (partial)
- Validation: ~ (weak)
- Tests: ~25

### RUN 4 (Minimal)
- Core Features: ✓ (barely)
- Edge Cases: ✗ (none)
- Race Conditions: ✗ (no)
- Data Consistency: ✗ (broken)
- Validation: ✗ (none)
- Tests: 7

### RUN 5 (Best Effort)
- Core Features: ✓ (excellent)
- Edge Cases: ✓ (good)
- Race Conditions: ~ (some)
- Data Consistency: ✓ (good)
- Validation: ✓ (strong)
- Tests: 40+

### Formal Methods Expected
- Core Features: ✓ (verified)
- Edge Cases: ✓ (proven)
- Race Conditions: ✓ (prevented)
- Data Consistency: ✓ (guaranteed)
- Validation: ✓ (complete)
- Tests: Theoretically unnecessary

## Scoring Rubric

### Test Pass Rate
- **RUN 1**: 55-65% of tests
- **RUN 2**: 55-65% of tests
- **RUN 3**: 60-70% of tests
- **RUN 4**: 30-40% of tests
- **RUN 5**: 85-95% of tests
- **Formal Methods**: 95-100% expected

### Critical Bug Detection
- **RUN 1**: ~35 bugs remaining
- **RUN 2**: ~35 bugs remaining
- **RUN 3**: ~25 bugs remaining
- **RUN 4**: ~45+ bugs remaining
- **RUN 5**: ~10-15 bugs remaining
- **Formal Methods**: ~0 bugs expected

### Code Quality Score (1-10)
- **RUN 1**: 6/10 (decent)
- **RUN 2**: 6/10 (decent)
- **RUN 3**: 7/10 (good)
- **RUN 4**: 3/10 (poor)
- **RUN 5**: 8/10 (very good)
- **Formal Methods**: 9-10/10 expected

## Test Execution Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test -- library.test.ts

# Run with coverage
npm test -- --coverage

# Run specific test suite
npm test -- --grep "CatalogAgent"

# Watch mode for development
npm test -- --watch
```

## Expected Results by RUN

### RUN 1 Output
```
PASS  library.test.ts
  Library Loan Management System - RUN 1
    ✓ 20 tests pass
    ✗ Some edge cases fail
    ⚠ No race condition testing
```

### RUN 4 Output
```
PASS  library.test.ts
  Library Loan Management System - RUN 4
    ✓ 7 tests pass
    ✗ Many core features untested
    ✗ All edge cases fail
```

### RUN 5 Output
```
PASS  library.test.ts
  Library Loan Management System - RUN 5
    ✓ 40+ tests pass
    ✓ Most edge cases covered
    ⚠ Some concurrency issues remain
```

### Formal Methods Output
```
VERIFIED: library.vdmsl
  ✓ All business rules verified
  ✓ All invariants proven
  ✓ All proof obligations discharged
  ✓ No edge cases missed
  ✓ Concurrency safety proven
```

---

**Note**: This test scenario document serves as a baseline for evaluating both the control group implementations and formal methods implementations. Use it to systematically evaluate reliability improvements.
