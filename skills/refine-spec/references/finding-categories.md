# Finding Categories and Classification Guide

## Overview

A "Finding" is any dialogue result that changes, clarifies, or confirms the specification. This guide provides detailed definitions, examples, and action templates for each Finding category.

---

## Category 1: Bug

### Definition

**Bug:** Code behaves differently from user's intent. The code is wrong and needs fixing.

Characteristics:
- User says "No, that's not what we want"
- Code implements incorrect logic
- Test might be passing, but doesn't test the intended behavior
- Often discovered when user sees the plain-language translation

Severity levels:
- **Critical:** Violates core business logic; causes data loss or security issue
- **High:** Causes incorrect behavior in normal scenarios
- **Medium:** Affects edge cases or non-essential functionality
- **Low:** Cosmetic or rarely-triggered issues

### Examples

**Example 1: Refund Exception Instead of Credit**

```
FINDING #1: Refund handling bug
Category: Bug
Severity: High

Source dialogue:
QUESTION: Refund exception handling

Current behavior:
When a customer requests a refund, if the original transaction record
cannot be found, the system throws an exception and the account balance
is not changed.

Is this what you intended?
  User's answer: (b) No, we should still credit the account anyway

Interpretation:
User expects refunds to ALWAYS credit the account, regardless of whether
the original transaction can be found. Current code throws exception instead.
This is a logic error.

Recommended action:
CODE FIX REQUIRED:
  In: refund(amount) operation
  Current: throw InsufficientTransactionError if !transactionExists(id)
  Change to: Always execute balance_after = balance_before + amount

SPEC CHANGE:
  Remove pre-condition: "pre: transaction_exists(id)"
  Add post-condition: "post: balance_after = balance_before + amount"

Priority: High (impacts revenue recognition)
```

**Example 2: Negative Deposits Allowed When They Shouldn't Be**

```
FINDING #5: Negative deposit acceptance
Category: Bug
Severity: Medium

Source dialogue:
QUESTION: Negative amount handling

Current behavior:
The code accepts deposit(-100) without error and debits the account
(the pre-condition check amount > 0 is not enforced).

Is this intentional?
  User's answer: (b) No, negative amounts should be rejected

Interpretation:
Code pre-condition says "amount > 0" but isn't enforced (no type system
prevents this at compile time). User expects negative deposits to be rejected
at runtime with an error.

Recommended action:
CODE FIX REQUIRED:
  In: deposit(amount) operation
  Add explicit guard: if amount <= 0 then throw InvalidAmountError

SPEC CHANGE:
  Tighten pre-condition with explicit validation language:
  "pre: amount > 0 (rejected if violated with InvalidAmountError)"

Priority: Medium (prevents subtle data corruption)
```

**Example 3: Concurrent Withdrawals Not Serialized**

```
FINDING #12: Non-atomic concurrent withdrawals
Category: Bug
Severity: Critical

Source dialogue:
MISSING SPEC: Concurrent withdraw safety

Should the specification include concurrency guarantees?
  User's answer: (a) Yes, it must be thread-safe.
  Clarification: "If two concurrent withdrawals are requested on the same
  account, exactly one should succeed. The second should fail."

Interpretation:
Current code has no locking. Two threads can both read balance=100 and both
execute withdraw(50), resulting in balance=50 instead of balance=0. This is
a classic race condition.

Recommended action:
CODE FIX REQUIRED:
  In: withdraw(amount) operation
  Add: Mutual exclusion lock on account.balance during read-modify-write

SPEC CHANGE:
  Add invariant: "Only one withdraw() call can execute atomically on
  the same account at any time"
  Add operation atomicity clause to withdraw() spec

Priority: Critical (data integrity, production-blocking)
```

### Bug Classification Decision Tree

```
Does user's answer say "No, it's wrong" or "That's a bug"?
  ↓ YES
Is the code implementing incorrect logic?
  ↓ YES
Can the bug cause data loss or incorrect behavior?
  ↓ YES → Classify as BUG
```

### Recording a Bug

