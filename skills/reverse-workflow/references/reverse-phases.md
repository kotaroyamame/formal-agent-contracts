# Reverse Workflow Phase Details — Decision Criteria & Error Recovery
リバースワークフロー フェーズの詳細 — 判定基準とエラー回復

## Phase Transition Decision Matrix

Each phase transition has explicit criteria. Claude evaluates these before proceeding.
各フェーズ遷移には明確な基準がある。Claudeはこれらを評価してから次に進む。

### Phase 1 → Phase 2 (Extract → Refine)

| Criterion | Required | Check |
|-----------|----------|-------|
| `.provisional.vdmsl` file exists | ✅ Yes | File path is valid and readable |
| At least one type extracted | ✅ Yes | `types` section is non-empty |
| Extraction report generated | ✅ Yes | Report covers extracted items and questions |
| User acknowledges provisional nature | ✅ Yes | Explicit acknowledgment that spec is provisional |
| Questions list prepared | ✅ Yes | At least one question for the user |

**If NOT met**: Stay in Phase 1, explain what's missing.
**条件未達の場合**: Phase 1に留まり、不足要素を説明する。

### Phase 2 → Phase 3 (Refine → Reconcile)

| Criterion | Required | Check |
|-----------|----------|-------|
| All `[PROVISIONAL]` items classified | ✅ Yes | Each item is Confirmed/Modified/Removed/Unresolved |
| Findings Report generated | ✅ Yes | Bugs, gaps, refinements, intentional, debt categorized |
| Confirmed `.vdmsl` generated | ✅ Yes | No `[PROVISIONAL]` tags in output spec |
| User approves confirmed spec | ✅ Yes | Explicit approval or equivalent |

**If NOT met**: Stay in Phase 2, explain what remains to be clarified.
**条件未達の場合**: Phase 2に留まり、未解決項目を説明する。

### Phase 2 Loop Criteria (Refine ↔ Refine)

Phase 2 may loop multiple times until convergence:

| Condition | Action |
|-----------|--------|
| User wants "another round" | Re-run refine cycle |
| New questions surfaced | Document and address in next round |
| `[UNRESOLVED]` items remain | Continue with rest, mark for manual review |
| User unsure about conclusion | Loop again to clarify |
| Convergence reached | All items confidently classified, user approves → Phase 3 |

**Convergence definition**: All `[PROVISIONAL]` items have user-confirmed status, and no new
questions emerge from the previous round.

**収束の定義**: 全ての `[PROVISIONAL]` 項目がユーザー確認済みの状態で、
前のラウンドから新しい質問が出ていない。

### Phase 3 → Phase 4 (Reconcile → Verify)

| Criterion | Required | Check |
|-----------|----------|-------|
| Diff report generated | ✅ Yes | Code vs. spec discrepancies identified |
| Code fixes generated | ✅ Yes | At least identified; may be auto-generated or marked for manual fix |
| Auto-generated tests created | ✅ Yes | Tests based on confirmed spec |
| User reviews fixes | ✅ Yes | User has seen and approved fixes or identified for manual application |
| Forward pipeline entry chosen | ⚠️ Conditional | Only if `forward_pipeline: true` in Phase 0 |

**If NOT met**: Stay in Phase 3, clarify remaining fixes.
**条件未達の場合**: Phase 3に留まり、未解決の修正を説明する。

**If forward_pipeline: false**: Skip to Session Report.
**forward_pipeline: false の場合**: セッションレポートへスキップ。

### Phase 3 → Phase 4 (Reconcile → Verify, skipping Phase 4)

**Skip condition**: User says "stop here" or forward pipeline not enabled.
If skipped, proceed directly to Session Report.

### Phase 4 → Phase 5 (Verify → Prove)

| Criterion | Required | Check |
|-----------|----------|-------|
| Syntax check passed | ✅ Yes | VDMJ reports no syntax errors |
| Type check passed | ✅ Yes | VDMJ reports no type errors |
| POs generated | ✅ Yes | At least 0 POs (0 is valid) |
| Z3 available | ⚠️ Conditional | Only if `smt_enabled: true` |

**If syntax/type errors**: Return to Phase 2 with specific error locations and fix suggestions.
**構文/型エラーの場合**: 具体的なエラー箇所と修正案とともにPhase 2に戻る。

**If Z3 not available**: Skip Phase 5 automatically → Phase 6 or Session Report.
**Z3未インストールの場合**: Phase 5を自動スキップ → Phase 6 or Session Report へ。

### Phase 4 → Phase 6 (Verify → Generate, skipping Prove)

| Criterion | Required | Check |
|-----------|----------|-------|
| Syntax check passed | ✅ Yes | No errors |
| Type check passed | ✅ Yes | No errors |
| User chose to skip SMT | ✅ Yes | `smt_enabled: false` or explicit skip |

### Phase 5 → Phase 6 (Prove → Generate)

| Criterion | Required | Check |
|-----------|----------|-------|
| All POs processed | ✅ Yes | Each PO has a result |
| No critical counterexamples | ⚠️ Warning | If sat found, warn but allow proceed |

