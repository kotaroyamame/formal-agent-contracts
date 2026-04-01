# Reverse Workflow — 既存コードからの仕様あぶり出し設計案

## 基本思想

コードから抽出される仕様は「仮の仕様（Provisional Spec）」であり、真の仕様ではない。
真の仕様はユーザーの頭の中にあり、多くの場合ユーザー自身もそれを完全には言語化できていない。

このワークフローの目的は **コードから仕様を作ること** ではなく、
**対話のための素材を自動生成し、ユーザーとの対話を通じて真の仕様をあぶり出すこと** である。

```
「仮の仕様」 ≠ 「真の仕様」
「仮の仕様」 = 「真の仕様を引き出すための問い」
```

### 設計原則

1. **仮マーキング原則** — 仮の仕様には必ず `[PROVISIONAL]` タグを付与する。「コードがこう動いている」と「こう動くべき」は明確に区別する
2. **差分可視化原則** — 仮の仕様とユーザーの回答が食い違った箇所を「発見事項（Finding）」として記録する。これがバグ・仕様漏れ・意図的な妥協のいずれかである
3. **収束サイクル原則** — 一発で完成しない。仮仕様→対話→修正→再検証→差分→対話…のサイクルを回し、仮の仕様が真の仕様に漸近していく
4. **コード非信頼原則** — 既存コードの振る舞いを「正しい」と仮定しない。コードにバグがある可能性を常に念頭に置く

---

## 全体フロー

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│ 1. EXTRACT  │────>│ 2. DIALOGUE  │────>│ 3. RECONCILE │
│ 仮の仕様抽出 │     │ 対話的あぶり出し │     │ コードとの照合  │
└─────────────┘     └──────────────┘     └──────────────┘
      │                    │  ▲                   │
      ▼                    ▼  │                   ▼
 仮VDM-SL仕様        真の仕様（確定版）       差分レポート
 [PROVISIONAL]        [CONFIRMED]         + 修正済みコード
                           │                   + テスト
                           │
                    ┌──────┴───────┐
                    │ 既存フォワード  │
                    │ パイプラインへ  │
                    │ (verify→prove  │
                    │  →generate→test)│
                    └──────────────┘
```

---

## 新スキル 1: `extract-spec` — 仮の仕様抽出

### 役割

既存のソースコードを読み取り、そこから **仮の** VDM-SL仕様を生成する。
生成された仕様はあくまで「コードが現在何をしているか」の近似であり、
「コードが何をすべきか」ではないことを常に明示する。

### トリガー条件

- 「既存のコードから仕様を抽出して」「このコードの仕様を形式化して」
- 「コードベースを分析して仕様を作って」
- "Extract a spec from this code", "Reverse engineer the specification"
- 「このプロジェクトの仕様を起こして」

### 入力

- ソースコードファイル（TypeScript, Python, Java, Go, etc.）
- 対象のディレクトリまたはファイル群
- （オプション）既存のドキュメント、コメント、テストコード

### 出力

- `[PROVISIONAL]` タグ付きVDM-SL仕様ファイル（`.provisional.vdmsl`）
- 抽出レポート（何を読み取り、何が不明瞭だったか）
- 要確認リスト（ユーザーに確認すべき曖昧な箇所）

### 対話フロー

#### Step 1: コードの構造分析

1. 対象ファイル/ディレクトリを特定
2. コードを読み取り、以下を抽出:
   - データ型・クラス・インターフェース → VDM-SL型の候補
   - 関数・メソッドのシグネチャ → VDM-SL関数/操作の候補
   - バリデーションロジック → 事前条件の候補
   - 戻り値の保証 → 事後条件の候補
   - クラス不変条件・アサーション → 不変条件の候補
3. テストコードがあれば、テストケースから暗黙の仕様を推測

#### Step 2: 仮VDM-SL仕様の生成

コードから読み取った情報を、以下のルールでVDM-SLに変換する:

**型の抽出:**
```
TypeScript interface → VDM-SL record type
  - optional fields (?) → [Type] (optional type)
  - union types (A | B) → A | B
  - enum → quote union <A> | <B>
  - array → seq of T
  - Map/Record → map K to V

Python dataclass → VDM-SL record type
  - Optional[T] → [T]
  - Union[A, B] → A | B
  - List[T] → seq of T
  - Dict[K, V] → map K to V