**Template:**
```
FINDING #{N}: {Title}
Category: Bug
Severity: [Critical | High | Medium | Low]

Source dialogue:
{Reference to QUESTION or MISSING item}

User's answer:
"{Exact quote of user response}"

Interpretation:
{What user intended vs. what code actually does}

Current code:
{Snippet of incorrect implementation}

Recommended action:

CODE FIX:
  Location: {File and function}
  Problem: {What's wrong}
  Fix: {How to fix it}

SPEC CHANGE:
  From: {Current spec line}
  To: {New/corrected spec line}

Priority: [Critical | High | Medium | Low]
Testing: {How to verify the fix works}

Blocked features: [List any features this bug blocks]
```

---

## Category 2: Spec Gap

### Definition

**Spec Gap:** Specification should handle something, but code doesn't exist.

Characteristics:
- User says "Yes, we should handle this" but no code exists
- Feature is mentioned in requirements but not implemented
- Edge case or missing behavior from [MISSING] question
- Often discovered during [MISSING] dialogue category

Severity levels:
- **Critical:** Core feature missing; app can't launch
- **High:** Important feature missing; affects user workflows
- **Medium:** Nice-to-have feature; workaround exists
- **Low:** Future enhancement; can wait

### Examples

**Example 1: Missing Audit Logging**

```
FINDING #4: Audit logging not implemented
Category: Spec Gap
Severity: Medium

Source dialogue:
MISSING SPEC: Audit logging

Your requirements mention "All operations must be logged for compliance"
but the code has no logging.

Should we add audit logging to the spec?
  User's answer: (a) Yes, implement it now.
  Clarification: "Log all transaction operations with timestamp, user ID,
  amount, and result (success/failure)."

Interpretation:
User requirement clearly calls for audit logging. Code has TODO comment but
no implementation. This is a spec gap requiring new code + spec lines.

Recommended action:

NEW CODE NEEDED:
  Function: auditLog(operation, userId, details, timestamp, result)
  Behavior: Write to persistent audit log

NEW SPEC LINES:
  invariant: "All financial operations are logged to audit_log with
  complete details"

  post-condition for deposit/withdraw/refund:
  "post: audit_log.append({operation, user, amount, timestamp, result})"

Effort estimate: Medium (2-3 days)
Testing: Audit log query, compliance verification
Priority: Medium (required for regulatory, but v1 can launch with
manual logging workaround)

Implementation guidance:
- Create AuditLog entity with fields: operation, user_id, amount,
  timestamp, result, details
- Call auditLog() in each financial operation post-condition
- Ensure logging cannot be disabled in production
```

**Example 2: Missing Transaction Rollback Mechanism**

```
FINDING #8: No transaction rollback
Category: Spec Gap
Severity: High

Source dialogue:
MISSING SPEC: Multi-step operation atomicity

The code does NOT handle:
- Rolling back a deposit if the subsequent notification fails
- Partial operation failure recovery

Should the specification include transaction rollback?
  User's answer: (a) Yes, if deposit succeeds but email notification fails,
  both should roll back (money not credited, no partial operation).

Interpretation:
User requires ACID-like guarantees: either entire operation succeeds or
nothing changes. Current code has no rollback mechanism.

Recommended action:

NEW CODE NEEDED:
  Pattern: Transaction with rollback capability

  deposit_with_notification():
    try:
      - Execute balance update
      - Execute email notification
    catch error:
      - Roll back balance update
      - Report failure to user

NEW SPEC LINES:
  operation deposit_with_notification(amount, email):
  post: (success implies balance_updated AND email_sent) OR
        (failure implies balance_unchanged AND email_NOT_sent)
  inv: "No partial state: operation is all-or-nothing"

Effort estimate: High (4-5 days, requires transaction layer)
Testing: Failure injection testing, data consistency verification
Priority: High (required for data integrity, affects all operations)
```

**Example 3: Missing Rate Limiting**

```
FINDING #11: No rate limiting
Category: Spec Gap
Severity: Medium

Source dialogue:
MISSING SPEC: API abuse prevention

The code does NOT:
- Limit number of requests per user per minute
- Enforce per-IP request rate limits

Should the specification include rate limiting?
  User's answer: (a) Yes, max 10 withdrawals per minute per user.
  Clarification: "Prevent abuse and DoS attacks."

Interpretation:
User requirement for rate limiting is clear but code has no implementation.
This is a behavioral gap requiring new code + spec additions.

Recommended action:

NEW CODE NEEDED:
  Function: enforceRateLimit(user_id, operation_type, max_per_minute)
  Behavior: Track operations per user, reject if limit exceeded

NEW SPEC LINES:
  invariant: "No user may execute withdraw() more than 10 times per
  60-second window"

  pre-condition for withdraw():
  "pre: (num_recent_withdrawals(user_id, last_60_seconds) < 10)
        or reject with RateLimitError"

Effort estimate: Medium (2-3 days)
Testing: Rate limit verification, boundary testing
Priority: Medium (security hardening, post-MVP acceptable)
```

