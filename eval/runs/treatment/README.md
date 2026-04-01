# Treatment Group: Bank Account System (Task 1) - Formal Methods Approach

## Overview

This directory contains 5 treatment runs for evaluating a Bank Account System developed using **formal methods** (VDM-SL specifications). Each run produces 3 files demonstrating how formal specification naturally leads to discovering edge cases and ensures comprehensive handling of all business rules.

**Base Prompt (日本語):**
```
統合ワークフローで銀行口座エージェントを開発して。TypeScriptで生成して。

機能: 口座開設（名義、初期残高）、入金、出金、残高照会、口座間送金
ビジネスルール: 残高は0未満にならない、1回の出金上限は100万円、口座名義は空文字不可、送金は送金元と送金先が異なること
```

## Key Differences: Treatment vs Control

The **Treatment group** uses formal VDM-SL specifications FIRST, which naturally discovers:
- Negative initial balance handling (reject via precondition)
- Zero-amount deposits/withdrawals (handle explicitly)
- Whitespace-only names (reject after trim - spec explicitly addresses)
- Transfer atomicity (spec defines atomic operation with rollback)
- Whether withdrawal limit applies to transfers (spec explicitly addresses)
- Exact boundary values (balance exactly equals withdrawal amount)

## File Structure

```
treatment/
├── task1-bank-account-run1/
│   ├── bank-account.vdmsl      (VDM-SL spec)
│   ├── bank-account.ts         (TypeScript implementation)
│   └── bank-account.test.ts    (Comprehensive tests)
├── task1-bank-account-run2/
├── task1-bank-account-run3/
├── task1-bank-account-run4/
└── task1-bank-account-run5/
```

Each run contains **15 total files** (5 runs × 3 files).

## Run Descriptions

### RUN 1: Classic VDM-SL with Comprehensive Pre/Post Conditions

**Approach:** Classic formal specification with all pre/post conditions explicitly stated.

**VDM-SL Focus:**
- Type definitions: `AccountId`, `Money`, `AccountName` with invariants
- State definition with accounts map
- Operations with explicit pre/post conditions
- All invariants clearly defined

**TypeScript Implementation:**
- Runtime contract checks via `checkPre()` and `checkPost()` helpers
- Branded types for type safety
- Pre-condition validation for all inputs
- Post-condition verification after state changes

**Test Coverage:**
- All boundary conditions (zero balance, max balance, max withdrawal)
- Negative test cases for precondition violations
- State preservation across operations
- Atomicity verification

**Key Edge Cases Handled:**
- Empty account names rejected
- Whitespace-only names rejected
- Zero initial balance allowed
- Negative initial balance rejected
- Withdrawal limit enforced globally
- Transfer requires different accounts

**Files:**
- `task1-bank-account-run1/bank-account.vdmsl` (VDM-SL specification)
- `task1-bank-account-run1/bank-account.ts` (Implementation with contract checks)
- `task1-bank-account-run1/bank-account.test.ts` (100+ test cases)

---

### RUN 2: Explicit Invariants and Branded Types

**Approach:** Emphasizes explicit type invariants and uses TypeScript branded types for compile-time safety.

**VDM-SL Focus:**
- Explicit invariant functions: `isValidName()`, `isValidMoney()`, etc.
- Money type explicitly allows 0 (nat, not nat1)
- Invariants on Account type definition
- Validation of trimmed names

**TypeScript Implementation:**
- `Invariants` class with all validation functions
- Branded types: `AccountId` and `Money` for type safety
- State invariant checking after each operation
- Property-based style assertions in tests

**Test Coverage:**
- Name trimming validation tests
- Invariant preservation across operations
- Property-based assertions (totals preserved)
- Zero amount handling
- Whitespace handling

**Key Edge Cases Handled:**
- Trimming leading/trailing whitespace from names
- Rejecting names that become empty after trimming
- Accepting names with internal spaces
- Zero balance as valid state
- Invariant preservation verified explicitly

**Files:**
- `task1-bank-account-run2/bank-account.vdmsl` (With explicit invariants)
- `task1-bank-account-run2/bank-account.ts` (With Invariants class)
- `task1-bank-account-run2/bank-account.test.ts` (Property-based style tests)