**If counterexample found**:
1. Explain the violation in natural language
2. Show which pre/post/invariant condition failed
3. Ask: "Proceed to code generation anyway, or return to Phase 2 to fix the spec?"
4. If fix → return to Phase 2 with the PO context

### Phase 5 → Session Report (Prove → Report, skipping Generate)

**Skip condition**: User says "stop here" or code generation not enabled.

## Error Recovery Patterns
## エラー回復パターン

### Pattern 1: Unparseable Source Code
ソースコード解析不可 — Phase 1でコードが解析できない場合

```
Phase 1 (Extract) → ERROR (unparseable code) → Ask scope narrowing → Phase 1 retry
```

When extract-spec reports that code cannot be parsed:
1. Ask user to narrow scope to a single function, class, or file
2. Start with simpler, well-structured code
3. Retry Phase 1 with narrowed scope

**Max attempts**: 2 attempts with different scopes. If still unparseable, offer to switch
to define-contract skill instead (start from scratch).

**最大リトライ**: 異なるスコープで2回試行。それでも解析不可の場合、
define-contractスキルに切り替えることを提案（ゼロから開始）。

### Pattern 2: Ambiguity Loop in Refinement
精密化の曖昧性ループ — Phase 2でユーザーが確信を持てない場合

```
Phase 2 (Refine) → UNCLEAR → Mark [UNRESOLVED] → Continue with rest → Phase 3
```

When user is very unsure about an extracted item:
1. Present the evidence (code excerpt, tests, comments)
2. Offer multiple interpretations with pros/cons
3. If still unclear: Mark as `[UNRESOLVED]` and continue
4. Proceed to Phase 3 with remaining confirmed items
5. Revisit `[UNRESOLVED]` items later if time permits

**Never force a decision** — it's better to proceed with partial confidence than to block.

**決定を強制しない** — 部分的な信頼度で進めることは、ブロックするより良い。

### Pattern 3: Code-Spec Mismatch in Reconciliation
コード-仕様の不一致 — Phase 3でコードが仕様と一致しない場合

```
Phase 3 (Reconcile) → MISMATCH → Identify fixes → Generate tests → User review
```

When reconcile-code finds significant mismatches:
1. Categorize by severity:
   - **Critical**: Missing pre/post/invariant checks (code may have bugs)
   - **Important**: Logic doesn't match spec intent
   - **Minor**: Style/naming differences
2. For each category, generate targeted fixes
3. Create tests that would fail without the fixes
4. Present fixes to user for review

**User decision**: Accept fixes, request manual review, or mark for future.

### Pattern 4: Specification Error Loop During Forward Pipeline
前方フェーズにおける仕様エラーループ — Phase 4でVDMJがエラーを報告した場合

```
Phase 4 (Verify) → ERROR → Return to Phase 2 (Fix spec) → Phase 4 (Re-verify)
```

When VDMJ reports errors in Phase 4 (during forward pipeline):
1. Parse the error message for file:line:column
2. Show the problematic line from the `.vdmsl` file
3. Suggest a specific fix based on error type (same as integrated-workflow)
4. Apply the fix (with user confirmation)
5. Re-run Phase 4

**Max retries**: 3 automatic attempts. After 3, present all remaining errors and ask user for guidance.

**最大リトライ**: 自動3回。3回後は全エラーを提示しユーザーに判断を委ねる。

### Pattern 5: Counterexample Resolution During Forward Pipeline
前方フェーズにおける反例の解決 — Phase 5でZ3が反例を検出した場合

```
Phase 5 (Prove) → COUNTEREXAMPLE → Return to Phase 2 (Strengthen spec)
→ Phase 4 → Phase 5
```

When Z3 returns `sat` (counterexample found) in Phase 5:
1. Extract the counterexample values from Z3 output
2. Explain what the values represent in the domain
3. Identify which constraint is too weak or missing
4. Suggest strengthening (add/tighten invariant, pre-condition, or restrict type)
5. Return to Phase 2 to refine the specification
6. Re-run Phase 4 (Verify) and Phase 5 (Prove)

### Pattern 6: Code Generation Fallback
コード生成のフォールバック — Phase 6でVDM-SLパターンが変換不可の場合

```
Phase 6 (Generate) → UNSUPPORTED PATTERN → Generate stub + TODO
```

When generate-code encounters patterns that don't map cleanly:
1. **Implicit functions/operations**: Generate stub with `// TODO: implement` and the original VDM-SL as comment
2. **Complex quantifiers in invariants**: Generate a simplified runtime check with a `// SIMPLIFIED` warning
3. **Recursive types**: Generate the type but add a depth guard in contract checks
4. **Higher-order functions**: Generate a function type alias with manual implementation note

Same pattern as integrated-workflow; see `skills/integrated-workflow/references/workflow-phases.md`.

### Pattern 7: Test Failure Diagnosis
テスト失敗の診断 — Phase 6でスモークテストが失敗した場合

```
Phase 6 (Generate) → FAILURE → Diagnose → Fix generated code → Re-test
```

