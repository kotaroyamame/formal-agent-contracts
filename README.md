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
- **Extract** provisional specs from existing code and **refine** them through dialogue to uncover the true specification (v1.1.0–v1.4.0) 🆕

形式手法の知識がない開発者でも、Claudeの支援により、エージェント間インターフェースの厳密な定義、仕様の自動検証、POのSMT自動証明、仕様からのコード自動生成、統合ワークフローによる一気通貫開発、さらに既存コードからの仕様あぶり出しと対話的な真の仕様の発見が可能です。

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

### extract-spec — Provisional Spec Extraction / 仮仕様抽出 *(v1.1.0)* 🆕

Read existing source code and extract a **provisional** VDM-SL specification. The extracted spec reflects what the code *currently does*, not what it *should do*. Every item is tagged `[PROVISIONAL]` and framed as a question for user dialogue.

既存のソースコードを読み取り、**仮の** VDM-SL仕様を抽出します。抽出された仕様はコードの「現在の動作」を反映しており、「あるべき動作」ではありません。全項目に `[PROVISIONAL]` タグが付き、ユーザーとの対話のための問いとして提示されます。

**Triggers**: "extract spec from code", "reverse engineer the specification", 「既存のコードから仕様を抽出して」

### refine-spec — Dialogue-Driven Spec Refinement / 対話的仕様あぶり出し *(v1.2.0)* 🆕

The core of the reverse workflow. Takes a provisional spec as a scaffold and conducts structured dialogue with the user to uncover the **true specification** in their mind. Differences between code behavior and user intent are recorded as Findings (Bug / Spec Gap / Intentional / Debt).

リバースワークフローの核心。仮仕様を叩き台として、ユーザーとの構造化された対話を通じて**真の仕様**をあぶり出します。コードの振る舞いとユーザーの意図の食い違いを「発見事項（Finding）」として記録します。

**Triggers**: "refine the spec", "review the provisional spec", 「仕様を磨きたい」「コードの意図を確認したい」

### reconcile-code — Code Reconciliation / コード照合・修正 *(v1.3.0)* 🆕

Compare the confirmed (true) spec against existing code item-by-item. Generate a diff report, produce prioritized code fixes, and auto-generate tests for every spec condition.

確定仕様と既存コードを項目ごとに照合します。差分レポートを生成し、優先度付きのコード修正案を提示し、仕様の各条件に対応するテストを自動生成します。

**Triggers**: "reconcile code with spec", "fix code to match spec", 「仕様とコードを照合して」「コードを直して」

### reverse-workflow — Reverse Engineering Workflow / リバースワークフロー *(v1.4.0)* 🆕

Orchestrates the full reverse pipeline: **Extract → Refine → Reconcile**, then optionally connects to the existing forward pipeline (Verify → Prove → Generate). The counterpart to `integrated-workflow` for existing codebases.

リバースパイプライン全体を統合実行: **抽出→磨き上げ→照合**。完了後、既存のフォワードパイプライン（検証→証明→生成）に接続可能。既存コードベース版の `integrated-workflow` です。

**Triggers**: "reverse workflow", "extract and refine spec from code", 「リバースワークフローで」「コードの仕様を明確にしたい」

## Installation / インストール

Add the marketplace and the plugin will be available:

マーケットプレイスを追加するとプラグインが利用可能になります:

```
/plugin marketplace add kotaroyamame/formal-agent-contracts
```

Alternatively, clone and install locally:

または、ローカルにクローンしてインストール:

```
git clone https://github.com/kotaroyamame/formal-agent-contracts.git
cd formal-agent-contracts
/plugin install .
```

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

## Prompt Templates / プロンプトテンプレート

Ready-made prompts to get started quickly. Replace `{...}` placeholders with your own domain.

すぐに始められるプロンプトの雛形です。`{...}` の部分を自分のドメインに書き換えて使ってください。

### Template 1: Simple (Single Agent) / シンプル（単一エージェント）

Start minimal and let Claude ask follow-up questions to refine the spec.

最小限の情報で始め、Claudeとの対話で深掘りするパターンです。

```
{AgentName}エージェントを定義して。

【扱うデータ】
- {Entity}には{Field1}・{Field2}・{Field3}がある
- {ステータスや列挙型があれば: ステータスは{Value1}/{Value2}/{Value3}}

【やりたい操作】
- {Operation 1}
- {Operation 2}

【守りたいルール】
- {Business rule 1}
- {Business rule 2}
```

**Example / 記入例:**

```
在庫管理エージェントを定義して。

【扱うデータ】
- 商品には商品ID・商品名・在庫数・カテゴリがある
- カテゴリは食品/日用品/家電

【やりたい操作】
- 入荷（指定数を在庫に加算）
- 出荷（指定数を在庫から減算）
- 在庫照会（商品IDで現在の在庫数を返す）

【守りたいルール】
- 在庫数は0未満にならない
- 出荷数は現在の在庫数を超えられない
- 商品名は空文字を許可しない
```

### Template 2: Multi-Agent / マルチエージェント