```

**事前条件の抽出:**
```
if文のガード条件 → pre候補
  - if (!user) throw Error → pre: user exists
  - if (amount < 0) throw → pre: amount >= 0
バリデーション関数 → pre候補
  - validateEmail(email) → pre: is_valid_email(email)
型ガード / null チェック → pre候補
```

**事後条件の抽出:**
```
return文の値 → post候補
  - return { ...entity, status: 'active' } → post: result.status = <Active>
状態変更 → post候補
  - this.items.push(item) → post: len items = len items~ + 1
DB操作 → post候補
  - db.insert(record) → post: record in set stored_records
```

**不変条件の抽出:**
```
バリデーションデコレータ → inv候補
  - @MaxLength(100) → inv: len title <= 100
コンストラクタのチェック → inv候補
アサーション → inv候補
```

#### Step 3: 不明瞭な箇所の特定

コードから読み取れなかった情報を明示的にリストアップする:

```markdown
## 要確認事項（Questions for User）

1. [UNCLEAR] `processOrder` は並行呼び出しを想定していますか？
   コードにはロック機構がありません。
   → 並行アクセスを考慮するなら、排他制御の事前条件が必要です

2. [UNCLEAR] `deleteUser` の戻り値が `void` ですが、削除成功の保証は何ですか？
   → 事後条件をどう定義すべきか判断できません

3. [AMBIGUOUS] `calculateDiscount` に `if (vipLevel > 3)` という条件がありますが、
   VIPレベルの上限は何ですか？
   → コードからは上限が読み取れません

4. [IMPLICIT] テストコードに `expect(balance).toBeGreaterThanOrEqual(0)` がありますが、
   これは仕様として意図されたものですか、テストの便宜ですか？
   → 不変条件にするか否かはユーザー判断
```

#### Step 4: 仮仕様の提示

生成した仕様を**全て `[PROVISIONAL]` タグ付き**で提示する:

```vdmsl
module OrderAgent
-- [PROVISIONAL] Generated from: src/services/order-service.ts
-- This specification reflects what the code DOES, not necessarily what it SHOULD do.
-- この仕様はコードの「現在の動作」を反映しています。「あるべき動作」ではありません。

definitions

types
  OrderId = nat1;

  OrderStatus = <Pending> | <Confirmed> | <Paid> | <Cancelled>;

  Order :: id       : OrderId
           items    : seq1 of OrderItem
           status   : OrderStatus
           total    : real
  inv o == o.total >= 0      -- [PROVISIONAL] コードのバリデーションから推測
       and len o.items <= 50; -- [PROVISIONAL] コードに明示的制限なし。定数MAX_ITEMSから推測

operations
  ConfirmOrder: OrderId ==> ()
  ConfirmOrder(orderId) == ...
  pre orderId in set dom orders           -- [PROVISIONAL] コードのnullチェックから
      and orders(orderId).status = <Pending>  -- [PROVISIONAL] if文のガードから
  post orders(orderId).status = <Confirmed>;  -- [PROVISIONAL] 代入文から

  CancelOrder: OrderId ==> ()
  CancelOrder(orderId) == ...
  pre orderId in set dom orders
      -- [QUESTION] Paid状態のキャンセルは許可すべきか？
      -- コードでは Paid → Cancelled を許可しているが、これは意図通りか？
      and orders(orderId).status <> <Cancelled>
  post orders(orderId).status = <Cancelled>;

end OrderAgent
```

**重要: 仕様の各行に出自を記録する。**
- `[PROVISIONAL]` — コードから機械的に抽出。未確認
- `[QUESTION]` — コードの振る舞いに疑問あり。ユーザー確認必須
- `[IMPLICIT]` — テストやコメントから推測。明示的なコードがない
- `[MISSING]` — コードに該当する処理がない。仕様として定義すべきか不明

### 重要な制約

- 仮仕様をそのまま「確定仕様」として扱わないこと
- 必ず次のステップ（`refine-spec` での対話）に進むことを促す
- 抽出結果はあくまで「問い」の素材であることをユーザーに毎回伝える

---

## 新スキル 2: `refine-spec` — 対話的あぶり出し

### 役割

`extract-spec` が生成した仮の仕様を叩き台に、ユーザーとの対話を通じて
真の仕様をあぶり出す。仮の仕様の各項目について「これは意図通りか？」を問い、
食い違いを「発見事項」として記録し、仕様を段階的に確定させていく。

### トリガー条件

- `extract-spec` 完了後の自動遷移
- 「仕様を磨きたい」「仕様を確認したい」「仮仕様をレビューして」
- "Refine the spec", "Review the provisional spec"
- 「コードの意図を確認したい」

### 入力

- `[PROVISIONAL]` 付きVDM-SL仕様（`.provisional.vdmsl`）
- （オプション）対応するソースコード

### 出力

- 確定済みVDM-SL仕様（`.vdmsl`） — `[CONFIRMED]` タグ付き
- 発見事項レポート（Findings Report）
- 差分サマリー（仮仕様 → 確定仕様の変更点）

### 対話フロー

#### Step 1: 自然言語での仕様説明

仮のVDM-SL仕様を**自然言語に翻訳**して提示する。
VDM-SLを読めないユーザーでも「これは自分の意図と合っているか」を判断できるようにする。

```markdown
## 現在のコードが示している仕様（仮）

