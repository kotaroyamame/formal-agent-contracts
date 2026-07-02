# TaskManager — TRACEABILITY（不変条件・契約 → 担保箇所）

仕様 `TaskManager.vdmsl` のすべての不変条件・操作契約と、その担保箇所の対照表。
担保箇所「なし」の行は存在しない（存在したら導出は未完成）。

## 型不変条件

| 仕様要素 | 内容 | 担保箇所（PG） | 担保箇所（SQLite） | 種別 |
|---------|------|--------------|-------------------|------|
| `TaskId = nat1` | 1以上の自然数 | `tasks_id_nat1` / `state_next_id_nat1` | 同等の CHECK | DB制約（+ D-NUM-1） |
| `inv Task`（title） | `len title <= 100` かつ seq1（非空） | `VARCHAR(100)` + `tasks_title_nonempty` | CHECK 0 < len <= 100 | DB制約 |
| `inv Task`（desc） | `len desc <= 500` | `VARCHAR(500)` | CHECK len <= 500 | DB制約 |
| `Status` / `Priority` | 列挙値のみ | ENUM 型 | CHECK IN (...) | DB制約 |
| `assignee : [seq1 of char]` | nil または非空文字列 | `tasks_assignee_nonempty` | 同等の CHECK | DB制約 |
| `inv TaskBoard` | `board(id).id = id` | id を主キーに昇格（R9） | 同左 | 構造的に成立 |

## 状態不変条件

| 仕様要素 | 内容 | 担保箇所（PG） | 担保箇所（SQLite） | 種別 |
|---------|------|--------------|-------------------|------|
| `inv TaskManagerState` (1) | `forall id in dom board & id < nextId` | `trg_tasks_id_lt_next` + `trg_state_next_id_gt_tasks`（両側の遅延制約トリガー） | アプリ層 checkInv + 契約テスト | DBトリガー / アプリ層（D-CROSS-1） |
| `inv TaskManagerState` (2) | `nextId >= 1` | `state_next_id_nat1` | 同等の CHECK | DB制約 |
| `init` | 空ボード, nextId=1 | シード INSERT（ON CONFLICT DO NOTHING） | INSERT OR IGNORE | DBシード |

## 操作契約

| 仕様要素 | 内容 | 担保箇所 | 種別 |
|---------|------|---------|------|
| `pre CreateTask` | title/desc の長さ | DDL（上記）+ アプリ層 checkPre | DB制約 + アプリ層 |
| `post CreateTask` | `RESULT = nextId~`、board に登録、status=Todo | アプリ層 checkPost + 契約テスト | アプリ層（D-SEQ-1, D-TX-1） |
| `atomic`（CreateTask） | insert と採番更新の不可分性 | 1 トランザクション + FOR UPDATE（操作対応節） | トランザクション |
| `pre ChangeStatus` | 存在（`taskId in set dom board`）+ ValidTransition | 存在: アプリ層 checkPre（UPDATE の対象行数=1 の検査。0行更新はトリガーが発火しないため） / 遷移: `trg_tasks_status_transition` | アプリ層 + DBトリガー（D-TRANS-1） |
| `post ChangeStatus` | status 更新・title 不変 | アプリ層 checkPost + 契約テスト | アプリ層 |
| `pre UpdateTask` | 存在 + 長さ | 存在: アプリ層 checkPre（UPDATE の対象行数=1 の検査） / 長さ: DDL | DB制約 + アプリ層 |
| `post UpdateTask` | title 等更新・status 不変 | アプリ層 checkPost + 契約テスト | アプリ層 |
| `pre DeleteTask` | タスクの存在 | アプリ層 checkPre（DELETE の対象行数=1 の検査） | アプリ層 |
| `post DeleteTask` | 不在 + 件数減 | アプリ層 checkPost + 契約テスト | アプリ層 |
| `post GetSummary` | t+i+d = 件数 | 契約テスト（読み取りスナップショット内。D-TX-1） | テスト |

## スコープ外（永続化に影響しない仕様要素）

読み取り専用関数 `FilterByStatus` / `FilterByPriority` / `CountByStatus` / `GetAssignedTasks` は
状態を変更せず不変条件も定義しないため、スキーマには現れない（generate-code で SELECT クエリに
写像される。任意の二次インデックス候補は schema.sql のコメント参照）。
`ValidTransition` は `pre ChangeStatus` 経由で、`CountByStatus` は `post GetSummary` 経由で
それぞれ上表に反映済み。

## 命名の対応

| VDM | DB | 理由 |
|---|---|---|
| `Task.desc` | `tasks.description` | SQL キーワード `DESC` の回避 |
| `Task` | `tasks` | テーブル名は複数形の規約 |
| `TaskManagerState` | `task_manager_state` | snake_case の規約 |