Common test failure causes and fixes (same as integrated-workflow):
1. **Contract violation on valid input**: Invariant or pre-condition too strict → review Phase 2 spec
2. **No violation on invalid input**: Contract check missing or condition too weak → review Phase 6 generation
3. **Runtime error (not contract)**: Type mapping issue → check type conversion rules
4. **Import/module error**: Missing export or incorrect path → fix module structure

## Phase-Specific Context Propagation

Information flows between phases. Track these across the session:
フェーズ間で情報が伝播する。セッション全体で以下を追跡する。

### From Phase 1 (Extract)
- `source_files`: Source code files analyzed
- `source_lang`: Detected or specified source language
- `provisional_spec_path`: Path to `.provisional.vdmsl`
- `extraction_report`: Summary of extracted items
- `questions_list`: Questions to address in Phase 2
- `type_names`: List of extracted type names
- `operation_names`: List of extracted operation names
- `state_name`: State definition name (if any)

### From Phase 2 (Refine)
- `confirmed_spec_path`: Path to confirmed `.vdmsl`
- `findings_report`: Bugs, gaps, refinements, intentional, debt categorized
- `bugs_found`: List of bugs discovered in code
- `gaps_found`: List of spec gaps
- `refinements`: Conditions tightened or added
- `convergence_rounds`: Number of refinement loops executed
- `unresolved_items`: Items marked `[UNRESOLVED]` with explanations

### From Phase 3 (Reconcile)
- `diff_report`: Discrepancies between code and spec
- `fixes_generated`: List of code fixes
- `test_count`: Auto-generated tests
- `tests_passing`: Boolean (if tests run)
- `failure_details`: Details of any test failures

### From Phase 4 (Verify)
- `po_count`: Number of POs generated
- `po_list`: List of POs with their types and expressions
- `critical_pos`: POs that are most important to verify
- `verification_status`: passed | failed

### From Phase 5 (Prove)
- `proven_count`: Number of POs proved (unsat)
- `counterexample_count`: Number with counterexamples (sat)
- `unknown_count`: Number undetermined
- `counterexample_details`: Specific values for each sat result

### From Phase 6 (Generate)
- `generated_files`: List of generated file paths
- `target_language`: ts | py | both
- `contract_count`: Number of runtime contract checks
- `todo_stubs`: Number of TODO stubs
- `test_count_gen`: Tests generated by code generation
- `pass_count`: Tests passed
- `fail_count`: Tests failed

## Partial Workflow Entry Points
ユーザーは任意のフェーズからワークフローに参加できる。

### Entry at Phase 2 (Existing `.provisional.vdmsl` file)

User provides: "Refine this provisional spec" or provides a `.provisional.vdmsl` path.

1. Read the file and extract questions/provisional items
2. Proceed with Phase 2 (Refine)

### Entry at Phase 3 (Existing `.vdmsl` confirmed spec)

User provides: "Reconcile this code with this spec"

1. Read the `.vdmsl` file
2. Populate Phase 1/2 context from the file
3. Proceed with Phase 3 (Reconcile)

### Entry at Phase 4 (Forward pipeline only)

User provides: "Verify and prove this spec"

1. Read the `.vdmsl` file (assume already refined from code)
2. Skip Phase 1/2/3 (assume reconciliation done separately)
3. Proceed with Phase 4 (Verify)

### Entry at Phase 6 (Code generation only)

User says: "Generate code from this verified spec"

1. Read the `.vdmsl` file (assume already verified)
2. Skip Phase 1–5
3. Proceed with Phase 6

## Workflow Shortcuts & Skips

### Skip entire forward pipeline

**User says**: "Stop here" or "Just reconcile the code, don't verify/prove"

**Action**:
1. Skip phases 4–6
2. Generate Session Report covering phases 1–3 only
3. Include reconciliation fixes and recommendations for forward pipeline

### Skip to code generation (no proving)

**User says**: "Verify the spec but skip SMT proving" or "Generate code without proving"

**Action**:
1. Execute phases 1–3 (Extract, Refine, Reconcile)
2. Execute Phase 4 (Verify) only, skip Phase 5 (Prove)
3. Execute Phase 6 (Generate) if enabled
4. Generate Session Report

### Abort and switch to define-contract

**When to offer**:
- Phase 1: Code is too complex or unparseable after 2 attempts
- Phase 2: Extracted spec is fundamentally wrong or conflicting with user's mental model

**Action**:
1. Acknowledge that reverse engineering this code is challenging
2. Offer to start fresh with define-contract skill (forward workflow)
3. Generate partial session report with what was learned

## Error Handling Principles

### Never force a decision
- Mark items `[UNRESOLVED]` rather than guessing
- Proceed with partial confidence
- Revisit later if time permits

### Always show evidence
- When presenting extracted items, show code excerpts
- When identifying bugs, show the code pattern that indicates the bug
- When suggesting refinements, show the conflicting evidence

### Prefer user's mental model over code
- Code can have bugs; user's mental model is the true spec
- If user says "that's not what this is supposed to do", believe them
- Treat code bugs as findings in Phase 2, not as ground truth

### Maintain transparency about confidence
- Mark high/medium/low confidence on each finding
- Explain why certain items are low confidence
- Let user decide what to do with low-confidence findings