### OrderAgent（注文エージェント）

**データ:**
- 注文は「注文ID、商品リスト（1件以上50件以下）、ステータス、合計金額」を持つ
- ステータスは Pending → Confirmed → Paid → Cancelled の4種類
- 合計金額は0以上

**操作:**
- **注文確定（ConfirmOrder）**: Pending状態の注文のみ確定可能。確定後ステータスはConfirmedに変わる。
- **注文キャンセル（CancelOrder）**: Cancelled以外の注文をキャンセル可能。

❓ **確認が必要な点:**
1. Paid状態の注文もキャンセルできてよいですか？（コードでは許可されています）
2. 商品数の上限50件は仕様として正しいですか？（コードの定数 `MAX_ITEMS=50` から推測）
3. 合計金額が0円の注文は許可すべきですか？
```

#### Step 2: カテゴリ別の対話

仮仕様の項目を以下のカテゴリに分けて順に確認する:

**カテゴリ A: 要確認事項（Questions）**
コードの振る舞いに疑問がある箇所。最優先で確認する。

```
Q: 「Paid状態の注文もキャンセルできてよいですか？」
   コードの振る舞い: 許可している
   選択肢:
   (a) はい、これは意図通り（返金処理が別途ある）
   (b) いいえ、Paidの注文はキャンセル不可にすべき → [FINDING: Bug]
   (c) 条件付きで可能（例: 出荷前なら可能）→ [FINDING: Spec Refinement]
```

**カテゴリ B: 暗黙の仕様（Implicit）**
テストやコメントから推測した仕様。ユーザーに明示化を求める。

```
Q: 「残高は常に0以上であるべきですか？」
   根拠: テストコードに expect(balance >= 0) がある
   選択肢:
   (a) はい、これは不変条件として確定 → [CONFIRMED]
   (b) いいえ、一時的にマイナスになることがある → 不変条件から除外
   (c) 基本的にはそうだが、例外がある → 条件付き不変条件に修正
```

**カテゴリ C: 欠落している仕様（Missing）**
コードに存在しないが、仕様として定義すべき可能性がある箇所。

```
Q: 「注文の合計金額は、商品の個別金額の合計と一致すべきですか？」
   コードの状況: 合計金額を個別に設定しており、整合性チェックがない
   選択肢:
   (a) はい、不変条件として追加すべき → [FINDING: Missing Invariant]
   (b) いいえ、割引等があるため一致しないことがある
   (c) 合計 ≤ 商品個別合計 であるべき（割引による減少のみ許可）
```

#### Step 3: 発見事項の記録

対話の結果を「Finding（発見事項）」として分類・記録する:

| 分類 | 意味 | アクション |
|------|------|-----------|
| **Bug** | コードの振る舞いがユーザーの意図と異なる | コード修正が必要 |
| **Spec Gap** | 仕様として定義されるべきだがコードに実装がない | コード追加が必要 |
| **Spec Refinement** | 仕様が曖昧でより精密な定義が必要 | 事前/事後/不変条件を追加 |
| **Intentional** | コードの振る舞いがユーザーの意図通り | 仮仕様を確定 |
| **Debt** | 意図通りではないが今は修正しない | 技術的負債として記録 |

```markdown
## Findings Report

### Finding #1: Paid注文のキャンセル [Bug]
- **仮仕様**: Cancelled以外なら全てキャンセル可能
- **ユーザーの意図**: Paid後のキャンセルは不可
- **アクション**: CancelOrderのpreに `status <> <Paid>` を追加
- **コード影響**: order-service.ts L.142 の条件分岐を修正

