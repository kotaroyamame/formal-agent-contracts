# VDM-SL → SQL 写像規則集 (v2.1.0)

generate-db-schema スキルが適用する規則の完全版。各規則には ID があり、
生成する DDL のコメントと DEVIATIONS.md から引用される。

方言表記：**PG** = PostgreSQL（デフォルト）、**MY** = MySQL 8+、**LT** = SQLite 3。

---

## 型の写像

### R1: record 型 → テーブル

```
Task :: id : TaskId  title : seq1 of char  status : Status
```
→ 1 record 型 = 1 テーブル、1 フィールド = 1 カラム。テーブル名は snake_case 複数形。

- record が**他の record のフィールドとしてのみ**現れる（独立に集約されない）場合は、
  埋め込み（カラムのフラット化 `owner_name`, `owner_email`）を第一候補とし、
  独立した参照が必要ならテーブル分離 + FK（R10）。判断はユーザーに確認

### R2: state の `map K to V` → キー付きテーブル

```
state S of board : map TaskId to Task
```
→ V（Task）のテーブルに K を主キーとして埋め込む。`dom board` = テーブルの全行。
map の「キーの一意性」は主キーにより構造的に成立（R8）。

- `map K to (V1 * V2)` のようにタプル値の場合はカラム展開
- 同じ V を値に持つ map が複数ある場合はテーブルを分けるか discriminator カラムかを確認
- `inmap K to V`（単射 map）は上記に加えて**値側の一意性**が必要 → 値カラム（群）に UNIQUE

### R3: quote 型の合併（列挙）→ ENUM / CHECK

```
Status = <Todo> | <InProgress> | <Done>;
```
- **PG**: `CREATE TYPE task_status AS ENUM ('Todo','InProgress','Done');`
- **MY**: `ENUM('Todo','InProgress','Done')` カラム型
- **LT**: `TEXT CHECK (status IN ('Todo','InProgress','Done'))`

quote 値の文字列表現は VDM の quote 名そのまま（`<Todo>` → `'Todo'`）。
生成コード（generate-code）の enum 文字列と一致させること。

**進化の乖離（D-ENUM）**: PG の ENUM は値の追加が `ALTER TYPE ... ADD VALUE`
（削除・並べ替え不可、カラム書き換えが必要）。仕様の quote 値が変わりやすい場合は
TEXT + 名前付き CHECK も選択肢（trade-off をユーザーに確認）。

### R4: 整数・真偽の基本型

| VDM | PG / MY | LT | 制約 | 乖離 |
|---|---|---|---|---|
| `nat` | BIGINT | INTEGER | CHECK (x >= 0) | D-NUM（上限有限） |
| `nat1` | BIGINT | INTEGER | CHECK (x >= 1) | D-NUM |
| `int` | BIGINT | INTEGER | — | D-NUM |
| `bool` | BOOLEAN | INTEGER + CHECK (x IN (0,1)) | — | — |

実数系（`real` / `rat`）は R16 を参照。

**注意（SQLite の rowid エイリアス）**: `INTEGER PRIMARY KEY` は rowid の別名になり、
NULL を INSERT すると自動採番されてしまう。主キーが仕様上の識別子である場合は
`WITHOUT ROWID` テーブルにして NULL 挿入を NOT NULL 違反として拒否させること。

### R16: 実数系（real / rat）

| VDM | PG / MY | LT | 乖離 |
|---|---|---|---|
| `real` | DOUBLE PRECISION | REAL | D-FLOAT（IEEE754 丸め） |
| `rat` | NUMERIC | NUMERIC | D-RAT（有限精度） |

金額・比率など精度が意味を持つ値は NUMERIC(p,s) への変更をユーザーに確認する。
等値比較を含む不変条件は DB 上で偽になり得るため、誤差許容比較のアプリ層チェックへ
変換する（deviation-patterns.md の D-FLOAT 参照）。

### R5: 文字列

| VDM | 写像 |
|---|---|
| `seq of char` | TEXT。inv に `len x <= n` があれば VARCHAR(n)（PG/MY）/ TEXT + CHECK（LT） |
| `seq1 of char` | 上記 + CHECK (length(x) > 0)（**MY 注意**: `CHAR_LENGTH()` を使う） |
| `char` | CHAR(1) |

