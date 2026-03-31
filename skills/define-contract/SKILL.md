---
name: define-contract
description: >
  Define inter-agent contracts in VDM-SL for multi-agent development.
  Triggered by requests like "define an agent contract", "formalize the interface between agents",
  "write a spec", "define agent I/O", "add a new agent", or "write a formal API spec".
  Also responds to Japanese equivalents: 「エージェントの契約を定義したい」「仕様を作りたい」等。
  Guides users interactively from natural language to VDM-SL specifications,
  even without formal methods knowledge.
metadata:
  version: "0.1.0"
---

# Defining Inter-Agent Contracts

Convert agent roles and I/O described in natural language into VDM-SL specifications.
Guide users interactively so that no formal methods knowledge is required.

<!-- 日本語 -->

ユーザーが自然言語で説明するエージェントの役割・入出力を、VDM-SL仕様に変換する。
形式手法の知識がなくても使えるよう、対話的にガイドする。

## Dialogue Flow

### Step 1: Elicit the Agent's Role

Ask the user the following (using the AskUserQuestion tool):

1. Agent name and role (what does the agent do?)
2. Input data (what does it receive?)
3. Output data (what does it return?)
4. Relationships with other agents (who calls it, and who does it call?)

You don't need to ask everything at once. Follow up based on the user's answers.

<!-- 日本語 -->

ユーザーに以下を質問する（AskUserQuestionツールを使用）:

1. エージェントの名前と役割（何をするエージェントか）
2. 入力として受け取るデータ（何を渡されるか）
3. 出力として返すデータ（何を返すか）
4. 他のエージェントとの関係（誰から呼ばれ、誰を呼ぶか）

すべてを一度に聞く必要はない。ユーザーの回答に応じて深掘りする。

### Step 2: Define Data Types

Generate VDM-SL type definitions from the user's answers.

Mapping guidelines:
- "name", "email" → `seq1 of char`
- "ID", "number" → `nat1`
- "list" → `seq of T`
- "dictionary", "mapping" → `map K to V`
- "whether or not" → `bool`
- "A or B" → union type `T1 | T2`
- "may be absent" → optional type `[T]`
- Multiple fields → record type

For constraints, define invariants:
- "100 or less" → `inv x == x <= 100`
- "non-empty" → `seq1 of T` or `set1 of T`
- "unique" → express as map keys

<!-- 日本語 -->

ユーザーの回答から、VDM-SLの型定義を生成する。

変換の指針:
- 「名前」「メールアドレス」→ `seq1 of char`
- 「ID」「番号」→ `nat1`
- 「一覧」「リスト」→ `seq of T`
- 「辞書」「マッピング」→ `map K to V`
- 「〜かどうか」→ `bool`
- 「〜または〜」→ 合併型 `T1 | T2`
- 「〜がない場合もある」→ オプション型 `[T]`
- 複数のフィールドを持つもの → レコード型

制約があれば不変条件として定義する:
- 「100以下」→ `inv x == x <= 100`
- 「空でない」→ `seq1 of T` または `set1 of T`
- 「一意」→ 写像のキーとして表現

### Step 3: Define Contracts (Pre/Post-conditions)

Define agent operations as VDM-SL functions or operations.

Guiding questions:
- "What must be true before calling this operation?" → `pre`
- "What is guaranteed after a successful call?" → `post`
- "How does the system state change?" → operation + state mutation

Even if the user says "nothing special", check for implicit preconditions:
- Are null or empty inputs accepted?
- Is it an error if the ID already exists?
- Is concurrent access considered?

<!-- 日本語 -->

エージェントの操作をVDM-SLの関数または操作として定義する。

質問の指針:
- 「この操作を呼ぶとき、何が前提条件ですか？」→ `pre`
- 「操作が成功したとき、何が保証されますか？」→ `post`
- 「操作の結果、システム全体の状態はどう変わりますか？」→ 操作 + 状態変更

ユーザーが「特にない」と言った場合でも、暗黙の前提がないか確認する:
- nullや空の入力は許容するか
- IDが既に存在するケースはエラーか
- 並行アクセスは考慮するか

### Step 4: Generate the VDM-SL Specification

Generate a VDM-SL specification file from the collected information.

File organization guidelines:
- One VDM-SL module per agent
- Shared types in a separate module (`Common` or `SharedTypes`)
- File name format: `agent-name.vdmsl`

Generated specification structure:
```
module AgentName
imports from SharedTypes types ...
definitions
types
  -- Agent-specific types
functions
  -- Side-effect-free transformations
operations
  -- State-mutating operations
state AgentState of
  -- Agent's internal state
end
end AgentName
```

<!-- 日本語 -->

上記の情報をもとにVDM-SL仕様ファイルを生成する。

ファイル構成の指針:
- エージェントごとに1つのVDM-SLモジュールを作成
- 共有型は別モジュール（`Common`や`SharedTypes`）に定義
- ファイル名は `agent-name.vdmsl` の形式

生成する仕様の構造:
```
module AgentName
imports from SharedTypes types ...
definitions
types
  -- エージェント固有の型
functions
  -- 副作用のない変換処理
operations
  -- 状態を変更する操作
state AgentState of
  -- エージェントの内部状態
end
end AgentName
```

### Step 5: Review and Refine

Present the generated specification to the user and confirm:
1. Are the type definitions correct?
2. Are there missing pre-conditions?
3. Are the post-conditions sufficient?
4. Are there other constraints that should be invariants?

Update the specification based on feedback.

<!-- 日本語 -->

生成した仕様をユーザーに提示し、以下を確認する:
1. 型定義は正しいか
2. 事前条件に漏れはないか
3. 事後条件は十分か
4. 不変条件で表現すべき制約が他にないか

修正があれば仕様を更新する。

## Templates

Contract pattern templates commonly used in multi-agent development are available in
`references/contract-templates.md`. Suggest a matching template if one fits the user's requirements.

<!-- 日本語 -->

`references/contract-templates.md` にマルチエージェント開発でよく使われる
契約パターンのテンプレートがある。ユーザーの要件に近いテンプレートがあれば提示する。

## Important Notes

- If the user is unfamiliar with formal methods, confirm intent in natural language before showing VDM-SL code
- Build complex specifications incrementally (types first, then functions, then operations and state)
- Inform the user that generated specifications can be verified with the verify-spec skill
- For VDM-SL syntax or concept explanations, refer to the formal-methods-guide skill

<!-- 日本語 -->

- ユーザーが形式手法に不慣れな場合、VDM-SLのコードを見せる前に自然言語で意図を確認する
- 複雑な仕様は段階的に構築する（最初は型だけ、次に関数、最後に操作と状態）
- 生成した仕様は必ずverify-specスキルで検証可能であることを伝える
- VDM-SLの文法や概念の説明が必要な場合はformal-methods-guideスキルを参照する