### Finding #2: 合計金額の整合性 [Spec Gap]
- **仮仕様**: 合計金額の検証なし
- **ユーザーの意図**: 合計 = Σ(items.price * items.quantity) - discount
- **アクション**: 不変条件として追加
- **コード影響**: Orderクラスに整合性チェックを追加

### Finding #3: 残高の非負制約 [Intentional]
- **仮仕様**: balance >= 0 (テストから推測)
- **ユーザーの意図**: その通り
- **アクション**: [PROVISIONAL] → [CONFIRMED] に昇格
```

#### Step 4: 確定仕様の生成

発見事項を反映し、全ての `[PROVISIONAL]` タグを解消した確定版VDM-SL仕様を生成する:

```vdmsl
module OrderAgent
-- [CONFIRMED] Refined through user dialogue on 2026-04-01
-- Based on: src/services/order-service.ts
-- Findings: 2 bugs, 1 spec gap, 1 confirmed

definitions

types
  Order :: id       : OrderId
           items    : seq1 of OrderItem
           status   : OrderStatus
           total    : real
  inv o == o.total >= 0                                    -- [CONFIRMED]
       and len o.items <= 50                               -- [CONFIRMED]
       and o.total = sum_item_totals(o.items) - o.discount; -- [ADDED: Finding #2]

operations
  CancelOrder: OrderId ==> ()
  CancelOrder(orderId) == ...
  pre orderId in set dom orders
      and orders(orderId).status <> <Cancelled>
      and orders(orderId).status <> <Paid>    -- [ADDED: Finding #1]
  post orders(orderId).status = <Cancelled>;

end OrderAgent
```

#### Step 5: 収束の判定

以下の条件が全て満たされたら、仕様は「収束した」と判断する:

- [ ] 全ての `[PROVISIONAL]` タグが `[CONFIRMED]` または削除されている
- [ ] 全ての `[QUESTION]` に回答済み
- [ ] 全ての Finding に分類（Bug/Spec Gap/Refinement/Intentional/Debt）が付いている
- [ ] ユーザーが確定仕様に合意している

収束していない場合は Step 2 に戻り、残りの項目を確認する。

### 重要な制約

- 対話の各ステップで「コードの動作」と「ユーザーの意図」を明確に対比する
- ユーザーが「わからない」と答えた場合、その箇所を `[UNRESOLVED]` としてマークし、後で再訪する
- 一度に全てを確認しようとしない。カテゴリAを最優先で、残りは段階的に

---

## 新スキル 3: `reconcile-code` — コードとの照合・修正

### 役割

`refine-spec` で確定した真の仕様と既存コードを照合し、
差分を可視化した上で、コードの修正案とテストを生成する。

### トリガー条件

- `refine-spec` 完了後の自動遷移
- 「仕様とコードを照合して」「差分を出して」「コードを仕様に合わせて」
- "Reconcile code with spec", "Show the diff between spec and code"
- 「コードを直して」「仕様通りに修正して」

### 入力

- 確定済みVDM-SL仕様（`.vdmsl`）
- 既存ソースコード
- 発見事項レポート（Findings Report）

### 出力

- コード差分レポート（仕様との乖離箇所の一覧）
- 修正済みコード（ユーザーの承認後に適用）
- 自動生成テスト（仕様の各条件をテストするコード）
- 照合レポート（全体のサマリー）

### 対話フロー

#### Step 1: 差分分析

確定仕様とコードを項目ごとに照合する:

```markdown
## Code-Spec Reconciliation Report

### 1. 型定義の照合

| 仕様の型 | コードの型 | 状態 |
|----------|-----------|------|
| Order.items: seq1 of OrderItem | items: OrderItem[] | ⚠️ 空配列を許容（seq1 違反） |
| Order.total: real, inv >= 0 | total: number | ⚠️ バリデーションなし |
| OrderStatus: 4値の列挙 | status: string | ⚠️ 型安全でない |

### 2. 事前条件の照合

| 仕様の事前条件 | コードの実装 | 状態 |
|---------------|-------------|------|
| CancelOrder pre: status <> Paid | if (status === 'Cancelled') throw | ❌ Paid チェックなし [Bug: Finding #1] |
| ConfirmOrder pre: status = Pending | if (status !== 'Pending') throw | ✅ 一致 |

### 3. 事後条件の照合

| 仕様の事後条件 | コードの実装 | 状態 |
|---------------|-------------|------|
| ConfirmOrder post: status = Confirmed | this.status = 'Confirmed' | ✅ 一致 |
| CancelOrder post: status = Cancelled | this.status = 'Cancelled' | ✅ 一致 |

### 4. 不変条件の照合

| 仕様の不変条件 | コードの実装 | 状態 |
|---------------|-------------|------|
| total = sum(items) - discount | なし | ❌ 未実装 [Spec Gap: Finding #2] |
| items は空でない | なし | ⚠️ バリデーションなし |
```

#### Step 2: 修正案の生成

Finding の分類に基づいて、修正案を優先順位付きで提示する:

**優先度 High: Bug（コードの振る舞いが意図と異なる）**

```typescript
// Finding #1: CancelOrder の事前条件修正
// Before:
cancelOrder(orderId: string): void {
  const order = this.orders.get(orderId);
  if (!order) throw new Error('Order not found');
  if (order.status === 'Cancelled') throw new Error('Already cancelled');
  order.status = 'Cancelled';
}

// After:
cancelOrder(orderId: string): void {
  const order = this.orders.get(orderId);
  if (!order) throw new Error('Order not found');
  if (order.status === 'Cancelled') throw new Error('Already cancelled');
  if (order.status === 'Paid') throw new Error('Cannot cancel paid order'); // [FIX: Finding #1]
  order.status = 'Cancelled';
}
```

**優先度 Medium: Spec Gap（仕様はあるがコードにない）**

```typescript
// Finding #2: 合計金額の整合性チェック追加
class Order {
  // 新規追加: 不変条件チェック
  private validateTotalConsistency(): void {
    const itemTotal = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const expected = itemTotal - (this.discount ?? 0);
    if (Math.abs(this.total - expected) > 0.01) {
      throw new ContractError(`Total inconsistency: expected ${expected}, got ${this.total}`);
    }
  }
}
```

**優先度 Low: 型安全性の強化**

```typescript
// 既存: status: string
// 修正: 仕様に合わせた型安全な列挙型に変更
type OrderStatus = 'Pending' | 'Confirmed' | 'Paid' | 'Cancelled';
```

#### Step 3: テスト自動生成

確定仕様の各条件に対応するテストを自動生成する:

```typescript
describe('OrderAgent — Specification Compliance Tests', () => {

  // 事前条件テスト
  describe('CancelOrder pre-conditions', () => {
    it('should reject cancellation of Paid order [Finding #1]', () => {
      const order = createOrder({ status: 'Paid' });
      expect(() => agent.cancelOrder(order.id))
        .toThrow('Cannot cancel paid order');
    });

    it('should allow cancellation of Confirmed order', () => {
      const order = createOrder({ status: 'Confirmed' });
      expect(() => agent.cancelOrder(order.id)).not.toThrow();
    });
  });

  // 不変条件テスト
  describe('Order invariants', () => {
    it('should enforce total = sum(items) - discount [Finding #2]', () => {
      const items = [{ price: 100, quantity: 2 }, { price: 50, quantity: 1 }];
      const order = createOrder({ items, total: 999 }); // 不正な合計
      expect(() => order.validate()).toThrow(); // 不変条件違反
    });

    it('should reject empty item list', () => {
      expect(() => createOrder({ items: [] })).toThrow();
    });
  });

  // 事後条件テスト
  describe('CancelOrder post-conditions', () => {
    it('should set status to Cancelled after cancellation', () => {
      const order = createOrder({ status: 'Confirmed' });
      agent.cancelOrder(order.id);
      expect(order.status).toBe('Cancelled');
    });
  });
});
```

テストの構造:
- **Finding から生成されたテスト** — 各 Finding に最低1つのテストケース
- **事前条件テスト** — 違反入力 → エラーが出ること
- **事後条件テスト** — 正常入力 → 期待結果が得られること
- **不変条件テスト** — 違反データ → 構築時にエラーが出ること

#### Step 4: 照合レポート

```markdown
═══════════════════════════════════════════════════
  Code-Spec Reconciliation Report
  Project: order-service
  Date: 2026-04-01
═══════════════════════════════════════════════════

仕様項目:        12
コードと一致:     8  (67%)
Bug発見:         1  (Finding #1: Paidキャンセル)
Spec Gap:        1  (Finding #2: 合計金額整合性)
型安全性の改善:   2  (OrderStatus, items非空チェック)

修正ファイル:
  - src/services/order-service.ts (2箇所修正)
  - src/models/order.ts (1箇所修正)

生成テスト:
  - tests/order-agent.spec.ts (8テストケース)

═══════════════════════════════════════════════════
```

---

## 統合: `reverse-workflow` — リバースワークフローオーケストレーター

### 役割

`extract-spec` → `refine-spec` → `reconcile-code` の3フェーズを
一気通貫で実行するオーケストレーター。
既存の `integrated-workflow` と対を成すスキル。

### フロー

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
│ 1. EXTRACT  │────>│ 2. REFINE    │────>│ 3. RECONCILE │────>│ 4. VERIFY│
│ 仮仕様抽出   │     │ 対話的磨き上げ │     │ コード照合     │     │ (既存)   │
└─────────────┘     └──────────────┘     └──────────────┘     └──────────┘
                          ▲  │                                      │
                          │  ▼                                      ▼
                     収束するまで                              既存フォワード
                     サイクルを回す                            パイプラインへ接続
```

### Phase 4 以降: 既存パイプラインへの接続

確定仕様（`.vdmsl`）が得られた時点で、既存のフォワードパイプラインに接続できる:

- `verify-spec` — 確定仕様の形式的検証
- `smt-verify` — POの自動証明
- `generate-code` — （必要に応じて）新規コードの生成
- 既存の `integrated-workflow` に途中から合流

### トリガー条件

- 「既存のコードから仕様を起こして、コードも直して」
- 「リバースワークフローで」「コードの仕様を明確にしたい」
- "Run the reverse workflow", "Extract and refine spec from existing code"
- 「このプロジェクトを形式仕様で整理したい」

### ワークフローコントロール

既存の `integrated-workflow` と同じコマンド体系:

| コマンド | アクション |
|---------|-----------|
| 「次へ」/ "next" | 次のフェーズへ |
| 「戻る」/ "back" | 前のフェーズへ |
| 「もう一周」/ "another round" | refine-specをもう1サイクル |
| 「ここまで」/ "stop here" | 途中でレポート生成して終了 |
| 「フォワードに接続」/ "connect to forward" | 確定仕様を既存パイプラインへ |

---

## ファイル構成案

```
formal-agent-contracts/
├── skills/
│   ├── extract-spec/              # 新規
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── code-to-vdmsl-mapping.md    # 言語別の変換ルール
│   │       └── provisional-tag-guide.md    # PROVISIONALタグの運用ルール
│   ├── refine-spec/               # 新規
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── dialogue-patterns.md        # 対話パターン集
│   │       ├── finding-categories.md       # 発見事項の分類ガイド
│   │       └── convergence-criteria.md     # 収束判定の基準
│   ├── reconcile-code/            # 新規
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── diff-analysis-rules.md      # 差分分析のルール
│   │       └── test-generation-patterns.md # テスト生成パターン
│   ├── reverse-workflow/          # 新規（オーケストレーター）
│   │   ├── SKILL.md
│   │   └── references/
│   │       └── reverse-phases.md           # フェーズ遷移の判定基準
│   │
│   ├── define-contract/           # 既存
│   ├── verify-spec/               # 既存
│   ├── smt-verify/                # 既存
│   ├── generate-code/             # 既存
│   ├── integrated-workflow/       # 既存
│   └── formal-methods-guide/      # 既存
```

---

## バージョニング案

| Version | 内容 |
|---------|------|
| v1.1.0 | `extract-spec` — 仮仕様抽出（TypeScript/Python対応） |
| v1.2.0 | `refine-spec` — 対話的あぶり出し |
| v1.3.0 | `reconcile-code` — コード照合・修正・テスト生成 |
| v1.4.0 | `reverse-workflow` — オーケストレーター統合 |
| v2.0.0 | フォワード + リバースの双方向統合パイプライン |

---

## 未解決の設計課題

1. **対応言語の範囲**: v1.1.0 で TypeScript / Python のみか、Java / Go も含めるか
2. **大規模コードベースの扱い**: ファイル数が多い場合のスコープ設定。エントリポイントの指定方法
3. **refine-spec の収束保証**: 対話が延々と続く可能性。「完璧でなくても十分」の判断基準
4. **既存テストとの統合**: reconcile-code で生成するテストと既存テストフレームワークの整合性
5. **VDM-SLの表現力の限界**: コードの全ての振る舞いがVDM-SLで表現可能とは限らない。非同期処理、並行性、副作用の扱い