**注意（D-STR）**: VARCHAR(n) の n は**文字数**（PG/MY とも文字単位）。VDM の `len` も
文字数なので通常は一致するが、照合順序・正規化（NFC/NFD）の差は乖離として記録。

### R6: optional 型 `[T]` → NULL 許容

`assignee : [seq1 of char]` → `assignee TEXT NULL`。
T 側の不変条件は `CHECK (x IS NULL OR <条件>)` の形で付与。

**注意**: optional でないカラムはすべて `NOT NULL` を明示する。

### R14: コレクション（char 以外）

| VDM | 写像 |
|---|---|
| `set of T`（T が参照） | 結合テーブル `parent_id, t_id, PRIMARY KEY(parent_id, t_id)` |
| `seq of T` | 結合テーブル + `position INT`、`UNIQUE(parent_id, position)` |
| `set of` 基本型 | 結合テーブル、または PG 配列カラム（乖離 D-ARR: 配列は要素制約を CHECK で書きにくい）。ユーザーに確認 |
| `map K to V`（state 直下でない） | 親 ID 付きテーブル `parent_id, k, v...`, `PRIMARY KEY(parent_id, k)` |
| `seq1 of T`（char 以外） | 結合テーブル + position。**非空性は行の存在**という複数行制約なので DDL では書けない → トリガーまたはアプリ層（乖離 D-CROSS） |

### R17: state の単一値コンポーネント

```
state S of ... nextId : TaskId
```
第一候補：**シングルトン状態テーブル**

```sql
CREATE TABLE task_manager_state (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
  next_id BIGINT NOT NULL CHECK (next_id >= 1)
);
```

`nextId` のような**採番カウンタ**は、DB ネイティブの SEQUENCE / IDENTITY への置換を
ユーザーに提案してよい（並行性で有利）。ただし置換は乖離 D-SEQ：SEQUENCE は
ロールバック時にもカウンタが進むため、「対応する仕様操作のない状態変化」が生じ、
仕様とのトレースレベルの対応が破れる。隙間なし採番を含意しているのは事後条件単独では
なく**明示的な操作本体（`nextId := nextId + 1`）とフレーム条件**なので、仕様側が
欠番を許容できるか（本体の抽象化・契約の緩和が可能か）をユーザーに確認すること。

### R18: `token` 型・合成キー

`token` は不透明な識別子 → サロゲートキー（BIGINT IDENTITY / UUID）+ 必要なら UNIQUE。
表現の選択はユーザーに確認し、選択理由を DEVIATIONS ではなく schema.sql コメントに記す。

---

## 不変条件の写像

### R7: 単一行で閉じる型不変条件 → CHECK

```
inv t == len t.title <= 100 and len t.desc <= 500;
```
→ そのカラムの CHECK（または VARCHAR 長）に直訳。**1 行の値だけで判定できる**ことが条件。

### R8/R9: 構造的に成立する不変条件 → 記録のみ

- R8: map のキー一意性 → 主キーが保証
- R9: `inv board == forall id in set dom board & board(id).id = id`（キー=フィールド一致）
  → id フィールドを主キーに昇格させることで**構造的に成立**（board(id).id と id が同一カラムになる）

これらは制約を追加しない代わりに、TRACEABILITY.md に「構造的に成立」と記録する。

### R10: エンティティ間参照 → FOREIGN KEY

```
inv s == forall o in set rng orders & o.customer_id in set dom customers
```
→ `FOREIGN KEY (customer_id) REFERENCES customers(id)`。
削除時の意味（RESTRICT/CASCADE）は仕様の削除操作の事前・事後条件から読み取り、
読み取れなければユーザーに確認。

### R11: forall による一意性 → UNIQUE

```
inv s == forall t1, t2 in set rng board & t1 <> t2 => t1.title <> t2.title
```
→ `UNIQUE (title)`。条件付き一意性（「アクティブなものの中で一意」）は
PG の部分インデックス `CREATE UNIQUE INDEX ... WHERE ...`（MY/LT は乖離 D-PUNIQ → トリガーかアプリ層）。

### R12: 状態遷移規則 → UPDATE トリガー