### Spec Gap Classification Decision Tree

```
Does user's answer indicate a missing feature?
  ↓ YES
Is there no existing code implementing this feature?
  ↓ YES
Is it within the product scope (not "out of scope")?
  ↓ YES → Classify as SPEC GAP
```

### Recording a Spec Gap

**Template:**
```
FINDING #{N}: {Title}
Category: Spec Gap
Severity: [Critical | High | Medium | Low]

Source dialogue:
{Reference to MISSING item}

User's answer:
"{Exact quote of user response}"

What's missing:
{What behavior code doesn't currently implement}

User requirement:
{What the user wants to happen}

Recommended action:

NEW CODE NEEDED:
  Location: {Where new code should go}
  Function/Module: {Name of new code}
  Behavior spec: {In plain English, what should it do?}

NEW SPEC LINES:
  Invariant: "{Add this to spec}"
  Pre-condition: "{Add this to operation X}"
  Post-condition: "{Add this to operation X}"

Effort estimate: [Small (< 1 day) | Medium (2-3 days) | Large (> 4 days)]
Testing approach: {How to verify new behavior works}
Priority: [Critical | High | Medium | Low]
Dependencies: [Other changes needed first]

Pseudo-code / pseudoformal spec:
{VDM-SL-like pseudocode showing intended behavior}

Reference: {If this closes a requirements item, link it}
```

---

## Category 3: Spec Refinement

### Definition

**Spec Refinement:** Existing spec is vague; needs tighter conditions or clarification.

Characteristics:
- Code and spec both exist, but spec is incomplete or imprecise
- Conditions like "amount must be reasonable" need bounds
- "Eventually consistent" needs timeout definition
- "Error handling" needs specific error types
- Implicit assumptions need explicit statement

Severity levels:
- **Critical:** Vagueness could cause major misimplementation
- **High:** Ambiguity could lead to bugs
- **Medium:** Clarification would improve confidence
- **Low:** Nice-to-clarify but not blocking

### Examples

**Example 1: Vague Amount Constraint**

```
FINDING #2: Amount constraint too vague
Category: Spec Refinement
Severity: High

Source dialogue:
PROVISIONAL CONFIRMATION

Current spec:
"pre: amount must be positive"

Issue: What's the lower bound? $0.01? $0.00? Can we deposit $0.001?

User's answer:
"The minimum is $0.01 (one cent). We don't process sub-penny amounts."

Interpretation:
Spec says "positive" which technically includes $0.001, but user means
"positive AND >= 0.01". This needs tightening.

Recommended action:

SPEC CHANGE:
  Current: "pre: amount > 0"
  To: "pre: amount >= 0.01 AND amount <= 999999.99"

CLARIFICATION ADDED:
  "Note: Minimum transaction unit is $0.01 (one cent) due to
  payment processor limitations."

Explanation: This prevents subtle bugs where $0.001 deposits were
incorrectly accepted or rejected in different code paths.

Priority: High (affects validation logic and testing)
```

**Example 2: Underspecified Error Recovery**

