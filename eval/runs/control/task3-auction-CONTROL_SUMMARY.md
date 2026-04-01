# Task 3: Online Auction System - Control Group Implementations

## Overview
Five control group implementations for evaluating an Online Auction System WITHOUT formal methods (no VDM-SL, no formal specs). Each run uses slightly different approaches while covering the base functionality specified in the requirements.

## Base Requirements
- 出品（商品名、開始価格、期間、出品者ID）
- 入札（オークションID、入札額、入札者ID）
- 落札（期間終了時に最高額入札者が落札）
- 支払い処理
- 商品発送確認

**State Transitions**: Draft → Active → Ended → Paid → Shipped → Completed / Active → Cancelled (no bids only)

**Business Rules**:
- Bids must exceed current highest
- Seller cannot bid on own auction
- Bidding only during active period
- Last-5-minute extension: if bid within 5 min of end, extend by 5 min
- Minimum increment: 1% of current price (minimum 100 yen)
- Auto-cancel after 72 hours without payment

---

## RUN 1: Standard State Machine Implementation
**Path**: `task3-auction-run1/`

### Approach
- Straightforward state machine with Map-based storage
- Simple AuctionSystem class with direct method calls
- Type-based validation

### Key Characteristics
- Basic state transitions
- Bid validation with minimum increment check
- 5-minute extension logic (single case)
- PaymentOverdue detection

### Test Coverage (13 tests)
- Creation and activation
- Bidding validation (seller check, price check, increment check)
- 5-minute extension
- State transitions
- Payment processing
- Shipping and completion
- Overdue detection

### Known Gaps (from spec)
- No cascade extension limit
- No simultaneous bid handling
- No next-bidder-on-timeout logic
- No relist from cancelled state
- No bid withdrawal
- No rounding edge cases
- First bid vs starting price ambiguity
- Exact boundary timing issues

---

## RUN 2: Class-based with Enum States
**Path**: `task3-auction-run2/`

### Approach
- Enum-based state representation (AuctionStateEnum)
- Auction class encapsulates item data
- AuctionRepository pattern for data access
- Better state transition validation using VALID_TRANSITIONS map

### Key Characteristics
- Type-safe state transitions via enum
- Encapsulated Auction class with getters/setters
- Repository pattern for collection management
- State validation before transitions

### Test Coverage (18 tests)
- Creation and state transitions
- Bid logic with seller validation
- Minimum increment calculation (1% and 100 yen floor)
- Payment and shipping
- Cancellation (Active/Ended)
- Overdue payment detection
- Extension logic with time injection

### Known Gaps (from spec)
- Extension cascade limit
- Concurrent/simultaneous bids
- 72h exact boundary precision
- Draft-to-Cancel invalid transition
- Proxy bidding
- Zero/negative price validation
- Zero duration validation

---

## RUN 3: More Thorough Implementation
**Path**: `task3-auction-run3/`

### Approach
- AuctionEngine with comprehensive validation
- Explicit transition logging
- VALID_TRANSITIONS map for state machine definition
- Time-injection support for testing
- Detailed error messages

### Key Characteristics
- Strong input validation (no negative/zero values)
- Transition history tracking
- Explicit state validation matrix
- Separation of concerns (bids, auctions, transitions)
- Detailed error reporting

### Test Coverage (26 tests)
- Parameter validation
- State transition history
- Complete lifecycle
- Bidding mechanics (seller, price, increment)
- 1% increment rule with edge cases
- 5-minute extension both ways
- Auction ending (with/without bids)
- Payment and shipping transitions
- Cancellation logic
- Overdue detection with time checks

### Known Gaps (from spec)
- Extension cascade limit not enforced
- No simultaneous bid handling
- No next-bidder-on-cancel logic
- Invalid Draft transitions not all blocked
- Exact timing boundaries at state changes

---

## RUN 4: Minimal Approach
**Path**: `task3-auction-run4/`

### Approach
- SimpleAuctionSystem class
- Minimal code footprint
- Direct Map storage
- Basic validation

### Key Characteristics
- Fewest lines of code
- Simple method names (bid, end, pay, ship, complete, activate)
- No complex data structures
- Direct state mutation
- Minimal test coverage

### Test Coverage (6 tests)
- Creation and activation
- Valid bid acceptance
- Seller bid rejection
- Minimum increment enforcement
- Auction ending transition
- Full lifecycle happy path

