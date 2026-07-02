# エージェント契約テンプレート集 (v2.0.0)

形式的エージェント契約の定義時に参照するVDM-SL標準パターン集です。

---

## パターン1：データ変換エージェント

**用途**: 入力データを変換し、異なる形式の出力を返すエージェント

**特徴**:
- ステートレス（状態管理なし）
- 入出力型が異なる
- 純粋な関数型

**VDM-SL テンプレート**:

```vdm-sl
module TextNormalizer
imports all from Prelude

exports all

definitions

-- 入力型
InputText = seq of char

-- 出力型
NormalizedText = seq of char

-- 正規化関数
normalize : InputText -> NormalizedText
normalize(text) == 
  [ if c = ' ' then ' ' else lower_char(c) for c in text ]

-- 後提条件：出力は入力より短いか等しい
post normalize(text) ==
  len normalize(text) <= len text

-- 副関数
lower_char : char -> char
lower_char(c) == c  -- 実装簡略化

end TextNormalizer
```

---

## パターン2：CRUD エージェント

**用途**: データストア上の作成・読み取り・更新・削除を管理するエージェント

**特徴**:
- ステートフル（データベース状態を管理）
- 不変式によるデータ一貫性保証
- 状態遷移の明確化

**VDM-SL テンプレート**:

```vdm-sl
module TicketStore
imports all from Prelude

exports all

definitions

-- 型定義
TicketId = nat1
TicketStatus = <Created> | <Assigned> | <InProgress> | <Resolved> | <Closed>

Ticket ::
  id : TicketId
  title : seq of char
  status : TicketStatus
  created_at : nat1

TicketStore = map TicketId to Ticket

inv store_inv(store : TicketStore) ==
  forall id in set dom store &
    store(id).id = id and
    len store(id).title > 0

-- CREATE操作
createTicket : TicketStore * seq of char -> TicketStore * TicketId
createTicket(store, title) ==
  let new_id = if store = {} then 1 else max_id(store) + 1
      new_ticket = mk_Ticket(new_id, title, <Created>, now())
  in
  (store munion {new_id |-> new_ticket}, new_id)

pre createTicket(store, title) ==
  title <> [] and len title <= 255

post createTicket(store, title) ==
  let (new_store, new_id) = createTicket(store, title)
  in
    new_id not in set dom store and
    new_id in set dom new_store and
    new_store(new_id).status = <Created>

-- READ操作
readTicket : TicketStore * TicketId -> Ticket
readTicket(store, id) == store(id)

pre readTicket(store, id) ==
  id in set dom store

-- UPDATE操作
updateTicketStatus : TicketStore * TicketId * TicketStatus -> TicketStore
updateTicketStatus(store, id, new_status) ==
  store ++ {id |-> mk_Ticket(
    store(id).id,
    store(id).title,
    new_status,
    store(id).created_at
  )}

pre updateTicketStatus(store, id, new_status) ==
  id in set dom store and
  validTransition(store(id).status, new_status)

post updateTicketStatus(store, id, new_status) ==
  (updateTicketStatus(store, id, new_status))(id).status = new_status

-- DELETE操作
deleteTicket : TicketStore * TicketId -> TicketStore
deleteTicket(store, id) == {id} <-: store

pre deleteTicket(store, id) ==
  id in set dom store

post deleteTicket(store, id) ==
  let new_store = deleteTicket(store, id)
  in
    id not in set dom new_store and
    forall other_id in set (dom store \ {id}) &
      other_id in set dom new_store

-- 状態遷移検証
validTransition : (TicketStatus * TicketStatus) -> bool
validTransition(from, to) ==
  (from = <Created> => to in set {<Assigned>, <Closed>}) and
  (from = <Assigned> => to in set {<InProgress>, <Closed>}) and
  (from = <InProgress> => to in set {<Resolved>, <Closed>}) and
  (from = <Resolved> => to in set {<Closed>}) and
  (from = <Closed> => to = <Closed>)

-- 副関数
max_id : TicketStore -> nat1
max_id(store) == max elems [id | id in set dom store]

now : nat1
now() == 0  -- プレースホルダ

end TicketStore
```

