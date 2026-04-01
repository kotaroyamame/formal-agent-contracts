# Intentional Gaps in Control Group Implementations

This document details the specific deliberate limitations in each control group run. These gaps enable evaluation of how formal methods implementations catch issues that informal development misses.

## Universal Gaps (All Runs)

### 1. No Reservation System
All runs lack a reservation feature:
- Members cannot reserve books that are currently borrowed
- No queue for waitlisted members
- First-come-first-served only based on real-time availability

**Impact**: If member A wants book X and it's borrowed by member B, member A cannot reserve. System is unfair to members who arrive late.

### 2. No Formal Concurrency Control
All runs have potential race conditions:
```typescript
// Race condition example:
// Thread A: check stock (1 available)
// Thread B: check stock (1 available)
// Thread A: borrow (stock = 0)
// Thread B: borrow (would be allowed - WRONG)
```
**Impact**: In multi-threaded environment, overbooking is possible.

### 3. Limited Transaction Atomicity
Multi-step operations are not atomic:
- Borrow: (1) reserve stock, (2) create loan record, (3) add to member
- If step (2) fails, step (1) is not rolled back
**Impact**: Orphaned stock reservations, inconsistent state.

### 4. No Audit Trail
No history or logging of operations:
- Cannot see who borrowed what and when
- Cannot recover from data corruption
- Cannot detect anomalies
**Impact**: No accountability, no forensics.

### 5. No Penalty System
No late fees, no escalation:
- Overdue members just cannot borrow new books
- No consequences, no incentive to return
- No collection system
**Impact**: Books could be permanently lost, no recovery mechanism.

---

## RUN 1: Standard OOP Approach

### Gap 1: No Return-Then-Immediately-Reborrow Atomicity
```typescript
// Sequence that can fail:
member.return(loanId); // Returns book, stock++, loan removed
member.borrow(sameBookId); // Immediately borrows again

// Problem: If return succeeds but borrow fails partway:
// - Book is returned but not available for others
// - Member count is off by 1
// - Stock could be inconsistent
```
**Severity**: Medium - Data inconsistency possible
**Test Case**: `testReturnThenImmediateReborrow()`

### Gap 2: Stock Consistency Across Agents
```typescript
// Two threads:
// Thread A: CatalogAgent.decreaseStock() succeeds
// Thread B: LoanAgent checks stock (using cached value)
// Thread A: Catalog actually shows stock=0
// Thread B: Tries to borrow (stock supposedly > 0)
```
**Severity**: High - Overbooking possible
**Test Case**: `testConcurrentBorrowSameBook()`

### Gap 3: Multiple Copies Not Properly Tracked
```typescript
// If CatalogAgent has 2 copies of Book A:
// - No way to track which copy was borrowed
// - Returning "Book A" doesn't specify which copy
// - Could lose track of copies
```
**Severity**: Low - Works fine with current design, but fragile
**Test Case**: `testMultipleCopiesOfSameBook()`

### Gap 4: Double Extension Protection Weak
```typescript
// If system restarts after extension:
// - extensionCount might not persist
// - Member could extend twice
// - No protection against manual database edit
```
**Severity**: Low - Local memory only, but no persistence
**Test Case**: `testDoubleExtensionAfterRestart()`

### Gap 5: No Overdue Re-Evaluation After Return
```typescript
// Member is marked overdue (has overdue loan X)
// Member returns loan X (no longer overdue)
// Member tries to borrow new book
// System still thinks member is overdue (old flag not cleared)
```
**Severity**: Medium - Member locked out incorrectly
**Test Case**: `testClearOverdueStatusAfterReturn()`

---

## RUN 2: Inheritance-Based Design

### Gap 1: Weak Overdue Re-Check After Return
```typescript
// Member A: marked overdue
// Member A: returns overdue loan
// Member A: immediately tries to borrow
// System: isEligibleToBorrow() called
// System: checks member.isOverdue (still true!)
// System: prevents borrow (WRONG - should be cleared)
```
**Severity**: High - Members incorrectly blocked
**Code**: No clearOverdue() call after return in LoanAgent.return()

### Gap 2: Edge Case - Return 1 When at 5-Book Limit
```typescript
// Member has 5 books borrowed
// Member returns 1 book
// Attempt to immediately borrow another
// Race condition: could fail if state not immediately updated
```
**Severity**: Medium - User experience issue
**Test Case**: `testReturnOneAndBorrowWhileAtLimit()`