```
FINDING #6: Error recovery behavior unclear
Category: Spec Refinement
Severity: High

Source dialogue:
QUESTION: Network timeout handling

Current behavior:
When network timeout occurs during deposit confirmation, the code logs
an error and returns "unknown status". The caller doesn't know if money
was credited.

Is this intended?
  User's answer: (c) More nuanced. Here's what should happen:
  "On timeout: Mark transaction as PENDING. Retry asynchronously.
  Notify user: 'Your deposit is being processed—we'll confirm in 5 min.'"

Interpretation:
Code just logs the error. Spec needs to define:
- Transaction state transitions (PENDING, CONFIRMED, FAILED, etc.)
- Retry logic (exponential backoff? how many retries?)
- User notification (what message? when?)
- Timeout threshold (what counts as timeout?)

Recommended action:

SPEC CHANGES:

1. Add state machine for transaction:
   states: INITIATED → PENDING → CONFIRMED | FAILED

2. Tighten error condition:
   "post: If network_timeout during confirmation,
          transaction_state becomes PENDING and
          async_retry_scheduled with max_retries=3"

3. Add user notification spec:
   "post: User notified: 'Processing...will confirm within 5 minutes'"

4. Define timeout: "Timeout = 30 seconds per attempt"

Affected operations: deposit(), withdraw(), refund()
Priority: High (affects user experience and data consistency)
```

**Example 3: Implicit Ordering Constraint**

```
FINDING #9: Transaction ordering assumption implicit
Category: Spec Refinement
Severity: Medium

Source dialogue:
IMPLICIT REQUIREMENT: Transaction ordering

Evidence:
- Tests show: transaction with timestamp t1 always appears before
  transaction with timestamp t2 when t1 < t2
- Comments mention: "Chronological order is assumed by balance calculations"

Is this a real requirement?
  User's answer: (a) Yes, transactions must be processed in timestamp order.
  Clarification: "This ensures balance history is always correct."

Interpretation:
Tests and comments show ordering assumption is real, but spec doesn't
explicitly state it. This must be made explicit to guide implementation.

Recommended action:

SPEC CHANGE:

Add invariant:
  "inv: For all transactions t1, t2 in history:
       timestamp(t1) < timestamp(t2) implies position(t1) < position(t2)
       (Transactions are ordered chronologically)"

Add to deposit/withdraw/refund post-condition:
  "post: New transaction appears at end of chronological transaction_history"

Add constraint:
  "Constraint: If transaction with timestamp=T arrives after
   transaction with timestamp=T+1 has been processed, reject the
   out-of-order transaction with OutOfOrderError"

Priority: Medium (correctness guarantee for balance calculations)
Testing: Out-of-order transaction injection testing
```

### Spec Refinement Classification Decision Tree

```
Does code exist and mostly work?
  ↓ YES
Does the spec seem vague, ambiguous, or underspecified?
  ↓ YES
Could tightening the spec prevent bugs?
  ↓ YES → Classify as SPEC REFINEMENT
```

### Recording a Spec Refinement

**Template:**
```
FINDING #{N}: {Title}
Category: Spec Refinement
Severity: [Critical | High | Medium | Low]

Source dialogue:
{Reference to dialogue item}

User's answer:
"{Exact quote}"

Current spec (vague):
"{Current spec line}"

Issue:
{What's ambiguous or underspecified?}

Refined spec (tightened):
"{New/clearer spec line}"

Explanation:
{Why this tightening matters}

Examples of what changes:
  Before: "amount must be positive"
    Could mean: $0.001, $0.0001, negative numbers depending on interpretation
  After: "amount >= 0.01 AND amount <= 999999.99"
    Clearly: No sub-penny amounts, reasonable upper bound

Priority: [Critical | High | Medium | Low]
Code impact: [None | Update validation | Update comments | Refactor logic]
Testing: {How to verify the refined spec catches the intended constraint}
```

---

## Category 4: Intentional (Confirmed As-Is)

### Definition

**Intentional:** Code matches user intent. Was correct all along—now confirmed.

Characteristics:
- User answers "(a) Yes, this is correct" to a question
- Behavior was questioned but is actually intended
- Was marked [PROVISIONAL] and user confirms it
- Tests were right; spec translation revealed nothing to fix

Severity levels:
- **Confirmed:** Item is correct and can be promoted in spec
- **Noted:** Correct, but worth documenting why it's like this

### Examples

**Example 1: Exception on Insufficient Funds (Intentional)**