---

## パターン3：パイプラインエージェント

**用途**: 複数の処理ステップを順序立てて実行するエージェント

**特徴**:
- 各ステップの出力が次のステップの入力
- ステップ間の型整合性保証
- 部分的成功/失敗の処理

**VDM-SL テンプレート**:

```vdm-sl
module TextProcessingPipeline
imports all from Prelude

exports all

definitions

-- 型定義
RawText = seq of char
CleanedText = seq of char
TokenizedText = seq of (seq of char)
ProcessingResult = <Success> of TokenizedText | <Failure> of seq of char

-- ステップ1：クリーニング
cleanText : RawText -> CleanedText
cleanText(text) ==
  [ c | c in text & c <> '\n' and c <> '\t' ]

pre cleanText(text) == text <> []

post cleanText(text) ==
  len cleanText(text) <= len text

-- ステップ2：トークン化
tokenizeText : CleanedText -> TokenizedText
tokenizeText(text) ==
  split_by_space(text)

pre tokenizeText(text) == text <> []

post tokenizeText(text) ==
  forall token in seq tokenizeText(text) & token <> []

-- パイプライン実行
processPipeline : RawText -> ProcessingResult
processPipeline(text) ==
  if text = [] then
    mk_Failure("Empty input")
  else
    let cleaned = cleanText(text),
        tokenized = tokenizeText(cleaned)
    in
      mk_Success(tokenized)

post processPipeline(text) ==
  let result = processPipeline(text)
  in
    (text = [] => result = mk_Failure("Empty input")) and
    (text <> [] => is_Success(result))

-- 副関数
split_by_space : CleanedText -> TokenizedText
split_by_space(text) == []  -- 実装簡略化

end TextProcessingPipeline
```

---

## パターン4：メディエータエージェント

**用途**: 複数のエージェント間の通信を仲介するエージェント

**特徴**:
- メッセージのルーティング
- エージェント間の疎結合化
- 例外処理と再試行

**VDM-SL テンプレート**:

```vdm-sl
module MessageMediator
imports all from Prelude

exports all

definitions

-- メッセージ型定義
MessageType = <TicketCreate> | <TicketUpdate> | <Escalation> | <Reply>
SenderType = <User> | <Agent> | <Operator>

Message ::
  msg_type : MessageType
  sender : SenderType
  content : seq of char
  priority : nat1

-- ルーティング結果
RouteResult = <Routed> | <Failed> | <Queued>

-- メッセージルーティング関数
routeMessage : Message -> RouteResult
routeMessage(msg) ==
  cases msg.msg_type :
    <TicketCreate> => route_to_agent(msg),
    <Escalation> => route_to_operator(msg),
    <Reply> => route_to_user(msg),
    others => <Failed>
  end

post routeMessage(msg) ==
  (msg.priority > 10 => routeMessage(msg) = <Routed>) or
  (msg.priority <= 10 => routeMessage(msg) in set {<Routed>, <Queued>})

-- ルーティング関数
route_to_agent : Message -> RouteResult
route_to_agent(msg) == <Routed>

route_to_operator : Message -> RouteResult
route_to_operator(msg) == <Routed>

route_to_user : Message -> RouteResult
route_to_user(msg) == <Routed>

end MessageMediator
```

---

## パターン5：バリデーション エージェント

**用途**: 入力データの妥当性を検証するエージェント

**特徴**:
- 複合制約の検証
- エラーレポート
- 段階的検証

**VDM-SL テンプレート**:

```vdm-sl
module InputValidator
imports all from Prelude

exports all

definitions

-- 入力型
Ticket ::
  id : nat1
  title : seq of char
  priority : nat0
  complexity : nat0
  customer_id : nat1

-- 検証結果
ValidationError = seq of seq of char
ValidationResult = <Valid> | <Invalid> of ValidationError

-- メイン検証関数
validateTicket : Ticket -> ValidationResult
validateTicket(ticket) ==
  let errors = collect_errors(ticket)
  in
    if errors = [] then
      <Valid>
    else
      <Invalid> errors

post validateTicket(ticket) ==
  (validateTicket(ticket) = <Valid> => 
    validate_title(ticket.title) and
    validate_priority(ticket.priority) and
    validate_complexity(ticket.complexity)) and
  (validateTicket(ticket) <> <Valid> =>
    exists error in seq (ticket of <Invalid> errors) &
      error <> [])

-- 段階的検証関数
validate_title : (seq of char) -> bool
validate_title(title) ==
  len title > 0 and len title <= 255

validate_priority : nat0 -> bool
validate_priority(pri) ==
  pri >= 0 and pri <= 10

validate_complexity : nat0 -> bool
validate_complexity(comp) ==
  comp >= 0 and comp <= 100

-- エラー収集
collect_errors : Ticket -> ValidationError
collect_errors(ticket) ==
  let errors = []
  in
    if not validate_title(ticket.title) then
      errors ^ ["Title must be between 1 and 255 characters"]
    else errors

end InputValidator
```

---

## パターン6：Phase 2設計文書テンプレート（新 v2.0.0）

**用途**: VDM-SL仕様と実装の間に、詳細設計ドキュメント（PROTOCOL.md、API-SIGNATURES.md）を生成するテンプレート

**特徴**:
- メッセージ型の正規名簿（Single Source of Truth）
- ペイロード構造の明示的仕様
- 状態遷移規則の設計書化
- API関数シグネチャの統一定義
- 命名規約の宣言

**設計文書テンプレート（マークダウン形式）**:

### PROTOCOL.md テンプレート