遷移の妥当性（`ValidTransition(old, new)`）は行の新旧比較なので CHECK では書けない。

```sql
-- pre ChangeStatus: ValidTransition(board(taskId).status, newStatus) (R12)
CREATE FUNCTION enforce_task_status_transition() RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'Done' AND NEW.status <> 'Done' THEN
    RAISE EXCEPTION 'invalid transition: Done -> %', NEW.status;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tasks_status_transition
  BEFORE UPDATE OF status ON tasks
  FOR EACH ROW EXECUTE FUNCTION enforce_task_status_transition();
```

- **MY**: `BEFORE UPDATE` トリガー + `SIGNAL SQLSTATE '45000'`
- **LT**: `BEFORE UPDATE` トリガー + `RAISE(ABORT, ...)`
- D-TRANS は**常に記録する**（CHECK で表現できないこと自体と、事前条件違反が例外に
  強化されることが乖離）。トリガーは第一候補の補償手段。トリガーを使わない選択
  （アプリ層のみ）を採る場合は、契約テスト（遷移全パターン）を必須の補償手段に加える
- **迂回経路に注意**：SQLite の `INSERT OR REPLACE`（DELETE+INSERT）や DELETE+再INSERT は
  UPDATE トリガーを発火させない。アプリ層の upsert は `ON CONFLICT DO UPDATE` を使うこと

### R13: 複数コンポーネント／複数行にまたがる状態不変条件

```
inv mk_S(board, nextId) == forall id in set dom board & id < nextId
```
選択肢（上から優先）：
1. **構造で消す**：R17 の SEQUENCE 置換を採用すれば「採番済み id < 次の採番値」は構造的に成立（乖離 D-SEQ とのトレードオフ）
2. **トリガー**：INSERT/UPDATE 時に相手テーブルを参照して検査（性能影響をコメントに明記）
3. **アプリ層 + 契約テスト**：乖離 D-CROSS として記録

集約制約（「合計が一致する」「件数が上限以下」）も同様。遅延制約
（`DEFERRABLE INITIALLY DEFERRED`、PG のみ）はトランザクション内の一時的違反を許す場合に使う。

---

## 操作の写像

### R15: トランザクション境界

- `atomic ( ... )` ブロック → 1 トランザクション（BEGIN〜COMMIT）。schema.sql 末尾の
  「操作→トランザクション対応」コメント節に列挙する
- atomic なしでも、事後条件が複数テーブル/行の同時変更を主張する操作は 1 トランザクション
- 分離レベル：仕様の並行性記述がない限り既定（READ COMMITTED）とし、
  `post` が他行の不在・集約値に依存する操作にはより強い分離（REPEATABLE READ/SERIALIZABLE）
  の検討をコメントで促す

---

## 対象外の構文（正直なスコープ宣言）

以下は本規則集の対象外。出会ったら**推測せず**、乖離として記録した上でユーザーと
写像方針を相談する：

- **quote 以外の一般合併型**（`nat | seq of char`、`<None> | nat` など）
  — 判別子カラム + NULL 許容カラム群への展開が典型だが、設計判断が必要
- **関数型のフィールド**（`f : nat -> nat` など）— 関係モデルでは表現不可。
  永続化対象から外すか、コードとして別管理
- **再帰型・深い入れ子の合成型** — 正規化の度合いに設計判断が必要
- **NoSQL への写像** — SKILL.md のトラブルシューティング参照

## 出力の作法

1. **すべての DDL 要素に由来コメント**：`-- <VDM要素> (<規則ID>)` 形式
2. **制約には名前を付ける**（`tasks_title_len` 等）— TRACEABILITY.md から参照するため
3. **DROP を含めない**。冪等化はテーブルには `IF NOT EXISTS`、PG の型・制約トリガーには
   `IF NOT EXISTS` が存在しないため DO ブロックのガード
   （`EXCEPTION WHEN duplicate_object` / `pg_trigger` の存在チェック）を使う。
   本格的なマイグレーション管理はスコープ外（migration ツールに委ねる）
4. 方言は 1 ファイル 1 方言。複数方言が必要なら `schema.sql`（PG）/ `schema.sqlite.sql` 等に分ける

---

**最終更新**: 2026-07-02  
**バージョン**: 2.1.0  