```
FINDING #3: Insufficient funds exception (Intentional)
Category: Intentional
Severity: None

Source dialogue:
QUESTION: Insufficient funds behavior

Current behavior:
When balance < amount, the code throws InsufficientFundsException.
The balance is NOT changed.

Is this intended?
  User's answer: (a) Yes, fail with exception if not enough funds.

Interpretation:
User confirms this behavior is intentional. No code fix needed.
Can be promoted to [CONFIRMED] in spec.

Recommended action:

SPEC UPDATE:
  Promote [PROVISIONAL] withdraw() to [CONFIRMED]

  withdraw(amount): real +> AccountState
  [CONFIRMED] {source: Finding #3, confirmed by user}

  pre: amount > 0 AND balance >= amount
  post: balance_after = balance_before - amount

Documentation:
  "Note: Withdraw fails with InsufficientFundsException if balance is
  insufficient. This is intentional—the system does not allow overdrafts."

Priority: None (just confirming)
```

**Example 2: Empty List No-Op (Intentional)**

```
FINDING #7: Empty list handling (Intentional)
Category: Intentional
Severity: None

Source dialogue:
QUESTION: Empty list edge case

Current behavior:
If the input list is empty, the operation skips entirely and returns
the original state unchanged. No error is raised.

Is this intended?
  User's answer: (a) Yes, empty input means no-op.

Interpretation:
User confirms: empty input should do nothing. No change needed.
Promote to [CONFIRMED].

Recommended action:

SPEC UPDATE:
  Promote [PROVISIONAL] processItems() to [CONFIRMED]

  processItems(items: list of Item):
  [CONFIRMED] {source: Finding #7, confirmed by user}

  pre: true  (accepts empty list)
  post: if items is empty then result = input_state else...

Documentation:
  "Empty input is valid and results in no operation. This allows
  graceful handling of 'nothing to do' scenarios."

Priority: None (confirmation only)
```

### Recording an Intentional Finding

**Template:**
```
FINDING #{N}: {Title} (Intentional)
Category: Intentional
Severity: None

Source dialogue:
{Reference to question item}

User's answer:
"{(a) Yes, this is correct"

What was questioned:
{Original ambiguity or concern}

User confirmation:
{User confirmed this behavior is intentional}

Spec promotion:
  FROM: [PROVISIONAL] {item}
  TO: [CONFIRMED] {source: Finding #N, user confirmed}

Documentation:
{Brief explanation of why this design choice makes sense}

Priority: None (confirmation only, no action needed)
```

---

## Category 5: Tech Debt (Deferred/Known Issues)

### Definition

**Tech Debt:** Not intended behavior, but deferring the fix for now. Usually deferred to post-MVP or future sprint.

Characteristics:
- User says "We should fix this later" or "Not for this release"
- Code doesn't match intent, but implementing fix would delay MVP
- Intentional compromise for time/scope
- Must be tracked to avoid forgotten debt

Severity levels:
- **Critical:** Security/data integrity issue; must fix before prod
- **High:** Significant limitation; should fix soon
- **Medium:** Minor limitation; can defer 1-2 sprints
- **Low:** Polish; can defer indefinitely if needed

### Examples

**Example 1: Missing Rate Limiting (Deferred to v2)**

```
FINDING #11: No rate limiting (Tech Debt)
Category: Tech Debt / Spec Gap
Severity: High (impacts security)

Source dialogue:
MISSING SPEC: API abuse prevention

User's answer: (d) Not for MVP. Rate limiting is a v2 feature.
Clarification: "MVP will assume internal users only. Production deploy
needs rate limiting, so we'll add it in v1.1."

Interpretation:
User acknowledges missing feature and its importance, but prioritizes
MVP launch without it. Must be tracked as formal tech debt.

Recommended action:

TECH DEBT ENTRY:
  Title: "Add rate limiting"
  Severity: High (security requirement for production)
  Status: DEFERRED until v1.1
  Target Sprint: {Next sprint with capacity}

  Description:
  Rate limiting is not implemented. MVP assumes internal users only.
  Production deployment REQUIRES rate limiting to prevent DoS attacks.

  Spec to add (in v1.1):
  "invariant: No user may execute withdraw() more than 10 times
   per 60-second window"

  Code to add (in v1.1):
  Rate limiter middleware; per-user request tracking;
  RateLimitError rejection logic

Prerequisite: {Do other items first?}
Estimate: Medium (2-3 days in v1.1)
Blocker for: Production deployment (must fix before shipping v1.0 to prod)

MVP workaround: "Assume authenticated internal users; no untrusted traffic"
Acceptance criteria: {Test cases for when rate limit is implemented}
```

**Example 2: Audit Logging (Deferred to v1.1)**

