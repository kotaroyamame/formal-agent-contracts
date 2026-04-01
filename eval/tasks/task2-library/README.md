# Task 2: 図書館貸出管理システム (Library Loan System)
## Gold Standard Benchmark Files

This directory contains the gold standard benchmark files for Task 2 of the formal-agent-contracts evaluation benchmark.

### Files

1. **prompt.md** (55 lines)
   - Task description in Japanese
   - 3-agent architecture: CatalogAgent, MemberAgent, LoanAgent
   - 6 key business rules covering: max 5 books, overdue restrictions, stock management, 14-day loan period with 1x extension, 3 book categories (precious books in-library only)
   - Success criteria for evaluation

2. **traps.json** (205 lines)
   - 12 trap scenarios (T2-01 through T2-12)
   - Each trap includes: id, title, description, category, severity, expected behavior, test scenario, scoring
   - Traps cover: undefined features, state consistency, boundary values, cross-agent consistency, invalid operations, category constraints
   - Severity breakdown: 1 critical, 10 high, 1 medium

3. **gold-spec.vdmsl** (445 lines)
   - Formal specification in VDM-SL
   - 4 modules: SharedTypes, CatalogAgent, MemberAgent, LoanAgent, CrossAgentContracts
   - Type definitions, state operations, invariants, pre/post-conditions
   - Cross-agent workflow contracts for: borrow, return, extend, overdue check
   - Explicit trap coverage comments (T2-01 through T2-12)

4. **gold-tests.ts** (1022 lines)
   - Jest test suite with 60+ test cases
   - Mock implementations of all 3 agents
   - LibrarySystem integration layer
   - Test organization:
     * Setup: Book registration, member registration
     * Rule-specific tests: Loan count, stock consistency, extension, overdue, precious books, due date boundaries
     * Trap coverage tests: One or more tests per T2-XX trap
     * Edge cases: Invalid operations, comprehensive workflows
   - Tests verify both individual operations and cross-agent interactions

### Trap Coverage Matrix

| Trap | Title | Category | Tests |
|------|-------|----------|-------|
| T2-01 | Reservation system | Undefined feature | Setup, T2-01 block |
| T2-02 | Overdue → re-borrow | State resolution | T2-02, T2-12 multi-loan |
| T2-03 | Loan count correctness | State consistency | T2-03 (comprehensive) |
| T2-04 | Catalog vs Loan sync | Cross-agent | T2-04 (borrow/return/multi-copy) |
| T2-05 | Double extension | State violation | T2-05 (dual extend attempts) |
| T2-06 | Overdue after extend | Due date calculation | T2-06 (extended due date) |
| T2-07 | Multiple copies | Inventory | T2-04 (multiple copies subsection) |
| T2-08 | Last copy boundary | Boundary value | T2-08 (stock = 0) |
| T2-09 | Duplicate member | Data integrity | Setup: Member Registration |
| T2-10 | Invalid return | Invalid operation | T2-10 (never borrowed) |
| T2-11 | Precious book loan | Category constraint | T2-11 (category rejection) |
| T2-12 | Day 14 boundary | Boundary value | T2-12 (due date = 14, return 15) |

### Execution Notes

- VDM-SL spec can be validated with VDMJ tool: `vdmj -check gold-spec.vdmsl`
- Jest tests execute with: `jest gold-tests.ts`
- All tests pass against the gold reference implementation
- Test structure mirrors trap IDs for traceability

### Key Design Decisions

1. **Agent Boundaries**:
   - CatalogAgent: Book data + stock management
   - MemberAgent: Member data + eligibility + loan count tracking
   - LoanAgent: Loan records + due date logic + overdue tracking

2. **Cross-Agent Contracts**:
   - Borrow: stock_before = stock_after + 1, loan_count_before + 1 = loan_count_after
   - Return: stock increases, loan_count decreases, overdue status cleared if no active overdue loans
   - Extension: 1x per loan, adds 7 days to due_date

3. **Boundary Handling**:
   - Day 14 is the due date (inclusive) — return on day 14 is on-time
   - Day 15+ is overdue
   - Overdue status = true only if has active overdue loans, cleared when all resolved

### References

- Task specification: prompt.md
- Test scenarios: gold-tests.ts (60+ cases)
- Formal reference: gold-spec.vdmsl (VDM-SL)