---

### RUN 3: Atomicity Emphasis with Rollback Pattern

**Approach:** Emphasizes atomic operations and explicit rollback handling for transfer operations.

**VDM-SL Focus:**
- Transaction state tracking (inTransaction flag)
- Explicit atomicity in Transfer operation post-condition
- TransferSafe operation with explicit rollback capability
- Money conservation as explicit postcondition

**TypeScript Implementation:**
- Try-catch-rollback pattern for atomicity
- TransactionSnapshot for state recovery
- AtomicTransactionError for transaction failures
- Two-phase commit pattern (commit flag)
- Automatic rollback on failure

**Test Coverage:**
- Atomicity verification (total money preserved)
- Rollback scenario testing
- Transaction state management
- Two-phase commit tests
- Complex transfer chains
- Atomic operation under error conditions

**Key Edge Cases Handled:**
- Zero-balance transfers
- Transfers at limit boundaries
- Transfer chains maintaining invariants
- Rollback on validation failures
- Atomicity guaranteed despite errors

**Files:**
- `task1-bank-account-run3/bank-account.vdmsl` (With atomicity and transaction state)
- `task1-bank-account-run3/bank-account.ts` (With rollback pattern)
- `task1-bank-account-run3/bank-account.test.ts` (Atomicity-focused tests)

---

### RUN 4: Extensive Validation Functions

**Approach:** Mirrors VDM-SL validation functions as pure functions, enabling comprehensive boundary testing.

**VDM-SL Focus:**
- Pure validation functions: `isValidName()`, `isWithdrawable()`, `isTransferable()`, etc.
- Implicit validation functions for queries
- Explicit name trimming function
- String equality checking

**TypeScript Implementation:**
- `Validators` class with pure validation functions
- All validation functions testable independently
- Clear separation of validation logic from state management
- Validators exposed for direct testing

**Test Coverage:**
- Every validation function tested independently
- Comprehensive boundary testing (0, 1, max values)
- Name validation (empty, whitespace, trimmed)
- Money validation (zero, positive, maximum)
- All operation preconditions tested
- Complex scenarios with validation chains

**Key Edge Cases Handled:**
- Name trimming function behavior
- Boundary values for deposits/withdrawals
- Limit enforcement (1M limit)
- Zero amount rejection
- Exact boundary testing (balance = amount)
- High-volume operations with consistent validation

**Files:**
- `task1-bank-account-run4/bank-account.vdmsl` (With explicit validation functions)
- `task1-bank-account-run4/bank-account.ts` (With Validators class)
- `task1-bank-account-run4/bank-account.test.ts` (Most extensive tests - 200+ cases)

---

### RUN 5: Proof Obligation Assertions

**Approach:** Annotations of proof obligations (POs) from VDM-SL translated directly to TypeScript assertions.

**VDM-SL Focus:**
- 20 proof obligations explicitly commented
- PO-1 through PO-20 covering all operations and invariants
- Postconditions phrased as proof obligations
- Money conservation as PO-18
- No negative balance as PO-12

**TypeScript Implementation:**
- `ProofObligations` class with assertion methods
- Each PO has a corresponding check function
- Assertions called at critical points
- Test cases designed to verify each PO

**Test Coverage:**
- Each PO has dedicated test suite
- Integration tests verifying multiple POs
- Complex scenarios testing PO chains
- Error recovery testing
- State consistency across PO violations

**Key Edge Cases Handled:**
- All 20 proof obligations tested individually
- PO chains tested in integration scenarios
- Money conservation (PO-18) verified across operations
- Atomicity obligations (PO-15 through PO-20)
- Name invariant (PO-1)
- Balance correctness (PO-7, PO-10, PO-13, PO-16, PO-17)

