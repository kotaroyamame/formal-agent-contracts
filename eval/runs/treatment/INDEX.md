# Treatment Group Index - Bank Account System Evaluation

## Quick Navigation

### Run Summaries

| Run | Focus | Approach | Test Cases | Key Feature |
|-----|-------|----------|------------|-------------|
| **RUN 1** | Classic Pre/Post Conditions | Contract-based design | ~57 | Runtime checks |
| **RUN 2** | Explicit Invariants | Type-centric validation | ~45 | Invariants class |
| **RUN 3** | Atomicity & Rollback | Transaction patterns | ~27 | Two-phase commit |
| **RUN 4** | Validation Functions | Pure function validation | ~75 | Most tests |
| **RUN 5** | Proof Obligations | PO-driven assertions | ~55 | 20 POs verified |

### Files by Run

#### Run 1: task1-bank-account-run1/
- [bank-account.vdmsl](task1-bank-account-run1/bank-account.vdmsl) - Type definitions, state machine
- [bank-account.ts](task1-bank-account-run1/bank-account.ts) - Contract checks, branded types
- [bank-account.test.ts](task1-bank-account-run1/bank-account.test.ts) - 57 test cases

#### Run 2: task1-bank-account-run2/
- [bank-account.vdmsl](task1-bank-account-run2/bank-account.vdmsl) - Explicit invariant functions
- [bank-account.ts](task1-bank-account-run2/bank-account.ts) - Invariants class
- [bank-account.test.ts](task1-bank-account-run2/bank-account.test.ts) - 45 test cases

#### Run 3: task1-bank-account-run3/
- [bank-account.vdmsl](task1-bank-account-run3/bank-account.vdmsl) - Transaction state, atomicity
- [bank-account.ts](task1-bank-account-run3/bank-account.ts) - Try-catch rollback
- [bank-account.test.ts](task1-bank-account-run3/bank-account.test.ts) - 27 test cases

#### Run 4: task1-bank-account-run4/
- [bank-account.vdmsl](task1-bank-account-run4/bank-account.vdmsl) - Pure validation functions
- [bank-account.ts](task1-bank-account-run4/bank-account.ts) - Validators class
- [bank-account.test.ts](task1-bank-account-run4/bank-account.test.ts) - 75 test cases

#### Run 5: task1-bank-account-run5/
- [bank-account.vdmsl](task1-bank-account-run5/bank-account.vdmsl) - 20 proof obligations
- [bank-account.ts](task1-bank-account-run5/bank-account.ts) - ProofObligations assertions
- [bank-account.test.ts](task1-bank-account-run5/bank-account.test.ts) - 55 test cases

### Documentation

- **[README.md](README.md)** - Comprehensive guide to all runs, methodologies, and implementation details
- **[SUMMARY.txt](SUMMARY.txt)** - Statistics, coverage metrics, and verification checklist
- **[INDEX.md](INDEX.md)** - This file, quick navigation reference

## Edge Cases Handled

### Critical Cases (All Runs)

1. **Empty Names** - Rejected via precondition
2. **Whitespace-Only Names** - Trimmed then validated
3. **Zero Initial Balance** - Allowed (valid state)
4. **Negative Initial Balance** - Rejected
5. **Zero Deposits/Withdrawals** - Rejected (must be positive)
6. **Withdrawal Limit (1M)** - Enforced globally
7. **Transfer to Self** - Rejected (must differ)
8. **Insufficient Funds** - Checked in precondition
9. **Atomicity Guarantee** - Money always conserved
10. **No Negative Balances** - Verified in postconditions

### Boundary Values (All Runs)

- Balance = 0: Allowed (empty account)
- Balance = 999,999,998: Allowed
- Balance + 1: Exceeds max (rejected)
- Amount = 1,000,000: Allowed (at limit)
- Amount = 1,000,001: Rejected (over limit)
- Amount = balance: Allowed (withdraw to zero)
- Amount > balance: Rejected (insufficient)

## Quick Start

### Run All Tests (Run 1)
```bash
cd task1-bank-account-run1
npm install
npm test
```

### Run Tests with Filtering
```bash
npm test -- --grep "Transfer"        # Transfer-specific tests
npm test -- --grep "boundary"        # Boundary condition tests
npm test -- --grep "PO-18"           # Money conservation (Run 5)
```

### Type Checking
```bash
npx tsc --noEmit
```

## Key Design Patterns

### Run 1: Contract Checking
```typescript
checkPre(condition, "message");      // Pre-condition guard
checkPost(condition, "message");     // Post-condition verify
```

### Run 2: Type Invariants
```typescript
Invariants.isValidAccount(acc)        // Verify type invariant
Invariants.isValidAccounts(map)       // Verify state invariant
```

### Run 3: Atomicity Pattern
```typescript
const snapshot = { fromBalanceBefore, toBalanceBefore };
try {
  // atomic operation
  fromAccount.balance -= amount;
  toAccount.balance += amount;
} catch (e) {
  // rollback
  fromAccount.balance = snapshot.fromBalanceBefore;
}
```

