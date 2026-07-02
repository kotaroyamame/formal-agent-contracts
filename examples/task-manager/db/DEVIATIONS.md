# TaskManager — DEVIATIONS（retrenchment 表）

仕様 `TaskManager.vdmsl` と DB スキーマ（schema.sql / schema.sqlite.sql）の乖離の記録。
パターン ID は `skills/generate-db-schema/references/deviation-patterns.md` を参照。

| ID | 仕様上の表現 | DB 表現 | 乖離の内容 | 補償手段 |
|----|------------|---------|-----------|---------|
| D-NUM-1 | `TaskId = nat1`（上限なし） | BIGINT（PG）/ INTEGER + WITHOUT ROWID（SQLite） | 上限が 2^63-1 で有限 | 実用上到達不能（毎秒100万件の採番でも約29万年）。生成コード側の checkInv が nat1 を検査 |
| D-CROSS-1 | 状態不変条件 `forall id in set dom board & id < nextId` | **PG**: 両側の遅延制約トリガー（tasks 側 `trg_tasks_id_lt_next` / next_id 減少側 `trg_state_next_id_gt_tasks`、いずれも COMMIT 時検査）。**SQLite**: DDL で強制せず | SQLite には遅延トリガーがない。即時トリガーでも「カウンタ更新→INSERT」の文順を全書き込み経路に義務付ければ表現可能だが、その順序義務を課さない設計としてアプリ層に委譲 | SQLite 利用時はアプリ層（データアクセス層の checkInv）+ 契約テスト。PG のトリガーはアプリのバグ検出用の最後の砦であり、正しい採番はアプリ層の責務 |
| D-TRANS-1 | `pre ChangeStatus: ValidTransition(old, new)`（Done から遷移不可） | BEFORE UPDATE トリガー（PG / SQLite とも） | 事前条件違反が「例外」として現れる（VDM では未定義動作）。また UPDATE を経ない書き換え（SQLite の `INSERT OR REPLACE` = DELETE+INSERT、PG の DELETE+再INSERT）はトリガーを迂回する | トリガー + 契約テスト（遷移全9パターン + REPLACE 迂回のネガティブテスト）。アプリ層は upsert に必ず `ON CONFLICT DO UPDATE` を使い、`REPLACE INTO` を禁止 |
| D-SEQ-1 | 明示的操作本体 `nextId := nextId + 1` と各操作のフレーム条件（他操作は nextId を書かない）が含意する**隙間なし採番** | シングルトン状態テーブル `task_manager_state`（**SEQUENCE への置換を棄却**） | SEQUENCE はロールバック時にもカウンタが進む＝仕様上の操作が対応しない状態変化が起きるため、トレースレベルの対応（前方模倣）が破れる。なお `post RESULT = nextId~` 単独は新しい nextId の値を拘束しないことに注意（隙間なしの根拠は本体+フレーム条件） | 採番は 1 トランザクション内の「カウンタ更新（RETURNING で採番値取得）→ INSERT」で直列化（schema.sql の操作対応節） |
| D-TX-1 | VDM 操作の逐次意味論 | 既定分離レベル（READ COMMITTED） | CreateTask の read-modify-write は並行実行で採番が競合し得る | カウンタ更新文自体が行ロックを取る（UPDATE ... RETURNING を先行させる。schema.sql の操作対応節）。GetSummary の合計一致は読み取りスナップショット内でのみ保証 |
| D-STR-1 | `len title` / `len desc`（文字数） | `VARCHAR(n)` / `length()`（PG・SQLite とも文字数単位） | Unicode 結合文字を含む場合、正規化形式によって文字数の数え方が仕様と食い違い得る | 入力正規化（NFC）をアプリ層の責務として明記。境界値テスト（100/101文字）は ASCII と結合文字の両方で生成 |
| D-ENUM-1 | quote 型 `Status` / `Priority`（仕様の変更で値の追加・削除が自由） | PG: ENUM 型 / SQLite: TEXT + CHECK IN | PG の ENUM は値の追加が `ALTER TYPE ... ADD VALUE`（削除・並べ替えは不可、カラム書き換えが必要）。SQLite は CHECK の書き換えで済む | 仕様の quote 値を変更したら本スキルで DDL を再導出し、PG ではマイグレーションとして ALTER TYPE を発行 |

## 判断の記録

- **SEQUENCE 置換の棄却**（D-SEQ-1）：隙間なし採番の根拠は操作本体 `nextId := nextId + 1` と
  フレーム条件にある。SEQUENCE を採用するとロールバック時に「対応する仕様操作のない状態変化
  （カウンタ前進）」が生じ、仕様と実装のトレース対応が破れるため棄却した。
  採番の隙間を仕様として許容する場合は、操作本体・事後条件の見直し（例：`RESULT >= nextId~` への
  緩和と本体の抽象化）とあわせて SEQUENCE 採用で D-CROSS-1 / D-TX-1 が構造的に解消できる。
  その場合は本表を再導出すること。