### Gap 3: Precious Book Edge Cases
```typescript
// Scenario:
// - Book A marked "参考" (reference)
// - Member borrows Book A (should fail - no it's OK for reference)
// - Book A re-categorized to "貴重" (precious)
// - Member returns, tries to re-borrow (should fail)
// But no way to change category at runtime
```
**Severity**: Low - Design doesn't support dynamic categorization
**Test Case**: `testPreciousBookReCategorization()`

### Gap 4: No Duplicate Member Registration Prevention
```typescript
// System allows:
memberAgent.registerMember("田中太郎", "tanaka@example.com");
memberAgent.registerMember("田中太郎", "tanaka@different.com");
// Now system has duplicate members with same name
// Could cause confusion and billing issues
```
**Severity**: Low - Application-level validation missing
**Test Case**: `testNoDuplicateMemberNames()`

### Gap 5: Weak Overdue Flag Consistency
```typescript
// Member's overdue flag set to true by LoanAgent
// But LoanAgent doesn't clear it when loan is returned
// Only way to clear is manual call to MemberAgent.clearOverdue()
// If this call is forgotten: member locked forever
```
**Severity**: Medium - Manual intervention needed to fix
**Test Case**: `testOverdueConsistency()`

---

## RUN 3: Modular Agent Classes

### Gap 1: No Reservation System
Same as universal gaps (above)

### Gap 2: Stock Consistency Under Concurrent Access
```typescript
// CatalogAgent.borrowBook() decrements stock
// But if two threads call simultaneously:
// Thread A: stock = 3, check availableCopies (3)
// Thread B: stock = 3, check availableCopies (3)
// Thread A: decrements (stock = 2)
// Thread B: decrements (stock = 1)
// Both succeeded when only 1 copy available
```
**Severity**: High - Overbooking
**Test Case**: `testConcurrentBorrowAccuracy()`

### Gap 3: Extended-Then-Overdue Scenario Incomplete
```typescript
// Loan extended (new dueDate)
// Member doesn't return by NEW due date
// System detects overdue (status = overdue)
// But original loan record shows it was extended
// Dispute about actual due date if challenged
```
**Severity**: Low - System works but records unclear
**Test Case**: `testExtendedLoanOverdueScenario()`

### Gap 4: Last Copy While On Loan Edge Case
```typescript
// Book A has 2 copies
// Members B1 and B2 both borrow
// Stock = 0
// Member B1 tries to extend (succeeds)
// Member B2 tries to extend (succeeds)
// But system only tracks stock, not per-copy state
// Could lose track of which member has which copy
```
**Severity**: Low - Design works but could be clearer
**Test Case**: `testLastCopyEdgeCase()`

### Gap 5: No Rollback on Partial Failure
```typescript
// Borrow operation:
// Step 1: catalogAgent.borrowBook() - succeeds
// Step 2: loans.set() - succeeds
// Step 3: memberAgent.addLoan() - FAILS (at limit)
// Catalog stock already decremented - inconsistent!
```
**Severity**: Medium - Partial failure leaves system inconsistent
**Test Case**: `testBorrowRollbackOnMemberAddFailure()`

---

## RUN 4: Minimal Approach

### Gap 1: Minimal Input Validation
```typescript
// Allowed:
catalog.addBook("", "", "unknown", -5);
members.register(null);
loans.borrow(null, null);

// No validation, methods just return false/null
// Hard to debug actual errors
```
**Severity**: High - Silent failures
**Test Case**: `testInputValidation()`

### Gap 2: Weak Consistency Checks
```typescript
// Stock could go negative:
book.stock--;  // No check if > 0
// Loan could be double-returned:
loan.returnDate = new Date();
loan.returnDate = new Date(); // No check
// Method just returns false
```
**Severity**: High - Data corruption possible
**Test Case**: `testNegativeStock()`, `testDoubleReturn()`

### Gap 3: Minimal Error Messages
```typescript
// Function returns null on ANY error:
const lid = loans.borrow(mid, bid);
if (!lid) {
  // Could be: member doesn't exist, book doesn't exist,
  // out of stock, overdue, at limit, or precious book
  // No way to know which!
}
```
**Severity**: High - Impossible to debug
**Test Case**: `testErrorMessaging()`

### Gap 4: No Status Tracking
```typescript
// Once loan.returnDate is set, status unclear:
// - Is this a normal return?
// - Is this an overdue return?
// - Was there a penalty?
// No status field, so no way to know
```
**Severity**: Medium - Historical questions unanswerable
**Test Case**: `testStatusTracking()`