For systems where multiple agents collaborate. Explicitly state inter-agent dependencies.

複数エージェントが協調するシステム向け。エージェント間の依存関係を明示します。

```
以下のマルチエージェントシステムの契約を定義して。

【システム概要】
{What the system does — 1-2 sentences}

【エージェント構成】
1. {Agent A} — {Role}
2. {Agent B} — {Role}
3. {Agent C} — {Role}

【エージェント間の依存】
- {Agent A}の{OperationX}の完了後に{Agent B}の{OperationY}が呼ばれる
- {Agent B}は{Agent C}の{OperationZ}を呼び出して結果を受け取る

【共有するデータ型】
- {TypeName}: {Description}

【各エージェントの主要ルール】
- {Agent A}: {Constraint}
- {Agent B}: {Constraint}
- {Agent C}: {Constraint}
```

**Example / 記入例:**

```
以下のマルチエージェントシステムの契約を定義して。

【システム概要】
ECサイトの注文処理。注文→在庫引当→決済の3エージェントが協調する。

【エージェント構成】
1. OrderAgent — 注文の受付・管理
2. InventoryAgent — 在庫の引当と解放
3. PaymentAgent — 決済処理

【エージェント間の依存】
- OrderAgentがConfirmOrderした後、InventoryAgentのReserveStockが呼ばれる
- ReserveStock成功後、PaymentAgentのChargeが呼ばれる
- Charge失敗時はInventoryAgentのReleaseStockで在庫を戻す

【共有するデータ型】
- OrderId: 注文の一意識別子
- ProductItem: 商品ID・数量のペア
- OrderStatus: Pending / Confirmed / Paid / Cancelled

【各エージェントの主要ルール】
- OrderAgent: Paid状態の注文はキャンセルできない
- InventoryAgent: 在庫数は0未満にならない。引当数は現在庫を超えない
- PaymentAgent: 与信確認済みでないと売上確定できない
```

### Template 3: Integrated Workflow / 統合ワークフロー（一気通貫）

Run the full pipeline — define, verify, prove, generate, test — in one shot.

定義から検証・証明・コード生成・テストまで一発で回します。

```
統合ワークフローで{SystemName}を開発して。

【ドメイン】
{What the system is for}

【データ】
- {Entity and its fields}

【操作】
- {OperationName}: {What it does}（{Precondition if any}）

【絶対に守るルール】
- {Invariant / business rule}

【生成言語】
{TypeScript / Python}
```

**Example / 記入例:**

```
統合ワークフローで予約管理システムを開発して。

【ドメイン】
会議室の予約管理。ダブルブッキングを仕様レベルで防ぎたい。

【データ】
- 会議室: 室ID・名前・定員
- 予約: 予約ID・室ID・開始時刻・終了時刻・予約者名

【操作】
- CreateReservation: 新規予約を作成（同じ部屋の時間帯が重複していないこと）
- CancelReservation: 予約をキャンセル（予約が存在すること）
- ListByRoom: 指定部屋の予約一覧を返す

【絶対に守るルール】
- 同一部屋で時間帯が重なる予約は存在できない（不変条件）
- 開始時刻 < 終了時刻
- 定員は1以上

【生成言語】
TypeScript
```

### Template 4: Formalize Existing Spec / 既存仕様の形式化

When you already have a natural-language spec or API definition, paste it directly.

すでに自然言語の仕様書やAPI定義がある場合、そのまま貼り付けます。

```
以下の仕様をVDM-SLの形式仕様に変換して。

---
{Paste your existing spec, API definition, or interface here}
---

特に以下の点を形式化してほしい:
- {Ambiguous area 1}
- {Ambiguous area 2}

形式化したら検証まで実行して。
```

### Tips for Writing Prompts / プロンプトを書くときのコツ

1. **Be specific about rules** — "Stock must not go below 0" is better than "validate stock". Boundary values become precise pre/post/invariant conditions.
2. **State inter-agent call order** — For multi-agent systems, "A.post triggers B.pre" is the core of the contract. Making this explicit enables cross-agent verification.
3. **Start small** — Use Template 1 and let Claude ask follow-up questions. The verify phase will surface missing edge cases.
4. **Use "統合ワークフローで" for end-to-end** — This triggers the full pipeline (define → verify → prove → generate → test) with automatic error recovery.

See [`prompt-templates.md`](prompt-templates.md) for more details.

プロンプトテンプレートの詳細は [`prompt-templates.md`](prompt-templates.md) を参照してください。

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
- [x] v1.1.0 — Provisional spec extraction from existing code (extract-spec) 🆕
- [x] v1.2.0 — Dialogue-driven spec refinement to uncover true specifications (refine-spec) 🆕
- [x] v1.3.0 — Code reconciliation with confirmed specs, auto-test generation (reconcile-code) 🆕
- [x] v1.4.0 — Reverse workflow orchestrator with forward pipeline connection (reverse-workflow) 🆕

## Author / 作者

IID Systems (https://iid.systems)

## License / ライセンス

MIT