```
FINDING #4: Audit logging (Tech Debt)
Category: Spec Gap / Deferred
Severity: Medium

Source dialogue:
MISSING SPEC: Audit logging

User's answer: (c) Audit logging is nice-to-have. MVP can use manual logging.
Clarification: "We need it for v1.2 compliance audit, but MVP users
don't need it yet."

Interpretation:
Feature is acknowledged as important, but MVP launches without it.
Formal tracking needed to ensure it doesn't slip.

Recommended action:

TECH DEBT ENTRY:
  Title: "Implement automatic audit logging"
  Severity: Medium (compliance requirement)
  Status: DEFERRED until v1.2
  Target Sprint: {Q3 compliance prep}

  Description:
  Audit logging not implemented in MVP. Manual logging via database
  views is sufficient for v1.0/1.1. Automatic logging required by v1.2
  for compliance audit.

  Spec to add (in v1.2):
  invariant: "All financial operations logged to audit_log with
  timestamp, user_id, amount, result"

  Code to add (in v1.2):
  AuditLog entity and repository; logging calls in each operation

Prerequisite: {Logging infrastructure setup}
Estimate: Medium (3 days)
Blocker for: v1.2 compliance certification

MVP approach: "Manual audit via database queries of transaction table"
v1.2 approach: "Automatic audit_log entry for every operation"

Acceptance criteria: {Audit log query results match operation history}
```

### Tech Debt Classification Decision Tree

```
Does user say "we should fix this, but not now"?
  ↓ YES
Is this a known limitation/mismatch between code and intent?
  ↓ YES → Classify as TECH DEBT

Determine deferral reason:
  - MVP scope → DEFERRED to post-MVP
  - Performance issue → DEFERRED to optimization sprint
  - Architectural limitation → DEFERRED to refactor sprint
```

### Recording Tech Debt

**Template:**
```
FINDING #{N}: {Title}
Category: Tech Debt
Severity: [Critical | High | Medium | Low]
Status: DEFERRED

Source dialogue:
{Reference to item}

User's answer:
"{User says: not for this release, will fix later}"

What's deferred:
{What code doesn't currently do}

Deferral reason:
{Why? MVP scope? Performance? Architecture?}

Target release/sprint:
{When this should be fixed}

Spec to add later:
"{Add this to spec when fixing the debt}"

Code to add later:
"{Implement this behavior in target sprint}"

MVP workaround:
"{How are we handling this in MVP without the fix?}"

Prerequisites:
"{Do these other items first?}"

Estimate: {Effort to fix when deferred}
Blocker for: {What deployment/milestone requires this fix?}

Acceptance criteria (when fixed):
{Test cases and verification approach for when debt is paid}

Tech debt log reference: {Link to debt tracker}
```

---

## Classification Decision Tree (Complete)

Use this flowchart to classify ambiguous Findings:

```
User says "No, that's wrong" (code doesn't match intent)?
  ├─ YES → Is there code that needs fixing?
  │   ├─ YES → BUG (fix code)
  │   └─ NO → SPEC REFINEMENT (clarify spec)
  └─ NO (code is correct)
    └─ YES → INTENTIONAL (confirm as-is)

User says "That feature doesn't exist"?
  ├─ YES → Should we implement it now?
  │   ├─ YES → SPEC GAP (new code + spec)
  │   └─ NO, defer → TECH DEBT (track for later)
  └─ NO

Code is vague/ambiguous but matches intent?
  └─ YES → SPEC REFINEMENT (tighten conditions)
```

---

## Finding Report Template

Use this template to generate the final Findings Report:

```markdown
# Findings Report: {Specification Name}

Generated: {Date}
Dialogue Rounds: {N}
Total Items Reviewed: {N}
Time Investment: {Estimated hours}

---

## Executive Summary

This refinement dialogue resolved {N} items across the specification.
Key findings:

- {N} bugs found and recorded for fixing
- {N} spec gaps identified for new code
- {N} refinements recommended for clarity
- {N} items confirmed as intentional
- {N} tech debt items deferred to post-MVP

Most critical finding: **{Title of highest-severity item}**
Quick wins: {List easy-to-fix items}

---

## Bugs Found ({N} total)

| Severity | Count | Examples |
|----------|-------|----------|
| Critical | {N} | {Bug #, Bug #} |
| High | {N} | {Bug #, Bug #} |
| Medium | {N} | {Bug #, Bug #} |
| Low | {N} | {Bug #, Bug #} |

### Critical Bugs (Must Fix Before MVP)

**Finding {N}: {Title}**
- Impact: {What breaks if not fixed}
- Effort: {How long to fix}
- Recommendation: Fix in next sprint

[... list all critical bugs ...]

### High Priority Bugs

[... list all high-severity bugs ...]

---

## Spec Gaps ({N} total)

| Category | Count | Examples |
|----------|-------|----------|
| Core features | {N} | {Gap #, Gap #} |
| Error handling | {N} | {Gap #, Gap #} |
| Non-functional | {N} | {Gap #, Gap #} |

### Details

**Finding {N}: {Title}**
- Missing behavior: {What's not coded}
- User requirement: {What should happen}
- Effort: {How long to implement}
- Priority: [Critical | High | Medium]

[... list all spec gaps ...]

---

## Spec Refinements ({N} total)

| Type | Count | Examples |
|------|-------|----------|
| Tighten bounds | {N} | {Refinement #, Refinement #} |
| Clarify conditions | {N} | {Refinement #, Refinement #} |
| Document assumptions | {N} | {Refinement #, Refinement #} |

### Details

**Finding {N}: {Title}**
- Current spec: {Vague line}
- Refined spec: {Tightened line}
- Impact: {Why tightening matters}

[... list all refinements ...]

---

## Intentional (Confirmed) ({N} total)

These items were questioned but confirmed as correct:

- Finding {N}: {Title}
- Finding {N}: {Title}
- Finding {N}: {Title}

All promote to [CONFIRMED] in final spec.

---

## Tech Debt ({N} total)

Intentional deferrals to post-MVP:

| Item | Reason | Target Release | Severity |
|------|--------|-----------------|----------|
| Finding {N}: {Title} | MVP scope | v1.1 | High |
| Finding {N}: {Title} | Performance | v1.2 | Medium |

### Details

**Finding {N}: {Title}**
- Deferral reason: {Why not in MVP}
- Target: {When to fix}
- MVP workaround: {How we're handling this for now}
- Blocker for: {What requires this to be fixed}

[... list all tech debt ...]

---

## Recommended Action Plan

### Critical (Start Immediately)
1. {Bug #}: {Title}
2. {Bug #}: {Title}

### High Priority (Next Sprint)
1. {Bug #}: {Title}
2. {Spec Gap #}: {Title}
3. {Refinement #}: {Title}

### Medium Priority (When Capacity)
1. {Bug #}: {Title}
2. {Spec Gap #}: {Title}

### Tech Debt (Post-MVP)
1. {Debt #}: {Title} → v1.1
2. {Debt #}: {Title} → v1.2

---

## Spec Changes Summary

### New Spec Lines Added
- {Invariant / Pre / Post from Gap #}
- {Invariant / Pre / Post from Refinement #}

### Spec Lines Tightened
- From: {Old}
  To: {New}

### Spec Lines Removed/Invalidated
- {Line that was wrong / outdated}

### Items Promoted to [CONFIRMED]
- {N} provisional items now [CONFIRMED]

---

## Files Modified

- `{spec-file}.provisional.vdmsl` → `{spec-file}.vdmsl`
- `findings-{date}.md` (this report)
- `tech-debt-log.md` (new or updated entries)

---

## Next Steps

1. **Code fixes:** Assign bugs to developers
2. **Spec updates:** Integrate refinements into master spec
3. **New development:** Schedule spec gaps
4. **Testing:** Create test cases for each Finding
5. **Tracking:** Log tech debt items in issue tracker
6. **Review:** Formal review of updated spec before coding resumes

---

## Appendix: Raw Dialogue Transcript

{Full Q&A transcript from all dialogue rounds}
```

---

## Summary

Use this guide to:
1. **Classify every Finding** into one of five categories
2. **Record standardized information** using the templates provided
3. **Assess severity** using the severity levels
4. **Recommend actions** with clear next steps
5. **Generate reports** that stakeholders can act on

The best Findings report is one that developers can immediately use to start fixing bugs and implementing spec gaps.
