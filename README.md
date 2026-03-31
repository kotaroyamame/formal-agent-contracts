# Formal Agent Contracts

A formal methods toolkit for multi-agent development. Define inter-agent contracts in VDM-SL and verify them automatically.

マルチエージェント開発における形式手法ツールキット。エージェント間の契約をVDM-SLで定義し、自動検証する。

## Overview / 概要

With Claude's assistance, even developers without formal methods expertise can:

- **Define** agent interfaces rigorously using VDM-SL formal specifications
- **Verify** specification consistency via syntax/type checking and proof obligation generation
- **Prove** proof obligations automatically by converting to SMT-LIB and solving with Z3 (v0.2.0)
- **Generate** TypeScript/Python code scaffolds from VDM-SL specs with runtime contract checks (v0.3.0)
- **Integrate** the full pipeline — define, verify, prove, generate, and test — in a single guided session (v1.0.0)

形式手法の知識がない開発者でも、Claudeの支援により、エージェント間インターフェースの厳密な定義、仕様の自動検証、POのSMT自動証明、仕様からのコード自動生成、そして統合ワークフローによる一気通貫開発が可能です。

## Skills / スキル一覧

### define-contract — Contract Definition / 契約定義

Describe an agent's role and I/O in natural language, and Claude converts it into a VDM-SL formal specification.

自然言語でエージェントの役割・入出力を説明すると、VDM-SLの形式仕様に変換します。

**Triggers**: "define an agent contract", "formalize the interface between agents"

### verify-spec — Specification Verification / 仕様検証

Run VDMJ syntax/type checks and proof obligation generation on a VDM-SL spec file, with results explained in plain language.

VDM-SL仕様ファイルに対してVDMJによる構文チェック・型チェック・PO生成を実行し、結果を平易に解説します。

**Triggers**: "verify the spec", "generate proof obligations"

### smt-verify — SMT Automated Proving / SMT自動証明 *(v0.2.0)*

Convert VDMJ-generated POs to SMT-LIB format and prove them with the Z3 solver. Claude generates SMT-LIB code based on type/expression mapping rules and reports results (proved / counterexample found / unknown).

VDMJが生成したPOをSMT-LIB形式に変換し、Z3ソルバーで自動証明します。

**Triggers**: "verify POs with SMT", "prove with Z3", "find counterexamples"

### generate-code — Code Scaffold Generation / コード生成 *(v0.3.0)*

Generate TypeScript or Python implementation scaffolds from VDM-SL specifications (types, functions, operations). Includes runtime verification of pre-conditions, post-conditions, and invariants to detect contract violations at execution time.

VDM-SL仕様からTypeScript/Pythonの実装スキャフォールドを生成します。事前条件・事後条件・不変条件のランタイム検証コード付き。

**Triggers**: "generate code from the spec", "convert to TypeScript", "generate Python code"

### integrated-workflow — End-to-End Workflow / 統合ワークフロー *(v1.0.0)*

Orchestrates the full formal development pipeline in a single session: Define → Verify → Prove → Generate → Test. Handles phase transitions, error recovery (e.g., returning to definition when verification fails), and generates a comprehensive session report.

定義→検証→証明→生成→テストの全パイプラインを1セッションで実行します。フェーズ間の遷移、エラー回復、セッションレポート生成を自動的に行います。

**Triggers**: "run the full workflow", "end-to-end development", 「統合ワークフローで開発したい」「一気通貫で」

### formal-methods-guide — Formal Methods Guide / 形式手法ガイド

Provides background knowledge on VDM-SL syntax, type system, and the meaning of each PO type.

VDM-SLの文法、型システム、PO種別の意味など、形式手法の背景知識を提供します。

**Triggers**: "explain VDM-SL syntax", "what is a pre-condition"

## Quick Start: Usage Example / 使い方の例

This section walks through a real example — building a task management agent — to show what the plugin does at each step. No formal methods knowledge required.

形式手法の知識がなくても大丈夫です。タスク管理アプリを題材に、プラグインの各ステップで何が起きるかを具体的に示します。

### Step 1: Tell Claude what your agent does / エージェントの役割を伝える

Just describe your agent in plain language. Claude will convert it to a formal spec.

自然言語でエージェントの役割を説明するだけで、Claudeが形式仕様に変換します。

```
You: "タスク管理エージェントを定義して。タスクにはID・タイトル・ステータス（Todo/InProgress/Done）がある。
      Done からは Todo に戻せないようにしたい。"
```

Claude generates a VDM-SL specification like this:

```
Task :: id : nat1  title : seq1 of char  status : Status
inv t == len t.title <= 100;                          -- title must be ≤ 100 chars

ChangeStatus(taskId, newStatus)
  pre  taskId in set dom board and                    -- task must exist
       ValidTransition(board(taskId).status, newStatus) -- transition must be allowed
  post board(taskId).status = newStatus;              -- status is updated
```

