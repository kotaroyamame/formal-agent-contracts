# Workflow Phase Details — Decision Criteria & Error Recovery

## Phase Transition Decision Matrix

Each phase transition has explicit criteria. Claude evaluates these before proceeding.

### Phase 1 → Phase 2 (Define → Verify)

| Criterion | Required | Check |
|-----------|----------|-------|
| `.vdmsl` file exists on disk | ✅ Yes | File path is valid and readable |
| Module structure is complete | ✅ Yes | Has `module ... end` wrapper |
| At least one type defined | ✅ Yes | `types` section is non-empty |
| User confirmed spec | ✅ Yes | Explicit "OK" or equivalent |

**If NOT met**: Stay in Phase 1, explain what's missing.

### Phase 2 → Phase 3 (Verify → Prove)

| Criterion | Required | Check |
|-----------|----------|-------|
| Syntax check passed | ✅ Yes | VDMJ reports no syntax errors |
| Type check passed | ✅ Yes | VDMJ reports no type errors |
| POs generated | ✅ Yes | At least 0 POs (0 is valid) |
| Z3 available | ⚠️ Conditional | Only if `smt_enabled: true` |

**If syntax/type errors**: Return to Phase 1 with specific error locations and fix suggestions.
**If Z3 not available**: Skip Phase 3 automatically → Phase 4.

### Phase 2 → Phase 4 (Verify → Generate, skipping Prove)

| Criterion | Required | Check |
|-----------|----------|-------|
| Syntax check passed | ✅ Yes | No errors |
| Type check passed | ✅ Yes | No errors |
| User chose to skip SMT | ✅ Yes | `smt_enabled: false` or explicit skip |

### Phase 3 → Phase 4 (Prove → Generate)

| Criterion | Required | Check |
|-----------|----------|-------|
| All POs processed | ✅ Yes | Each PO has a result |
| No critical counterexamples | ⚠️ Warning | If sat found, warn but allow proceed |

**If counterexample found**:
1. Explain the violation in natural language
2. Show which pre/post/inv condition failed
3. Ask: "Proceed to code generation anyway, or fix the specification first?"
4. If fix → return to Phase 1 with the PO context

### Phase 4 → Phase 5 (Generate → Test)

| Criterion | Required | Check |
|-----------|----------|-------|
| Code files generated | ✅ Yes | At least types + one operation file |
| Code parses without errors | ✅ Yes | No syntax errors in generated code |
| Target runtime available | ⚠️ Conditional | Node.js for TS, Python 3 for Python |

## Error Recovery Patterns

### Pattern 1: Specification Error Loop

```
Phase 1 (Define) → Phase 2 (Verify) → ERROR → Phase 1 (Fix) → Phase 2 (Re-verify)
```

When VDMJ reports errors in Phase 2:
1. Parse the error message for file:line:column
2. Show the problematic line from the `.vdmsl` file
3. Suggest a specific fix based on error type:
   - **Type mismatch**: Show expected vs actual types
   - **Undefined identifier**: List available identifiers in scope
   - **Syntax error**: Show correct VDM-SL syntax pattern
4. Apply the fix (with user confirmation)
5. Re-run Phase 2

**Max retries**: 3 automatic attempts. After 3, present all remaining errors and ask user for guidance.

### Pattern 2: Counterexample Resolution

```
Phase 3 (Prove) → COUNTEREXAMPLE → Phase 1 (Strengthen spec) → Phase 2 → Phase 3
```

When Z3 returns `sat` (counterexample found):
1. Extract the counterexample values from Z3 output
2. Explain what the values represent in the domain
3. Identify which constraint is too weak or missing
4. Suggest strengthening:
   - Add/tighten invariant
   - Add/tighten pre-condition
   - Restrict type (e.g., `nat1` instead of `nat`)

### Pattern 3: Code Generation Fallback

```
Phase 4 (Generate) → UNSUPPORTED PATTERN → Generate stub + TODO
```

When the VDM-SL spec contains patterns that don't map cleanly:
1. **Implicit functions/operations**: Generate stub with `// TODO: implement` and the original VDM-SL as comment
2. **Complex quantifiers in invariants**: Generate a simplified runtime check with a `// SIMPLIFIED` warning
3. **Recursive types**: Generate the type but add a depth guard in contract checks
4. **Higher-order functions**: Generate a function type alias with manual implementation note

### Pattern 4: Test Failure Diagnosis

```
Phase 5 (Test) → FAILURE → Diagnose → Fix generated code → Re-test
```

Common test failure causes and fixes:
1. **Contract violation on valid input**: Invariant or pre-condition too strict → review Phase 1 spec
2. **No violation on invalid input**: Contract check missing or condition too weak → review Phase 4 generation
3. **Runtime error (not contract)**: Type mapping issue → check type conversion rules
4. **Import/module error**: Missing export or incorrect path → fix module structure

## Phase-Specific Context Propagation

Information flows between phases. Track these across the session:

### From Phase 1 (Define)
- `spec_file_path`: Path to generated `.vdmsl` file
- `module_name`: VDM-SL module name
- `type_names`: List of defined type names
- `function_names`: List of defined function names
- `operation_names`: List of defined operation names
- `state_name`: Name of state definition (if any)

### From Phase 2 (Verify)
- `po_count`: Number of POs generated
- `po_list`: List of POs with their types and expressions
- `critical_pos`: POs that are most important to verify
- `verification_status`: passed | failed

### From Phase 3 (Prove)
- `proven_count`: Number of POs proved (unsat)
- `counterexample_count`: Number with counterexamples (sat)
- `unknown_count`: Number undetermined
- `counterexample_details`: Specific values for each sat result

### From Phase 4 (Generate)
- `generated_files`: List of generated file paths
- `target_language`: ts | py | both
- `contract_count`: Number of runtime contract checks
- `todo_stubs`: Number of TODO stubs (implicit definitions)

### From Phase 5 (Test)
- `test_count`: Total tests generated
- `pass_count`: Tests passed
- `fail_count`: Tests failed
- `failure_details`: Details of each failure

## Partial Workflow Entry Points

### Entry at Phase 2 (Existing `.vdmsl` file)

User says: "Verify this VDM-SL file" or provides a `.vdmsl` path.

1. Read the file and extract module structure
2. Populate Phase 1 context (type_names, function_names, etc.) from the file
3. Proceed with Phase 2

### Entry at Phase 4 (Code generation only)

User says: "Generate code from this spec" with verified spec.

1. Read the `.vdmsl` file
2. Skip Phase 2/3 (assume already verified)
3. Proceed with Phase 4

### Entry at Phase 5 (Test only)

User says: "Test the generated code"

1. Locate generated code files
2. Generate and run smoke tests
3. Report results
