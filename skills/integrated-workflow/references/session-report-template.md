# Session Report Template

Use this template to generate the final report after workflow completion (or partial completion).

## Template

```markdown
# Formal Agent Development — Session Report

| Item | Value |
|------|-------|
| Agent | {agent_name} |
| Date | {date} |
| Specification | {spec_file_path} |
| Target Language | {target_language} |

## Phase Summary

| Phase | Status | Details |
|-------|--------|---------|
| 1. Define | {status_emoji} {status} | {type_count} types, {func_count} functions, {op_count} operations |
| 2. Verify | {status_emoji} {status} | Syntax {syntax}, Type {type}, {po_count} POs |
| 3. Prove | {status_emoji} {status} | {proven}/{total} proved, {counter} counterexamples |
| 4. Generate | {status_emoji} {status} | {file_count} files, {contract_count} runtime contracts |
| 5. Test | {status_emoji} {status} | {pass_count}/{test_count} tests passed |

## Specification Overview

### Types
{for each type}
- **{type_name}**: {brief_description}
{end for}

### Functions
{for each function}
- **{func_name}**: {signature} — {brief_description}
{end for}

### Operations
{for each operation}
- **{op_name}**: {signature} — {brief_description}
{end for}

## Verification Results

### Proof Obligations
{for each PO}
| # | Type | Expression | Result |
|---|------|-----------|--------|
| {po_num} | {po_type} | {po_expr_short} | {proved/counterexample/unknown/skipped} |
{end for}

{if counterexamples}
### Counterexamples Found

**PO {po_num}** ({po_type}):
- Violation: {natural_language_explanation}
- Values: {counterexample_values}
- Recommendation: {fix_suggestion}
{end if}

## Generated Code

### File Structure
```
{output_directory}/
├── {file_1}    # {description}
├── {file_2}    # {description}
└── {file_n}    # {description}
```

### Runtime Contracts
- Pre-conditions: {pre_count}
- Post-conditions: {post_count}
- Invariants: {inv_count}
- Contract toggle: `VDM_CONTRACT_CHECK=off` to disable

{if todo_stubs > 0}
### TODO Stubs ({todo_count})
The following items require manual implementation:
{for each stub}
- `{function_name}` in `{file}`: {reason}
{end for}
{end if}

## Test Results

{test_count} tests executed: {pass_count} passed, {fail_count} failed

{if failures}
### Failed Tests
{for each failure}
- **{test_name}**: {failure_reason}
{end for}
{end if}

## Next Steps

{context-dependent recommendations, e.g.:}
- [ ] Implement TODO stubs in generated code
- [ ] Add domain-specific test cases beyond smoke tests
- [ ] Resolve counterexamples by strengthening specification
- [ ] Integrate generated module into your application
- [ ] Define contracts for interacting agents
```

## Status Emoji Reference

| Status | Emoji | Meaning |
|--------|-------|---------|
| Completed successfully | ✅ | Phase passed all criteria |
| Completed with warnings | ⚠️ | Phase completed but issues noted |
| Failed | ❌ | Phase did not pass criteria |
| Skipped | ⏭ | Phase intentionally skipped |
| Not reached | ⬜ | Workflow ended before this phase |

## Report Generation Rules

1. **Always generate a report** — even if workflow was interrupted or partially completed
2. **Use actual data** — never use placeholder values; omit sections if data is unavailable
3. **Be specific** — include file paths, actual counts, actual PO expressions
4. **Actionable next steps** — tailor recommendations to the actual session results
5. **Bilingual support** — generate in the language the user has been using (Japanese or English)