```markdown
# PROTOCOL.md — 通信プロトコル仕様

## メッセージ型レジストリ

**方針**: 各方向のメッセージ型を一元管理し、Single Source of Truth とする。
コンポーネント間のメッセージやりとりでは必ずこのリストを参照すること。

### クライアント → サーバー

| メッセージ型 | 説明 | 前提条件 | 状態遷移 |
|-----------|------|--------|--------|
| `ticket_create` | チケット作成リクエスト | WebSocket接続済み、`customer_id` > 0 | チケット：created |
| `ticket_update` | チケット更新リクエスト | チケットが存在、遷移可能な状態 | チケット状態遷移 |
| `escalation_request` | エスカレーションリクエスト | チケットが作成済み、未解決 | チケット：escalated |

### サーバー → クライアント

| メッセージ型 | 説明 | トリガー | 前提条件 |
|-----------|------|--------|--------|
| `ticket_created` | チケット作成完了 | ticket_create受信後 | ticket_id生成成功 |
| `auto_reply` | 自動返信 | ticket_create受信後、スコア ≤ t2 | スコア計算成功 |
| `operator_reply` | オペレータ返信 | operator_send_message受信後 | オペレータ認可 |
| `ticket_updated` | チケット更新完了 | ticket_update受信後 | ステータス遷移成功 |

### オペレータ → サーバー

| メッセージ型 | 説明 | 前提条件 |
|-----------|------|--------|
| `reply_manual` | 手動返信送信 | チケット割り当て済み |
| `mark_complete` | 完了マーク | チケット進行中 |
| `escalate_operator` | 上位エスカレーション | チケット割り当て済み |

### サーバー → オペレータ

| メッセージ型 | 説明 | トリガー |
|-----------|------|--------|
| `assign_ticket` | チケット割り当て | ticket_create受信かつスコア > t1 |
| `request_reply` | 返信要求 | t2 < スコア ≤ t1（ハイブリッド処理） |
| `update_status` | ステータス更新 | ticket_update受信後 |

---

## ペイロード構造

### ticket_create

発信元: クライアント  
受信先: サーバー

| フィールド | 型 | 必須 | 制約 | 説明 |
|-----------|----|----|------|------|
| `customer_id` | `number` | Yes | > 0 | 顧客ID |
| `title` | `string` | Yes | 1 ≤ len ≤ 255 | チケットタイトル |
| `description` | `string` | No | len ≤ 2000 | 詳細説明 |

### ticket_update

発信元: クライアント  
受信先: サーバー

| フィールド | 型 | 必須 | 制約 | 説明 |
|-----------|----|----|------|------|
| `ticket_id` | `number` | Yes | > 0 | 既存チケットID |
| `new_status` | `string` | Yes | in {created, assigned, in_progress, resolved, closed} | 遷移先ステータス |

### escalation_request

発信元: クライアント  
受信先: サーバー

| フィールド | 型 | 必須 | 制約 | 説明 |
|-----------|----|----|------|------|
| `ticket_id` | `number` | Yes | > 0 | チケットID |
| `reason` | `string` | No | len ≤ 500 | エスカレーション理由 |

### ticket_created

発信元: サーバー  
受信先: クライアント

| フィールド | 型 | 必須 | 制約 | 説明 |
|-----------|----|----|------|------|
| `ticket_id` | `number` | Yes | > 0 | 新規チケットID |
| `status` | `string` | Yes | = "created" | ステータス（初期値固定） |
| `created_at` | `number` | Yes | > 0 | タイムスタンプ（ミリ秒） |

### auto_reply

発信元: サーバー  
受信先: クライアント

| フィールド | 型 | 必須 | 制約 | 説明 |
|-----------|----|----|------|------|
| `ticket_id` | `number` | Yes | > 0 | 対象チケットID |
| `reply_text` | `string` | Yes | len > 0 | 自動返信文 |
| `score` | `number` | Yes | 1 ≤ score ≤ t2 | 複雑度スコア |

---

## 状態遷移マシン

### TicketStatus

| 現在状態 | 遷移可能な状態 | トリガーメッセージ |
|--------|-----------|------------------|
| `created` | `assigned`, `closed` | `ticket_update`（status=assigned\|closed） |
| `assigned` | `in_progress`, `closed` | `ticket_update`（status=in_progress\|closed） |
| `in_progress` | `resolved`, `closed` | `ticket_update`（status=resolved\|closed） |
| `resolved` | `closed` | `ticket_update`（status=closed） |
| `closed` | ※なし（終了状態） | — |

---

## 命名規約

### メッセージ型名
- **形式**: snake_case、英語小文字
- **例**: `ticket_create`, `auto_reply`, `escalation_request`
- **反例**: `TicketCreate`（PascalCase）、`ticket_creates`（複数形）

### フィールド名
- **形式**: snake_case、英語小文字
- **例**: `customer_id`, `reply_text`, `created_at`
- **反例**: `customerId`（camelCase）、`customer_ID`（大文字混在）

### ステータス値
- **形式**: snake_case、英語小文字
- **例**: `created`, `in_progress`, `resolved`
- **反例**: `Created`（大文字）、`inProgress`（camelCase）

### 関数シグネチャ（APIエンドポイント）
- **形式**: camelCase、英語
- **例**: `createTicket()`, `updateTicketStatus()`, `escalateTicket()`

---

## WebSocket接続前提条件

1. **接続確立**: クライアントはメッセージ送信前に必ずWebSocket接続を確立すること
2. **ハンドシェイク**: サーバーは接続確立時に `connection_ack` を返す
3. **タイムアウト**: 30秒以内に送信がない場合は接続を切断

---

## Null安全性

- **ペイロードフィールド**: Required列が「Yes」のフィールドは null/undefined であってはならない
- **メッセージ型**: 不正なメッセージ型を受け取った場合、サーバーは `error_invalid_message_type` を返して接続を切断
- **ペイロード検証**: 各フィールドの制約違反は検証エラーとして報告（メッセージ破棄）

---

## エラーハンドリング

| エラー種別 | 対応メッセージ型 | 復旧方法 |
|-----------|--------------|--------|
| 不正なメッセージ型 | `error_invalid_message_type` | 接続を切断し再接続 |
| ペイロード検証失敗 | `error_validation_failed` | ペイロードを確認して再送 |
| 状態遷移不可 | `error_invalid_transition` | 現在の状態を確認 |
| 認可不足 | `error_unauthorized` | 認可情報を確認 |
```