**What you get:** `pre` = "this must be true *before* calling", `post` = "this will be true *after* calling", `inv` = "this must *always* be true". These are your agent's contract — the rules it promises to follow.

**得られるもの:** `pre`（事前条件）= 呼び出す前に満たすべき条件、`post`（事後条件）= 呼び出し後に保証される結果、`inv`（不変条件）= 常に成り立つルール。これがエージェントの「契約」です。

### Step 2: Claude verifies the spec / 仕様を自動検証

```
You: "この仕様を検証して"
```

Claude runs VDMJ and reports results in plain language:

```
✅ Syntax check: PASSED
✅ Type check: PASSED
📋 Proof Obligations: 38 generated
   - "If you create a task, the new ID must actually be in the board afterward"
   - "If you delete a task, the board must shrink by exactly 1"
   - "Changing status must not alter the task's title"
```

Proof obligations (POs) are questions the tool automatically asks about your spec: "Can this actually go wrong?" You don't write them — they're generated from your `pre`/`post`/`inv` rules.

PO（証明責務）は、仕様から自動的に導出される「この契約は本当に守れるか？」という検証項目です。自分で書く必要はありません。

### Step 3: Generate working code / 動くコードを生成

```
You: "TypeScriptでコードを生成して"
```

Claude generates TypeScript (or Python) with runtime contract checks baked in:

```typescript
changeStatus(taskId: TaskId, newStatus: Status): void {
  // Pre-conditions (from VDM-SL spec)
  checkPre(this.board.has(taskId),
    `taskId ${taskId} not in dom board`);
  checkPre(validTransition(oldTask.status, newStatus),
    `Invalid transition: ${oldTask.status} → ${newStatus}`);

  // ... operation body ...

  // Post-conditions (from VDM-SL spec)
  checkPost(this.board.get(taskId)!.status === newStatus,
    `status must be ${newStatus}`);
}
```

The generated code **enforces your contracts at runtime**. If any rule is violated, you get a clear `ContractError` instead of a silent bug:

```
[Contract Violation] Pre-condition failed: Invalid transition: Done → InProgress
```

生成されたコードは契約をランタイムで強制します。違反があれば、原因不明のバグではなく明確な `ContractError` が発生します。

### Step 4: Run the full pipeline at once / 一気通貫で実行

For the fastest experience, use the integrated workflow:

```
You: "統合ワークフローでタスク管理エージェントを開発して"
```

Claude runs all phases automatically: Define → Verify → Prove → Generate → Test, with a final session report.

一言で全フェーズを自動実行し、最後にセッションレポートが生成されます。

### Why use this? / なぜ形式手法か

Formal contracts catch bugs that tests miss. Consider:

```
// Without contracts: this silently succeeds — the bug only shows up later
task.status = "Todo";  // Was "Done" — should be forbidden!

// With contracts: immediate, clear error
changeStatus(taskId, "Todo");
// → ContractError: Invalid transition: Done → Todo
```

The spec also serves as **living documentation** — it precisely describes what each agent does, what it expects, and what it guarantees, in a way that never goes out of sync with the code.

契約なしでは、Done→Todoの不正な遷移が静かに成功し、バグは後で発覚します。契約ありでは即座に明確なエラーが出ます。仕様はそのまま「生きたドキュメント」にもなります。

A complete working example is available in [`examples/task-manager/`](examples/task-manager/).

完全な動作例は [`examples/task-manager/`](examples/task-manager/) にあります。

## Setup / セットアップ

### VDMJ (Required / 必須)

VDMJ is required for specification verification. Install via one of:

1. Download from [GitHub Releases](https://github.com/nickbattle/vdmj/releases)
2. Build from source: `git clone https://github.com/nickbattle/vdmj.git && cd vdmj && mvn install`

Place the JAR file at `~/.vdmj/vdmj.jar` or clone into the `vdmj/` directory of your workspace.

### Z3 (Required for SMT verification / SMT検証に必要)

```bash
pip install z3-solver
```

Or download binaries from https://github.com/Z3Prover/z3/releases

### Requirements / 動作環境

- Java 11+ (for VDMJ)
- Python 3.8+ (for Z3 via pip)

## Roadmap / 開発ロードマップ

- [x] v0.1.0 — Contract templates, syntax/type checking, PO generation with natural language explanation
- [x] v0.2.0 — SMT-LIB auto-conversion and Z3 automated proving (VDM-SMT Bridge Phase 1)
- [x] v0.3.0 — Code scaffold generation from specs (TypeScript/Python with runtime contract checks)
- [x] v1.0.0 — Integrated workflow (define → verify → prove → generate → test, end-to-end)

## Author / 作者

IID Systems (https://iid.systems)

## License / ライセンス

MIT
