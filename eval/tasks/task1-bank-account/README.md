# Task 1: Bank Account Agent
## Gold Standard Evaluation Benchmark

This directory contains the complete gold standard for Task 1 of the formal-agent-contracts evaluation benchmark.

## File Manifest

### 1. `prompt.md`
**The task prompt given to both control and treatment groups**

Contains:
- Japanese task description (銀行口座エージェント開発タスク)
- 5 core operations: Account creation, deposit, withdrawal, balance inquiry, transfer
- 4 business rules: Account name validation, balance non-negativity, withdrawal limits, transfer constraints
- Explicit acknowledgment of intentional ambiguities
- Success criteria

**Use**: Provide to evaluation participants as the complete task specification.

### 2. `traps.json`
**Structured definition of all 10 embedded traps (specification gaps)**

Each trap contains:
- ID (T1-01 through T1-10)
- Name and description
- Category (boundary_value | atomicity | ambiguity | edge_case)
- Severity (critical | major | minor)
- Specification gap explanation
- Expected behavior(s)
- Scoring criteria (0/1/2/3 rubric)

**Use**:
- Reference guide for evaluators
- Score answer keys (0=incorrect, 1=partial, 2=good, 3=gold standard)
- Analyze which trap categories students struggle with most

### 3. `gold-spec.vdmsl`
**Formal VDM-SL specification - the gold standard complete specification**

Contains:
- Type definitions with invariants
- 5 operation specifications with pre/post conditions
- Helper functions for validation (whitespace detection, limit checking, etc.)
- State definition
- Implementation notes explaining trap handling

**Properties**:
- Handles all 10 traps explicitly
- Type-level invariants enforce business rules
- Pre/post conditions prevent invalid operations
- Comments clarify each design decision

**Use**:
- Reference for what "correct" looks like
- Training material for formal specifications
- Benchmark for comparing generated specifications

### 4. `gold-tests.ts`
**Jest test suite - ~50 test cases covering all rules and traps**

Structure:
- `BankAccountImpl`: Minimal reference implementation
- 14 test suites:
  - 5 basic operation suites (create, deposit, withdraw, inquiry, transfer)
  - 10 trap-specific suites (T1-01 through T1-10)
  - 3 integration/consistency test suites
- 46 individual test cases

**Properties**:
- Test names include trap IDs for traceability
- Both positive (accept valid) and negative (reject invalid) tests
- Boundary value tests at critical limits
- Atomicity and consistency verification
- Reference implementation embedded for reproducibility

**Use**:
- Validate answer code correctness
- Calculate test coverage metrics
- Identify which rule categories cause failures

## Evaluation Metrics

The 4-point rubric in traps.json enables scoring across dimensions:

| Score | Meaning |
|-------|---------|
| **0** | Incorrect behavior (violates rule or crashes) |
| **1** | Partial implementation (handles case but poorly documented) |
| **2** | Correct but undocumented (works but design not explicit) |
| **3** | Gold standard (correct, tested, documented, explicit design) |

### Scoring Strategy

1. **Per-trap scoring**: Evaluate each trap against its scoring criteria
2. **Per-operation scoring**: Aggregate trap scores to operation quality
3. **Overall score**: Average or weighted sum across all traps
4. **Category analysis**: Which categories (boundary_value, atomicity, etc.) need improvement?
5. **Severity-weighted score**: Weight critical traps more heavily

## Key Design Decisions

The gold standard implements these interpretations:

1. **T1-02 (Zero Deposit)**: Accepted - contributes 0 to balance
2. **T1-03 (Zero Withdrawal)**: Rejected - must be positive
3. **T1-05/T1-06 (Withdrawal Limit)**: Inclusive boundary (<=1,000,000)
4. **T1-09 (Transfer Limit)**: Transfers subject to same 1M limit as withdrawals
5. **T1-10 (Whitespace Names)**: Rejected - treated like empty strings

All design decisions are documented in `gold-spec.vdmsl` comments and validated by `gold-tests.ts`.

## Usage for Evaluation

### Control Group
1. Provide `prompt.md` only
2. Collect implementations in any language
3. Evaluate against all 46 test cases in `gold-tests.ts`
4. Score each trap using rubric in `traps.json`

### Treatment Group
1. Provide `prompt.md` + `gold-spec.vdmsl` (formal specification)
2. Collect implementations (ideally VDM-SL or annotated)
3. Evaluate against same test suite
4. Compare specification quality and test coverage

### Scoring Analysis
- **Correctness**: % of test cases passing
- **Completeness**: How many traps are explicitly handled?
- **Documentation**: Are design decisions documented?
- **Specification**: For treatment group, quality of formal specification
- **Robustness**: Score distribution across 0/1/2/3 scale

## Files at a Glance

| File | Lines | Purpose | Format |
|------|-------|---------|--------|
| `prompt.md` | 75 | Task specification | Markdown |
| `traps.json` | 166 | Trap definitions & scoring | JSON |
| `gold-spec.vdmsl` | 224 | Formal specification | VDM-SL |
| `gold-tests.ts` | 671 | Test suite + reference impl | TypeScript/Jest |
| `TRAP_COVERAGE.md` | (reference) | Coverage matrix | Markdown |
| `README.md` | (this file) | Evaluation guide | Markdown |

## Extending This Task

For future iterations:
- Add performance/efficiency traps (e.g., large transaction volumes)
- Add concurrency traps (simultaneous transfers)
- Add internationalization traps (multi-currency)
- Add persistence traps (state recovery)

## Quality Assurance

All files have been validated for:
- Syntax correctness (JSON, VDM-SL, TypeScript)
- Semantic completeness (all 10 traps covered)
- Consistency (same trap handled identically across files)
- Reproducibility (reference implementation matches VDM-SL spec)
- Production quality (documentation, comments, naming)

---

**Created**: 2026-04-01
**Benchmark**: formal-agent-contracts evaluation (Task 1)
**Language**: Japanese + English
**Status**: Gold Standard Complete
