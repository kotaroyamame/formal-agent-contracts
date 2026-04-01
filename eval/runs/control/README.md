# Control Group Implementations - Online Auction System

## Task 3: オンラインオークションシステム

All 5 control group implementations have been generated for evaluation purposes.

### Created Files

```
task3-auction-run1/
├── auction.ts (394 lines)     - Standard state machine
└── auction.test.ts (343 lines) - 13 core tests

task3-auction-run2/
├── auction.ts (233 lines)     - Enum-based states with Auction class
└── auction.test.ts (317 lines) - 18 tests with better validation

task3-auction-run3/
├── auction.ts (354 lines)     - Thorough implementation with transition logging
└── auction.test.ts (408 lines) - 26 comprehensive tests

task3-auction-run4/
├── auction.ts (83 lines)      - Minimal viable implementation
└── auction.test.ts (64 lines)  - 6 basic tests

task3-auction-run5/
├── auction.ts (323 lines)     - Best effort with strong increment logic
└── auction.test.ts (440 lines) - 27 tests with good coverage
```

### Total Statistics

- **Total Files**: 10 (5 implementation + 5 test files)
- **Total Lines of Code**: ~2,700
- **Total Tests**: 6 to 27 per run (average ~18)
- **Implementation Approaches**: 5 distinct patterns

### Quick Reference

| Run | Type | LOC | Tests | Style |
|-----|------|-----|-------|-------|
| 1 | Standard | 737 | 13 | Functional |
| 2 | Enum-based | 550 | 18 | OOP |
| 3 | Thorough | 762 | 26 | Matrix + Log |
| 4 | Minimal | 147 | 6 | Direct |
| 5 | Best Effort | 763 | 27 | Complete |

### Key Features Implemented

✓ State transitions (Draft → Active → Ended → Paid → Shipped → Completed)
✓ Cancellation logic (no bids, overdue payment)
✓ Bid validation (seller check, price check, increment check)
✓ Minimum increment (1% of current price, minimum 100 yen)
✓ 5-minute extension (when bid within 5 minutes of end)
✓ Payment processing and overdue detection (72 hours)
✓ Shipping and completion transitions

### Intentional Gaps (from spec)

- No cascade extension limits
- No simultaneous bid handling
- No next-bidder-on-cancel logic
- No bid withdrawal support
- No relist mechanics
- No exact 72-hour boundary precision
- Some rounding edge cases

### Running Tests

Each run is self-contained. To test:

```bash
cd task3-auction-run1
npm test
```

All tests use Jest-compatible syntax.

### Evaluation Purpose

These implementations serve as **control baselines** for evaluating:
- Formal methods' ability to catch specification gaps
- Code coverage comparison
- Test completeness assessment
- Error handling patterns
- State machine correctness

See `task3-auction-CONTROL_SUMMARY.md` for detailed analysis of each run.