### Known Gaps (from spec)
- No extension cascade handling
- No concurrent bid logic
- Missing most edge cases
- Limited validation
- No error message detail
- No transition history
- Minimal test coverage

---

## RUN 5: Best Effort Implementation
**Path**: `task3-auction-run5/`

### Approach
- AuctionManager with clear method names
- Focus on minimum increment calculation
- Time-injection throughout
- Good happy-path test coverage
- Separation of auction and bid registries

### Key Characteristics
- Detailed calculateMinimumIncrement logic
- Time-parameterized methods for testing
- Comprehensive error messages
- Highest bidder tracking
- Payment overdue detection

### Test Coverage (27 tests)
- Creation and activation
- Bidding mechanics (seller, price checks)
- 1% rule with 100 yen minimum
- Multiple bids in order
- Highest bid tracking
- 5-minute extension (extended and early cases)
- Auction ending (with/without bids)
- Payment from winner/non-winner
- Shipping and completion
- Cancellation (Active/Ended)
- Overdue detection (72h+ and <72h)
- Complete happy-path lifecycle

### Known Gaps (from spec)
- Extension cascade limit
- Concurrent/simultaneous bids
- Next-bidder-on-cancel
- Relist mechanics
- 72h boundary precision
- Exact-time-boundary edge cases

---

## Comparison Matrix

| Feature | RUN 1 | RUN 2 | RUN 3 | RUN 4 | RUN 5 |
|---------|-------|-------|-------|-------|-------|
| State Machine | Basic | Enum | Matrix | Basic | Map-based |
| Data Encapsulation | Low | High | Medium-High | Low | Medium |
| Test Count | 13 | 18 | 26 | 6 | 27 |
| Transition History | No | No | Yes | No | No |
| Error Messages | Basic | Basic | Detailed | Minimal | Detailed |
| Time Injection | No | Limited | Full | No | Full |
| Increment Logic | Basic | Basic | Basic | Basic | Detailed |
| Extension Logic | Yes | Yes | Yes | Yes | Yes |

---

## File Structure

```
task3-auction-run1/
├── auction.ts (394 lines)
└── auction.test.ts (343 lines)

task3-auction-run2/
├── auction.ts (233 lines)
└── auction.test.ts (317 lines)

task3-auction-run3/
├── auction.ts (354 lines)
└── auction.test.ts (408 lines)

task3-auction-run4/
├── auction.ts (83 lines)
└── auction.test.ts (64 lines)

task3-auction-run5/
├── auction.ts (323 lines)
└── auction.test.ts (440 lines)
```

---

## Key Distinctions

### RUN 1 vs RUN 2
- RUN 1: Functional approach with direct system calls
- RUN 2: Class-based with enum state representation

### RUN 3 vs Others
- RUN 3: Only one with explicit transition logging and validation matrix
- Strictest input validation

### RUN 4 vs All
- Minimal viable implementation
- Fewest tests (6 vs 13-27)
- Simplest code structure

### RUN 5 vs All
- Best test coverage (27 tests)
- Most detailed error messages
- Strongest happy-path implementation
- Focus on minimum increment calculation

---

## Edge Cases Intentionally NOT Covered

Based on specification analysis, all runs intentionally miss these edge cases:

1. **Cascade Extension Limit**: No limit on how many times an auction can be extended
2. **Simultaneous Bids**: No race condition handling for concurrent bid placement
3. **Next-Bidder-On-Cancel**: No logic to notify or auto-place next highest bidder
4. **Relist from Cancelled**: No ability to relist after automatic cancellation
5. **Bid Withdrawal**: No support for bidder cancellation of their bid
6. **Rounding Edge Cases**: 1% calculation may not perfectly handle all values
7. **First Bid Semantics**: Ambiguity between minimum increment from start price vs. first bid requirement
8. **Exact Timing Boundaries**: Millisecond-precision edge cases not handled

---

## Evaluation Notes

These implementations serve as **control group baselines** for evaluating formal methods approaches. Each run demonstrates:

- Different implementation styles (minimal → thorough)
- Varying test coverage levels
- Different error handling strategies
- Progressive encapsulation and validation approaches

The intentional gaps allow comparison with formal specifications that would catch all edge cases systematically.