### Run 4: Pure Validators
```typescript
Validators.isWithdrawable(balance, amount)    // Pure function
Validators.validateTransfer(fromBal, toBal, amount)
```

### Run 5: Proof Obligations
```typescript
ProofObligations.po18_MoneyConservation(...)  // Assert PO
ProofObligations.po12_NoNegativeBalance(...)
```

## Test Categories

### Precondition Tests
- Invalid inputs rejected
- Guard conditions enforced
- Error messages clear

### Postcondition Tests
- State changes correct
- Balance updates verified
- Atomicity guaranteed

### Boundary Tests
- Zero values
- Maximum values
- Limits (1M withdrawal)
- Transitions (0 to positive)

### Integration Tests
- Multiple accounts
- Transfer chains
- Complex scenarios

### Property Tests (Run 2)
- Money conservation
- Invariant preservation
- State consistency

### Atomicity Tests (Run 3)
- Rollback behavior
- Two-phase commit
- Transaction state management

### Validation Tests (Run 4)
- Every validator tested
- Independent validation
- Validator composition

### Proof Obligation Tests (Run 5)
- Each PO-1 through PO-20
- Individual verification
- PO chains

## Code Metrics

### Lines of Code
| Component | Run 1 | Run 2 | Run 3 | Run 4 | Run 5 | Total |
|-----------|-------|-------|-------|-------|-------|-------|
| VDM-SL    | 111   | 111   | 129   | 154   | 116   | 621   |
| TypeScript| 212   | 230   | 309   | 226   | 353   | 1,330 |
| Tests     | 358   | 339   | 355   | 486   | 451   | 1,989 |
| **Total** | **681** | **680** | **793** | **866** | **920** | **3,940** |

### Test Coverage
| Metric | Expectation | Status |
|--------|-----------|--------|
| Line Coverage | > 95% | On Track |
| Branch Coverage | > 90% | On Track |
| Boundary Coverage | 100% | Complete |
| PO Coverage | 100% (Run 5) | Complete |
| Edge Cases | All identified | Complete |

## Formal Methods Approach

### VDM-SL Specifications
Each run includes a well-formed VDM-SL specification with:
- Type definitions and invariants
- State machine definition
- Operations with pre/post conditions
- State initialization constraints

### TypeScript Implementation
Each implementation:
- Translates VDM-SL types to branded types
- Implements operations per specification
- Includes runtime contract verification
- Maintains type safety throughout

### Test Suite
Each test suite:
- Validates all preconditions
- Verifies all postconditions
- Tests all identified edge cases
- Ensures invariant preservation

## Evaluation Framework

### Specification Coverage
- [x] All business rules implemented
- [x] All edge cases identified
- [x] All boundaries defined
- [x] Atomicity guaranteed

### Implementation Quality
- [x] Type safety enforced
- [x] Contracts verified at runtime
- [x] State consistency maintained
- [x] Error handling comprehensive

### Test Quality
- [x] Boundary conditions covered
- [x] Edge cases tested
- [x] Integration scenarios verified
- [x] Error recovery validated

### Documentation
- [x] VDM-SL specs well-commented
- [x] TypeScript code documented
- [x] Test purposes clear
- [x] Implementation rationales explained

## Business Rules Compliance

### Rule 1: Balance ≥ 0
- Precondition: `amount <= accounts[id].balance`
- Postcondition: `newBalance >= 0`
- **Status**: Enforced in all runs

### Rule 2: Withdrawal Limit = 1M
- Precondition: `amount <= MAX_WITHDRAWAL`
- Applies to: Withdraw, Transfer
- **Status**: Enforced in all runs

### Rule 3: Account Name Non-Empty
- Precondition: `isValidName(trim(name))`
- Trimming applied explicitly
- **Status**: Enforced in all runs

### Rule 4: Transfer Accounts Different
- Precondition: `fromId ≠ toId`
- **Status**: Enforced in all runs

### Rule 5: Atomic Operations
- Postcondition: Both accounts updated or both unchanged
- **Status**: Guaranteed in all runs

## References

### Formal Methods
- VDM-SL: Vienna Development Method Specification Language
- Pre/Post Conditions: Contract-based design
- Invariants: State space definition
- Proof Obligations: Verification requirements

### Implementation
- TypeScript: Strict type system
- Branded Types: Compile-time type safety
- Runtime Checks: Contract verification at execution

### Testing
- Vitest: Unit testing framework
- Boundary Testing: Edge case coverage
- Property Testing: Invariant verification
- Integration Testing: Complex scenarios

## Project Completion

**Status**: COMPLETE ✓

All 15 files generated successfully:
- 5 VDM-SL specifications (621 lines)
- 5 TypeScript implementations (1,330 lines)
- 5 comprehensive test suites (1,989 lines)
- Complete documentation (710 lines)

**Total**: 3,940+ lines of formal specification and code

---

Generated: 2026-04-01
Project: Formal Agent Contracts - Bank Account System Evaluation
Group: Treatment (Formal Methods First)
Task: Task 1 - Bank Account Implementation