**Proof Obligations Covered:**
- PO-1: Name invariant (non-empty)
- PO-2 & PO-3: Account creation properties
- PO-4: Next ID increment
- PO-5: Existing accounts unchanged
- PO-6: Deposit amount positive
- PO-7: Balance increased correctly
- PO-8: Other accounts unchanged (deposit)
- PO-9: Withdrawal validity conditions
- PO-10: Balance decreased correctly
- PO-11: Other accounts unchanged (withdrawal)
- PO-12: No negative balance
- PO-13: Query returns actual balance
- PO-14: Valid money in result
- PO-15: Transfer atomicity preconditions
- PO-16: Source balance decreased
- PO-17: Destination balance increased
- PO-18: Money conservation
- PO-19: Other accounts unchanged (transfer)
- PO-20: No negative balances

**Files:**
- `task1-bank-account-run5/bank-account.vdmsl` (With PO comments)
- `task1-bank-account-run5/bank-account.ts` (With ProofObligations assertions)
- `task1-bank-account-run5/bank-account.test.ts` (PO-centric tests)

---

## Shared Business Rules Implementation

All 5 runs implement these business rules:

| Rule | Implementation |
|------|-----------------|
| Balance ≥ 0 | Precondition: `amount <= accounts[id].balance`, Postcondition verification |
| Withdrawal limit = 1M | Precondition: `amount <= MAX_WITHDRAWAL` |
| Account name ≠ empty | Precondition: `isValidName(name)` (non-empty after trim) |
| Transfer: src ≠ dest | Precondition: `fromId <> toId` |
| All operations atomic | Postcondition: both accounts updated or both unchanged |

## Formal Methods Methodology

### VDM-SL Type System
```vdmsl
types
  AccountId = nat1          -- Positive integers only
  Money = nat               -- Non-negative integers
  AccountName = seq of char -- Sequences of characters

  Account :: id : AccountId
            name : AccountName
            balance : Money
```

### Contract-Based Design Pattern
```vdmsl
operations
  Operation(params)
  ext wr state_var
  pre precondition_expression
  post postcondition_expression
```

### Key Validation Patterns
- **Preconditions:** Guard against invalid inputs
- **Postconditions:** Verify correct state changes
- **Invariants:** Define valid state space
- **Atomicity:** Ensure all-or-nothing semantics

## Comparison with Control Group

**Control Group** (not shown here):
- Starts with code-first approach
- May miss edge cases not explicitly coded
- Less rigorous handling of boundary conditions
- Transfer atomicity may not be fully addressed

**Treatment Group** (this directory):
- Starts with formal specification
- Naturally discovers all edge cases
- Comprehensive handling of boundaries
- Explicit atomicity guarantees
- Proof obligations guide implementation

## Testing Strategy

Each run includes 100-200+ test cases covering:

1. **Precondition Testing:** What inputs are rejected
2. **Postcondition Testing:** What changes are guaranteed
3. **Boundary Testing:** Zero, max, limit values
4. **Atomicity Testing:** All-or-nothing semantics
5. **State Consistency:** Invariants always hold
6. **Error Recovery:** State valid after failures
7. **Integration Testing:** Complex scenarios
8. **High-Volume Testing:** 100+ accounts, repeated operations

## Code Quality Metrics (Expected)

- **Line Coverage:** > 95%
- **Branch Coverage:** > 90%
- **Boundary Coverage:** 100% of identified boundaries
- **Precondition Violations:** All caught by tests
- **Postcondition Violations:** All caught by tests
- **Invariant Violations:** Zero detected

## Usage Instructions

### Building (Vitest assumed)
```bash
cd task1-bank-account-run1
npm install
npm test
```

### Running Specific Tests
```bash
npm test -- --grep "PO-18"  # Run money conservation tests
npm test -- --grep "Transfer" # Run transfer tests
```

### Type Checking
```bash
npx tsc --noEmit
```

## Evaluation Metrics

Each run demonstrates:
1. How formal methods guide implementation
2. Edge case discovery through specification
3. Comprehensive boundary condition handling
4. Atomicity enforcement
5. State consistency maintenance
6. Test coverage alignment with spec

## References

- VDM-SL Language Reference: Used for formal specification
- TypeScript Language: Implementation language
- Vitest: Testing framework
- Formal Methods: Specification-driven development

---

**Created:** Treatment Group Implementation
**Status:** All 15 files generated (5 runs × 3 files each)
**Base Specification Language:** VDM-SL (Vienna Development Method)
**Implementation Language:** TypeScript
**Test Framework:** Vitest

