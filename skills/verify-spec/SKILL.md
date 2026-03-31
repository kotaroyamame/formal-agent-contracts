---
name: verify-spec
description: >
  Verify VDM-SL specification files. Triggered by requests like "verify the spec",
  "check the VDM file", "type check", "generate proof obligations", "check for errors",
  or "verify the .vdmsl file".
  Also responds to Japanese: 「仕様を検証して」「型チェックして」「PO生成して」等。
  Runs VDMJ syntax/type checks and PO generation, then explains results in plain language
  accessible to developers without formal methods expertise.
metadata:
  version: "0.1.0"
---

# VDM-SL Specification Verification

Verify VDM-SL specification files using the VDMJ toolchain and explain results in plain language.

VDMJツールチェーンを使ってVDM-SL仕様ファイルを検証し、結果をわかりやすく解説する。

## Prerequisites

VDMJ JAR file is required. Search in this priority order:

1. `vdmj/vdmj/target/vdmj-*.jar` in the workspace
2. `~/.vdmj/vdmj.jar`
3. If not found, guide the user on how to obtain it

VDMJのJARファイルが必要。上記の優先順で探索する。

## Verification Steps

### Step 1: Locate VDM-SL Files

Identify the file specified by the user, or find all `.vdmsl` files in the workspace.
Pass all files to VDMJ together (to resolve inter-module dependencies).

ユーザー指定のファイル、またはワークスペース内の `.vdmsl` ファイルを特定する。

```bash
# File discovery
find . -name "*.vdmsl" -type f
```

### Step 2: Syntax Check + Type Check

```bash
java -jar <VDMJ_JAR> -vdmsl <files...> 2>&1
```

Parse the output and report:
- Syntax errors → explain the file name, line number, and error in plain language
- Type errors → explain what caused the type mismatch in simple terms
- Warnings → unused definitions, etc.

If errors are found, suggest fixes and do NOT proceed to Step 3.

出力を解析し、構文エラー・型エラー・警告を平易に報告する。
エラーがある場合は修正を提案し、Step 3には進まない。

### Step 3: PO Generation

Once type checking passes, generate proof obligations (POs):

型チェック通過後、証明責務（PO）を生成する:

```bash
java -jar <VDMJ_JAR> -vdmsl <files...> -p 2>&1
```

### Step 4: PO Result Explanation

Explain each generated PO in the following format:

**PO #N: [PO Type]** ([Definition Name])
- **Location**: filename:line
- **What it checks**: Plain language explanation for developers
- **PO expression**: The VDM-SL expression
- **Assessment**: Trivial / Needs review / Attention required

各POについて場所・何を確認しているか・PO式・判定の見通しを解説する。

#### Assessment Criteria

- **Trivial** (自明): Directly derivable from pre-conditions or obvious from definitions
- **Needs review** (要検討): Logically likely correct but complex condition combinations
- **Attention required** (要注意): Invariant maintenance is delicate or counterexamples may exist

### Step 5: Present Summary

Present a summary of all PO results:

全PO結果のサマリーを提示する:

```
## Verification Summary / 検証サマリー

- Syntax check: OK / NG
- Type check: OK / NG (error count)
- Proof obligations: N generated
  - Trivial: X
  - Needs review: Y
  - Attention required: Z
```

If any POs are marked "Attention required", propose specific spec modifications.

「要注意」のPOがある場合は仕様の修正案を具体的に提案する。

## PO Type Reference

| English | Japanese | Description |
|---------|----------|-------------|
| subtype obligation | 部分型義務 | Whether a value conforms to type constraints |
| invariant satisfiability | 不変条件充足 | Whether a value satisfying the constraint can exist |
| map apply obligation | 写像適用義務 | Whether a key exists in the map |
| total function obligation | 全域関数義務 | Whether condition expressions evaluate correctly |
| func post condition | 関数事後条件 | Whether the function satisfies its post-condition |
| operation postcondition | 操作事後条件 | Whether the operation satisfies its post-condition |
| state invariant | 状態不変条件 | Whether state consistency is maintained after an operation |
| map compatible | 写像互換性 | Whether keys don't conflict when merging maps |
| state init | 状態初期化 | Whether the initial state satisfies the invariant |

For details, see the formal-methods-guide skill's `references/po-types-detail.md`.

## Error Handling Patterns

### Syntax Errors
- `Expected ...` → show the expected token and present correct VDM-SL syntax
- Common mistakes: confusing `==` with `=`, semicolon placement, missing `end`

### Type Errors
- `Name '...' is not in scope` → missing module import or variable scope issue
- `Type mismatch` → contrast expected type vs actual type

### PO-Related Issues
- Too many POs generated → type constraints may be overly complex
- Suspicious invariant satisfiability → check if the invariant is contradictory

構文エラー・型エラー・PO関連の問題への対処パターン。

## Handoff to SMT Verification

After PO generation, if the user wants proofs, hand off to the **smt-verify** skill.
After presenting the summary, guide:

> To automatically prove POs, say "verify POs with SMT" or 「POをSMTで検証して」.
> The Z3 solver can automatically check each PO's correctness.

## Important Notes

- VDMJ output is in English — always translate and explain in the user's language
- Minimize formal methods jargon; use intuitive expressions developers can understand
- Don't just show PO expressions — always add a plain language explanation of "what it checks"
- Include concrete code in fix proposals

- VDMJの出力は英語のため、ユーザーの言語に翻訳して説明する
- 形式手法の専門用語は最小限にし、開発者が直感的に理解できる表現を使う
- PO式だけでなく「何を確認しているか」を必ず自然言語で添える
- 修正提案は具体的なコードを添えて行う