### API-SIGNATURES.md テンプレート

```markdown
# API-SIGNATURES.md — 関数シグネチャ定義

## クライアント側API

### createTicket

```typescript
function createTicket(
  customerId: number,
  title: string,
  description?: string
): Promise<{ ticketId: number; status: string; createdAt: number }>
```

**前提条件**:
- `customerId` > 0
- 1 ≤ `title.length` ≤ 255
- WebSocket接続確立済み

**例外**:
- `ValidationError`: ペイロード検証失敗
- `TimeoutError`: サーバー応答なし（30秒）
- `ConnectionError`: WebSocket未接続

---

### updateTicketStatus

```typescript
function updateTicketStatus(
  ticketId: number,
  newStatus: 'created' | 'assigned' | 'in_progress' | 'resolved' | 'closed'
): Promise<{ ticketId: number; status: string; updatedAt: number }>
```

**前提条件**:
- チケットが存在する
- `newStatus` が現在状態から遷移可能

---

## サーバー側API

### broadcastToClient

```typescript
function broadcastToClient(
  clientId: string,
  messageType: string,
  payload: unknown
): Promise<void>
```

**前提条件**:
- クライアントがWebSocket接続済み
- `messageType` が レジストリに存在
- `payload` が対応スキーマを満たす

---

## スコアリングAPI（ハイブリッド判定）

### calculateComplexityScore

```typescript
function calculateComplexityScore(
  ticketTitle: string,
  ticketDescription: string
): Promise<number>
```

**戻り値**: 1 ≤ score ≤ 100

---

### decideAction

```typescript
function decideAction(
  score: number,
  thresholdT1: number,
  thresholdT2: number
): 'auto_reply' | 'operator_and_llm' | 'operator_only'
```

**前提条件**:
- `t1 > t2`
- 1 ≤ `score`, `t1`, `t2` ≤ 100

**戻り値の意味**:
- `auto_reply`: `score ≤ t2` → 自動返信で対応
- `operator_and_llm`: `t2 < score ≤ t1` → LLM + オペレータのハイブリッド処理
- `operator_only`: `score > t1` → オペレータのみで対応
```

**実装時の注意点**：
- PROTOCOL.md はVDM-SL仕様と一貫性を保つ。矛盾がある場合は VDM-SL を優先
- API-SIGNATURES.md は TypeScript 型定義と同期させる
- メッセージ型、ペイロードフィールド、状態遷移はこのドキュメントを Single Source of Truth とする
- 実装コード内の定義とドキュメントのズレを防ぐため、契約テストで照合する

---

## パターン7：ハイブリッド判定エージェント（新 v2.0.0）

**用途**: スコアベースの複合判定を行うエージェント

**特徴**:
- スコア計算と複数のしきい値による判定
- 明確な判定ロジック
- エッジケース処理

**VDM-SL テンプレート**:

```vdm-sl
module HybridJudgeAgent
imports all from Prelude

exports all

definitions

-- ======== 型定義 ========

Score = nat1
inv s == s >= 1 and s <= 100

Threshold = nat1
inv t == t >= 1 and t <= 100

Action = <AutoReply> | <OperatorAndLLM> | <OperatorOnly>

Ticket ::
  id : nat1
  title : seq of char
  content : seq of char
  priority : nat0
  complexity_score : Score

-- ======== スコア集約関数 ========

scoreAll : (seq of Score) -> seq of Score
scoreAll(scores) ==
  sort_descending(scores)

post scoreAll(scores) ==
  let result = scoreAll(scores)
  in
    len result = len scores and
    forall i in set inds result & forall j in set inds result &
      i < j => result(i) >= result(j)

-- 降順ソート（後提条件で大小関係を保証）
sort_descending : (seq of Score) -> seq of Score
sort_descending(scores) == scores  -- 実装簡略化

-- ======== メイン判定関数 ========

decide : Ticket -> Score -> Score -> Action
decide(ticket, t1, t2) ==
  if ticket.complexity_score > t1 then
    <OperatorOnly>
  elseif ticket.complexity_score > t2 then
    <OperatorAndLLM>
  else
    <AutoReply>

-- 前提条件：しきい値の順序とスコアの有効性を保証
pre decide(ticket, t1, t2) ==
  t1 > t2 and
  ticket.complexity_score >= 1 and ticket.complexity_score <= 100 and
  t1 >= 1 and t1 <= 100 and
  t2 >= 1 and t2 <= 100

-- 後提条件：判定ロジックの正確性を保証
post decide(ticket, t1, t2) ==
  (let action = decide(ticket, t1, t2)
   in
    (ticket.complexity_score > t1 => action = <OperatorOnly>) and
    (t2 < ticket.complexity_score <= t1 => action = <OperatorAndLLM>) and
    (ticket.complexity_score <= t2 => action = <AutoReply>) and
    -- アクション型は3値のいずれか
    action in set {<AutoReply>, <OperatorAndLLM>, <OperatorOnly>}
  )

-- ======== 詳細判定関数（段階的判定） ========

decideWithExplanation : Ticket -> Score -> Score -> (Action * seq of char)
decideWithExplanation(ticket, t1, t2) ==
  let action = decide(ticket, t1, t2),
      explanation = explain_decision(ticket.complexity_score, t1, t2, action)
  in
    (action, explanation)

post decideWithExplanation(ticket, t1, t2) ==
  let (action, explanation) = decideWithExplanation(ticket, t1, t2)
  in
    explanation <> [] and
    (action = <OperatorOnly> => explanation contains "complexity" or
     action = <OperatorAndLLM> => explanation contains "balance" or
     action = <AutoReply> => explanation contains "simple")

-- ======== 副関数 ========

explain_decision : (Score * Score * Score * Action) -> seq of char
explain_decision(score, t1, t2, action) ==
  cases action :
    <OperatorOnly> => "Complexity exceeds maximum threshold",
    <OperatorAndLLM> => "Complexity in hybrid processing range",
    <AutoReply> => "Complexity within auto-reply threshold",
    others => "Unknown action"
  end

contains : (seq of char * seq of char) -> bool
contains(text, substr) == true  -- 実装簡略化

end HybridJudgeAgent
```

**実装時の注意点**：
- `t1 > t2`の前提条件により、スコアの大小比較が一意に決定
- スカラパラメータ（`t1`, `t2`）は構造体ではなく分離して定義
- 後提条件は3値全ての判定結果をカバー
- エッジケース（`score == t1`、`score == t2`）を明確に扱う

---

## 実装時の注意点（全パターン共通）

### 命名規約の厳格化（v2.0.0）

| 要素 | 規約 | 例 |
|------|------|-----|
| 型名 | PascalCase（英語） | `TicketStatus`, `Score`, `WsMessage` |
| 関数名 | camelCase（英語） | `decideAction`, `validateInput`, `routeMessage` |
| Quote型値 | `<PascalCase>`（英語） | `<Created>`, `<OperatorOnly>`, `<AutoReply>` |
| 判定関数 | `is` + 名詞 または `valid` + 名詞 | `isValid`, `isClientToServer`, `validTransition` |
| 抽出関数 | `get` + 名詞 | `getPayload`, `getStatus` |
| 検証関数 | `validate` + 名詞 | `validateTicket`, `validateMessage` |
| 状態チェック関数 | `canTransitionTo` | `canTransitionTo(from, to)` |