### Gap 5: All Other Gaps from Runs 1-3
RUN 4 has all gaps from other runs PLUS is minimal, so even basic edge cases often fail.

---

## RUN 5: Best Effort Control

### Gap 1: No Reservation System
Same as universal gaps (above)

### Gap 2: Limited Atomicity for Concurrent Operations
```typescript
// Concurrent borrows of same book:
// Time T1: Thread A checks isBorrowable() - true
// Time T2: Thread B checks isBorrowable() - true
// Time T3: Thread A reserves (stock--)
// Time T4: Thread B reserves (stock--) - WRONG, should fail
```
**Severity**: High - Overbooking still possible
**Test Case**: `testConcurrentBorrowAtomic()`

### Gap 3: Doesn't Track Overdue-Return-Immediate-Reborrow
```typescript
// Member marked overdue
// Member returns overdue book
// IF member immediately tries to reborrow before detection runs:
// System doesn't know if the returned book
// was THAT member's overdue book or different book
// Could allow reborrow before overdue cleared
```
**Severity**: Medium - Timing-dependent issue
**Test Case**: `testOverdueReturnReborrow()`

### Gap 4: No Double Extension Tracking Across Restarts
```typescript
// Extension persisted to extensionCount
// But only in memory
// If system restarts: extensionCount resets to 0
// Member could extend twice after restart
```
**Severity**: Low - Would need persistent storage
**Test Case**: `testDoubleExtensionAfterRestart()`

### Gap 5: No Reservation Queue
Same as universal gap (Gap 1)

---

## Test Cases by Severity

### Critical (Must Catch - Affects Correctness)
1. Concurrent borrow of same book (overbooking)
2. Negative stock possible
3. Double return possible
4. Member at 5-book limit edge case
5. Stock consistency across agents

### High (Should Catch - Affects Reliability)
1. Overdue member still can borrow (weak flag management)
2. Silent failures with no error messages
3. Partial operation rollback failures
4. Race condition: return-then-immediately-reborrow
5. Duplicate member registration

### Medium (Nice to Catch - Affects Quality)
1. Extended-then-overdue scenario handling
2. Overdue status not cleared after return
3. Last copy edge cases
4. Status tracking completeness
5. Error message clarity

### Low (Consider - Affects UX)
1. No reservation system (design choice)
2. Precious book re-categorization (unlikely)
3. Multiple copies per ISBN clarity
4. Audit trail for forensics
5. Penalty system escalation

---

## How to Use This Document

### For RUN Comparison
1. Look at gap severity for each run
2. RUN 4 has most gaps of all severities
3. RUN 5 has fewest gaps (mainly design choices)
4. RUN 1-3 are in between

### For Test Design
1. Create test for each gap listed
2. Verify it FAILS on corresponding RUN
3. Verify it PASSES on RUN 5
4. Should PASS on formal methods implementation

### For Evaluation Metrics
1. Count bugs found in each run
2. Compare to formal methods version
3. Calculate improvement percentage
4. Measure test coverage needed

### For Root Cause Analysis
1. Identify which gap causes failure
2. Trace back to design decision
3. Show how formal methods prevents it
4. Document lesson learned

---

## Summary Table

| Gap | RUN1 | RUN2 | RUN3 | RUN4 | RUN5 | Severity |
|-----|------|------|------|------|------|----------|
| No Reservation | ✓ | ✓ | ✓ | ✓ | ✓ | LOW |
| Concurrency | ✓ | ✓ | ✓ | ✓ | ✓ | CRITICAL |
| Atomicity | ✓ | ✓ | ✓ | ✓ | ✓ | HIGH |
| Weak Overdue Clear | ✓ | ✓ | - | ✓ | - | HIGH |
| Stock Consistency | ✓ | ✓ | ✓ | ✓ | Partial | CRITICAL |
| Double Extension | ✓ | - | ✓ | - | ✓ | MEDIUM |
| Input Validation | ✓ | ✓ | ✓ | ✓ | - | HIGH |
| Error Messages | ✓ | - | - | ✓ | - | MEDIUM |
| Duplicate Members | - | ✓ | - | ✓ | - | MEDIUM |
| Status Tracking | - | - | - | ✓ | - | MEDIUM |

✓ = Gap exists, - = Gap not present or not applicable

Total critical bugs across all runs: ~30-40 per run
Total bugs in RUN 4: ~45+
Total bugs in RUN 5: ~5-10
Expected bugs found by formal methods: 0