### 不変式の形式化

```vdm-sl
-- 良い例：明確で検証可能
inv score_inv(s : Score) == s >= 1 and s <= 100

-- 悪い例：曖昧で検証困難
inv score_reasonable(s : Score) == s > 0
```

### 前提条件と後提条件

```vdm-sl
-- 前提条件：呼び出し側の責任を明記
pre decide(ticket, t1, t2) == t1 > t2 and ...

-- 後提条件：実装側の責任を明記
post decide(ticket, t1, t2) == 
  (ticket.complexity_score > t1 => decide(ticket, t1, t2) = <OperatorOnly>)
```

---

## VDM-SL → JavaScript 型変換参照

テンプレートをJavaScriptで実装する際の型対応：

| VDM-SL | JavaScript | 説明 |
|--------|-----------|------|
| `nat1` | `number` (>= 1) | 自然数（1以上） |
| `nat0` | `number` (>= 0) | 自然数（0以上） |
| `seq of char` | `string` | 文字列 |
| `seq of T` | `Array<T>` | シーケンス |
| `set of T` | `Set<T>` | 集合 |
| `map T1 to T2` | `Map<T1, T2>` | マップ |
| `T1 \| T2 \| ...` (Quote) | `Union` / Discriminated Union | 合成型 |
| `Record :: f1: T1 f2: T2` | `{ f1: T1, f2: T2 }` | レコード型 |
| `bool` | `boolean` | 真偽値 |
| `inv expr` | Runtime validation | 不変式は実行時チェック |

---

## よくある実装上の問題と対策

### 問題1：不変式が厳しすぎる

**VDM-SL**:
```vdm-sl
Score inv s == s >= 1 and s <= 100  -- 常に成立する必要
```

**JavaScript実装**:
```javascript
// ❌ 悪い例：常にassertionが必要
let score = calculateScore(ticket);
if (!(score >= 1 && score <= 100)) throw new Error(...);

// ✅ 良い例：計算時に保証
function calculateScore(ticket) {
  let score = baseScore(ticket);
  return Math.max(1, Math.min(100, score));  // 常に1-100に正規化
}
```

### 問題2：前提条件が満たせない入力

**VDM-SL**:
```vdm-sl
pre validateTicket(ticket) == ticket.id > 0 and len ticket.title > 0
```

**JavaScript実装**:
```javascript
// ❌ 悪い例：前提条件違反で失敗
function validateTicket(ticket) {
  if (!(ticket.id > 0)) throw new Error("Invalid id");
  // ... 以下の検証が実行されない可能性
}

// ✅ 良い例：入力サニタイズで前提条件を保証
function validateTicket(ticket) {
  if (!ticket.id || ticket.id <= 0) {
    throw new Error("Invalid id");  // 前提条件エラー
  }
  // ... 以降の検証ロジック
}
```

### 問題3：後提条件の検証漏れ

**VDM-SL**:
```vdm-sl
post decide(ticket, t1, t2) ==
  (ticket.complexity_score > t1 => action = <OperatorOnly>)
```

**JavaScript実装**:
```javascript
// ❌ 悪い例：後提条件を検証していない
function decide(ticket, t1, t2) {
  if (ticket.complexity_score > t1) return "OperatorOnly";
  // ...
}

// ✅ 良い例：テストで後提条件を検証
function decide(ticket, t1, t2) {
  const action = decideLogic(ticket, t1, t2);
  // テスト時に検証：
  // assert(ticket.complexity_score > t1 => action === "OperatorOnly")
  return action;
}
```

---

**最終更新**: 2026-04-12  
**バージョン**: 2.0.0
