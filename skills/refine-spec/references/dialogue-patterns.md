# Dialogue Patterns for Spec Refinement

## English and Japanese Dialogue Patterns

Effective dialogue patterns for the refine-spec skill. Use these templates to ask clear questions and handle diverse user responses.

---

## Part 1: Binary Questions (Is This Intended?)

### Pattern 1A: Simple Behavior Confirmation

**English:**
```
QUESTION: {Title}

Current code behavior:
{What the code actually does, in one clear sentence}

Is this what you intended?
  (a) Yes, correct as-is
  (b) No, it should work differently
  (c) It's more nuanced—the intended behavior is [user fills in]
  (d) I'm not sure / need to think about it
```

**Japanese (日本語):**
```
質問: {タイトル}

現在のコード動作:
{コードが実際にしていることを、明確な1文で}

これがあなたの意図ですか?
  (a) はい、そのままで正しい
  (b) いいえ、違う動作にすべき
  (c) もっと複雑で、本来の動作は [ユーザーが記入]
  (d) わかりませんまたは考える時間がほしい
```

**Example - Refund Handling:**

English:
```
QUESTION: Refund exception handling

Current code behavior:
When a customer requests a refund, if the original transaction record
cannot be found, the system throws an exception and the account balance
is not changed.

Is this what you intended?
  (a) Yes, fail the refund if no transaction record exists
  (b) No, we should still credit the account anyway
  (c) It's more nuanced—[user clarifies]
  (d) I'm not sure
```

Japanese:
```
質問: 払い戻し例外処理

現在のコード動作:
顧客が払い戻しをリクエストしたとき、元の取引レコードが見つからない場合、
システムは例外をスロー（発生）させ、口座残高は変更されません。

これがあなたの意図ですか?
  (a) はい、取引レコードがなければ払い戻しに失敗する
  (b) いいえ、どうせ口座に金額を入金すべき
  (c) もっと複雑で [ユーザーが詳しく説明]
  (d) わかりません
```

### Pattern 1B: Edge Case Clarification

**English:**
```
QUESTION: {Title} — Edge case

Current code behavior:
When [trigger condition], the code [result].
The code [does/doesn't] [secondary action].

Is this the intended behavior?
  (a) Yes, this is correct
  (b) No, it should [different result]
  (c) The secondary action should be different: [user specifies]
  (d) Uncertain
```

**Japanese:**
```
質問: {タイトル} — 境界ケース

現在のコード動作:
[トリガー条件]のとき、コードは[結果]します。
コードは[追加動作][実行/実行しない]。

これは意図された動作ですか?
  (a) はい、正しい
  (b) いいえ、[異なる結果]にすべき
  (c) 追加動作を変更すべき: [ユーザーが記入]
  (d) わかりません
```

**Example - Empty List:**

English:
```
QUESTION: Empty list handling

Current code behavior:
When the input list is empty, the operation returns the original
state unchanged. No error is raised.

Is this the intended behavior?
  (a) Yes, empty input means no-op
  (b) No, empty input should be an error
  (c) It should do something else: [user specifies]
  (d) Uncertain
```

Japanese:
```
質問: 空リスト処理

現在のコード動作:
入力リストが空のとき、操作は元の状態を変更なしで返します。
エラーは発生しません。

これは意図された動作ですか?
  (a) はい、空入力は操作なし
  (b) いいえ、空入力はエラーにすべき
  (c) 別の動作をすべき: [ユーザーが記入]
  (d) わかりません
```

---

## Part 2: Confirming Implicit Specs

### Pattern 2A: Test-Driven Implicit Spec

**English:**
```
IMPLICIT REQUIREMENT: {Title}

Evidence from tests:
- Test case: {test name}
  Expected: {what test expects}

- Test case: {test name}
  Expected: {what test expects}

Is this a real requirement that should be in the spec?
  (a) Yes, this is required behavior
  (b) No, this is just how tests are written (not a true requirement)
  (c) It's important, but the true requirement is: [user clarifies]
  (d) This was temporary—we can drop it now
```

**Japanese:**
```
暗黙の要件: {タイトル}

テストからの根拠:
- テストケース: {テスト名}
  期待値: {テストが期待していること}

- テストケース: {テスト名}
  期待値: {テストが期待していること}

これは仕様に含めるべき実際の要件ですか?
  (a) はい、必要な動作
  (b) いいえ、テストの書き方であって真の要件ではない
  (c) 重要だが、本来の要件は: [ユーザーが説明]
  (d) これは一時的だったので、今は落とせる
```

**Example - Minimum Transaction Amount:**

English:
```
IMPLICIT REQUIREMENT: Minimum transaction amount

Evidence from tests:
- Test: test_deposit_below_minimum
  Expected: Transaction fails with error when amount < $0.01

- Test: test_withdraw_below_minimum
  Expected: Operation rejected when amount < $0.01

- Comment in code: "Stripe doesn't process amounts below 1 cent"

Is this a real requirement that should be in the spec?
  (a) Yes, enforce minimum $0.01 amount
  (b) No, this is just a Stripe limitation—we might remove it
  (c) It's more nuanced: the limit should be [user specifies]
  (d) This was temporary—we can handle any amount now
```

Japanese:
```
暗黙の要件: 最小取引額

テストからの根拠:
- テスト: test_deposit_below_minimum
  期待値: 金額が$0.01未満のとき、トランザクションがエラーで失敗

- テスト: test_withdraw_below_minimum
  期待値: 金額が$0.01未満のとき、操作が却下される

- コード内のコメント: 「Stripeは1セント未満の金額を処理しない」

これは仕様に含めるべき実際の要件ですか?
  (a) はい、最小$0.01金額を実装する
  (b) いいえ、これはStripeの制限 - 削除するかもしれない
  (c) もっと複雑で、制限値は [ユーザーが記入]
  (d) 一時的だったので、今は任意の金額を処理できる
```

### Pattern 2B: Comment-Driven Implicit Spec

**English:**
```
IMPLICIT REQUIREMENT: {Title}

Comments in code suggest:
{Quote from comment, ~20 words max}

Is this a documented requirement, or was it a temporary note?
  (a) Yes, this is a real requirement
  (b) No, this was a temporary note—we can remove it
  (c) It's partly true, but the real requirement is: [user clarifies]
  (d) I'm uncertain
```

**Japanese:**
```
暗黙の要件: {タイトル}

コード内のコメントが示唆するもの:
{コメントからの引用、最大20語程度}

これはドキュメント化された要件ですか、それとも一時的なメモですか?
  (a) はい、これは実際の要件
  (b) いいえ、一時的なメモだった - 削除できる
  (c) 部分的に真だが、本来の要件は: [ユーザーが説明]
  (d) わかりません
```

**Example - Idempotent API:**

English:
```
IMPLICIT REQUIREMENT: Idempotent API calls

Comments in code suggest:
"Calling this operation twice with identical data should produce
the same result and not cause errors"

Is this a documented requirement, or was it just a note?
  (a) Yes, API must be idempotent for reliability
  (b) No, this was aspirational—second calls should error
  (c) It's important, but only for certain operations: [user specifies]
  (d) I'm uncertain about this
```

Japanese:
```
暗黙の要件: べき等APIコール

コード内のコメントが示唆するもの:
「この操作を同じデータで2回呼び出すと、同じ結果が生成され、
エラーが発生しないはず」

これはドキュメント化された要件ですか、それともメモですか?
  (a) はい、信頼性のためAPIはべき等であるべき
  (b) いいえ、願望だった - 2回目の呼び出しはエラーにすべき
  (c) 重要だが、特定の操作のみ: [ユーザーが記入]
  (d) これについて不確実です
```

### Pattern 2C: Batch Confirmation of Implicit Specs

Use when multiple implicit specs are straightforward and low-risk.

**English:**
```
IMPLICIT REQUIREMENTS (batch)

These specs are inferred from tests and appear to be core business rules:

1. [IMPLICIT] Accounts have unique customer IDs (immutable once created)
2. [IMPLICIT] Balance is always non-negative (never goes below 0)
3. [IMPLICIT] Deposit amounts must be positive (no zero or negative deposits)
4. [IMPLICIT] Transactions are time-ordered (later tx cannot appear before earlier one)

Quick confirms (all low-risk):
  All four correct? [Yes / No / Review individually]

Or individual Y/N:
  1. ___ 2. ___ 3. ___ 4. ___
```

**Japanese:**
```
暗黙の要件 (一括確認)

これらの要件はテストから推測され、コアなビジネスルールのようです:

1. [暗黙] 口座は一意の顧客ID を持つ（作成後は不変）
2. [暗黙] 残高は常に非負（決して0未満にならない）
3. [暗黙] 入金額は正の数（ゼロや負の数はない）
4. [暗黙] トランザクションは時間順（後の方がより早い前の方の後）

一括確認（すべて低リスク）:
  4つすべて正しい? [はい / いいえ / 個別に確認]

または個別にY/N:
  1. ___ 2. ___ 3. ___ 4. ___
```

---

## Part 3: Surfacing Missing Specs

### Pattern 3A: "Code Doesn't Handle This" Discovery

**English:**
```
MISSING SPEC: {Title}

The code does NOT currently handle:
{What the code explicitly fails to address}

Should the specification include this?
  (a) Yes, the spec should require it—here's what should happen: [user specifies]
  (b) No, this is out of scope for now
  (c) Maybe—I need to understand more about [user's question]
  (d) I need time to think about this
```

**Japanese:**
```
欠落した仕様: {タイトル}

現在のコードが処理しないもの:
{コードが明確に対応していないもの}

仕様にこれを含めるべきですか?
  (a) はい、仕様がそれを要求すべき - これが起こるべき: [ユーザーが記入]
  (b) いいえ、現在のところ範囲外
  (c) 多分 - [ユーザーの質問]についてもっと理解する必要がある
  (d) これについて考える時間がほしい
```

**Example - Concurrent Request Handling:**

English:
```
MISSING SPEC: Concurrent request safety

The code does NOT currently:
- Use locks or synchronization
- Define what happens if two threads call withdraw() on the same account

Should the specification include concurrency guarantees?
  (a) Yes, it must be thread-safe—define this behavior: [user specifies]
  (b) No, we guarantee single-threaded environment
  (c) Maybe—I need to understand what scenarios concern you
  (d) I need to think about our architecture first
```

Japanese:
```
欠落した仕様: 並行リクエストの安全性

現在のコードが処理していないもの:
- ロックまたは同期メカニズムを使用していない
- 2つのスレッドが同じ口座のwithdraw()を呼び出した場合の動作が定義されていない

仕様に並行性の保証を含めるべきですか?
  (a) はい、スレッドセーフであるべき - この動作を定義: [ユーザーが記入]
  (b) いいえ、シングルスレッド環境を保証する
  (c) 多分 - あなたが心配するシナリオをもっと理解したい
  (d) まず架空について考える必要がある
```

### Pattern 3B: "Feature Mentioned But Not Implemented" Discovery

**English:**
```
MISSING SPEC: {Feature title}

Your requirements mention {feature} but the code doesn't implement it.

Current status:
- Requirements doc says: "{quote}"
- Code: {What code actually does}
- Comments: {What code says about this feature}

Should we add this feature to the spec?
  (a) Yes, we should implement it—it should work like: [user specifies]
  (b) No, that requirement was old—we don't need it anymore
  (c) Maybe—help me understand the business case
  (d) I need to check with stakeholders first
```

**Japanese:**
```
欠落した仕様: {機能タイトル}

あなたの要件は{機能}を述べていますが、コードはそれを実装していません。

現在の状態:
- 要件ドキュメント: "{引用}"
- コード: {コードが実際にすることは}
- コメント: {この機能についてコードが言うこと}

この機能を仕様に追加すべきですか?
  (a) はい、実装すべき - こう動作すべき: [ユーザーが記入]
  (b) いいえ、その要件は古かった - もう必要ない
  (c) 多分 - ビジネスケースをもっと理解したい
  (d) まずステークホルダーに確認する必要がある
```

**Example - Audit Logging:**

English:
```
MISSING SPEC: Audit logging

Your requirements mention "All operations must be logged for compliance"
but the code has no logging.

Current status:
- Requirements: "Audit trail required for all financial operations"
- Code: No logging implemented
- Comments: "TODO: Add logging in v2"

Should we add audit logging to the spec?
  (a) Yes, implement it now—here's what should be logged: [user specifies]
  (b) No, that's a v2 feature—not for MVP
  (c) Maybe—which operations are most important to log?
  (d) I need to check compliance requirements first
```

Japanese:
```
欠落した仕様: 監査ログ

あなたの要件は「すべての操作はコンプライアンスのためにログされなければならない」と述べていますが、
コードにはロギングがありません。

現在の状態:
- 要件: 「すべての金融操作の監査証跡が必須」
- コード: ロギング実装なし
- コメント: 「TODO: v2でロギングを追加」

仕様に監査ログを追加すべきですか?
  (a) はい、今すぐ実装 - これを記録すべき: [ユーザーが記入]
  (b) いいえ、それはv2機能 - MVPではない
  (c) 多分 - どの操作をログするのが最も重要ですか?
  (d) まずコンプライアンス要件を確認する必要がある
```

---

## Part 4: Handling "I'm Not Sure" Responses

### Pattern 4A: Uncertainty About Intended Behavior

When user answers "(d) I'm not sure / I'm uncertain":

**English:**
```
I'm marking this as [UNRESOLVED] for now.

Let me ask a different way that might help:

[Choose one of the follow-up options below based on context]
```

**Japanese:**
```
これを現在のところ[未解決]として記録します。

別の方法で質問させてください:

[文脈に基づいて、以下のフォローアップオプションの1つを選択]
```

**Follow-up Option A: Ask for Examples**

English:
```
Can you think of a concrete example where this matters?
For instance:
- "When would this behavior cause problems?"
- "What's a real scenario where this applies?"
- "What would you see in production if this went wrong?"
```

Japanese:
```
これが重要な具体的な例を思い浮かべることができますか?
例えば:
- 「この動作がどんな問題を引き起こしますか?」
- 「これが適用される実際のシナリオはなんですか?」
- 「これが間違ったら本番環境で何が見えますか?」
```

**Follow-up Option B: Ask for Deferral**

English:
```
No problem. Do you want to:
  (a) Keep the code as-is for now, and revisit this later?
  (b) Flag this for stakeholder discussion before we finalize the spec?
  (c) Mark it as tech debt and move on?
  (d) Explore it more right now?
```

Japanese:
```
問題ありません。あなたは以下のどちらを望みますか:
  (a) 今のところコードを保持し、後で再検討する?
  (b) 仕様を最終化する前に、ステークホルダー討議をもフラグする?
  (c) テック債としてマークして進む?
  (d) 今すぐもっと探索する?
```

**Follow-up Option C: Propose a Default**

English:
```
Here's my suggestion: Let's implement the behavior as the code
currently does, and mark this as a "revisit" item.

If this causes problems later in testing or production, we'll know
to address it. Fair?

(This approach prevents analysis paralysis while keeping the question
open for future refinement.)
```

Japanese:
```
私の提案は: コードが現在すると同様に動作を実装し、これを「再確認」
アイテムとしてマークしましょう。

これがテストまたは本番環境で後に問題を引き起こした場合、
対処する必要があることがわかります。同意しますか?

（このアプローチは分析パラライシスを防ぎながら、質問を将来の改善のために開くままにします。）
```

---

## Part 5: Surfacing Hidden Assumptions

### Pattern 5A: "You Assumed X, Right?"

When you notice implicit assumption in tests or comments:

**English:**
```
I'm noticing something in the tests that suggests an assumption
you might not have articulated:

Tests assume: {assumption}
Code enforces: {how code enforces it}

Is this correct, or is the assumption different from what
the code implements?
```

**Japanese:**
```
あなたが言及していないかもしれない仮定を示唆するテストに何かを
注目しています:

テストが仮定するもの: {仮定}
コードが実装するもの: {コードがそれを実装する方法}

これは正しいですか、それとも仮定はコードが実装していることと
異なっていますか?
```

**Example - Resource Limits:**

English:
```
I'm noticing the code enforces a hard limit on account balances:
maximum_balance = 1,000,000.

Tests never exceed this, which suggests it's an intentional constraint.

Is this correct, or is it:
  (a) Yes, intentional—accounts can't hold more than $1M
  (b) No, it's just a test limit—we have no max in production
  (c) It's more nuanced: [user explains real constraint]
  (d) I'm not sure
```

Japanese:
```
コードが口座残高に厳しい制限を実装していることに気づきます:
maximum_balance = 1,000,000.

テストはこれを決して超えず、それは意図的な制約を示唆します。

これは正しいですか、それとも:
  (a) はい、意図的 - 口座は$1Mを超える保有はできない
  (b) いいえ、それはテスト制限だった - 本番環境に最大がない
  (c) もっと複雑で: [ユーザーが説明]
  (d) わかりません
```

### Pattern 5B: "What About Scenario X?"

Probe for edge cases user might not have considered:

**English:**
```
Let me check my understanding with an edge case:

Scenario: {Specific situation}
Current code does: {What happens}

Is this the intended behavior, or should it be different?
```

**Japanese:**
```
エッジケースで私の理解を確認させてください:

シナリオ: {具体的な状況}
現在のコードは: {何が起こるか}

これは意図された動作ですか、それとも異なるべきですか?
```

**Example - Negative Inputs:**

English:
```
Let me check my understanding with an edge case:

Scenario: User calls deposit(-100)
Current code: Throws "invalid amount" exception immediately

Is this the intended behavior, or should negative deposits be
handled differently?
```

Japanese:
```
エッジケースで私の理解を確認させてください:

シナリオ: ユーザーがdeposit(-100)を呼び出す
現在のコード: 「無効な金額」例外をすぐにスロー

これは意図された動作ですか、それとも負の入金を異なるように
処理すべきですか?
```

---

## Part 6: Dealing with Conflicting Requirements

### Pattern 6A: Direct Conflict Detection

**English:**
```
CONFLICT DETECTED

Earlier, you indicated:
- Finding #2: {Original answer}

But now you're suggesting:
- Finding #N: {New answer}

These seem to contradict. Can you clarify what should actually happen?
```

**Japanese:**
```
矛盾が検出されました

以前、あなたは以下を示唆しました:
- Finding #2: {元の回答}

しかし今、あなたは以下を示唆しています:
- Finding #N: {新しい回答}

これらは矛盾しているようです。実際に何が起こるべきか説明してもらえますか?
```

**Example - Refund Logic:**

English:
```
CONFLICT DETECTED

Earlier, you said:
- Finding #2: "Refunds must always succeed, even if no transaction record"

But now you're saying:
- Finding #8: "Refunds should fail if original transaction doesn't exist"

These contradict. What's the true business rule?
```

Japanese:
```
矛盾が検出されました

以前、あなたは言いました:
- Finding #2: 「取引記録がなくても払い戻しは常に成功すべき」

しかし今、あなたは言っています:
- Finding #8: 「元の取引が存在しない場合、払い戻しは失敗すべき」

これらは矛盾しています。真のビジネスルールは何ですか?
```

### Pattern 6B: Nuance Exploration

If answer suggests nuance (not a direct conflict):

**English:**
```
I'm hearing nuance here. Let me check:

You said: {Statement A}
And also: {Statement B}

These aren't opposite, but they might apply in different contexts.
Is that right?

For example:
- Context 1: {When A applies}
- Context 2: {When B applies}

Is this the right split?
```

**Japanese:**
```
ここでニュアンスを聞いています。確認させてください:

あなたは言いました: {ステートメント A}
そして また: {ステートメント B}

これらは反対ではありませんが、異なる文脈で適用される可能性があります。
これは正しいですか?

例えば:
- 文脈 1: {Aが適用される場合}
- 文脈 2: {Bが適用される場合}

これが正しい分割ですか?
```

---

## Part 7: Dialogue Flow Examples

### Complete Example 1: Single Question → Finding → Classification

**User's Provisional Spec:**
```
withdraw(amount): real +> AccountState
pre: amount > 0
post: if balance >= amount then balance_after = balance_before - amount
```

**Your Question (Pattern 1B):**
```
QUESTION: Insufficient funds behavior

Current code behavior:
When balance < amount, the code throws an InsufficientFundsException.
The balance is NOT changed.

Is this the intended behavior?
  (a) Yes, fail with exception if not enough funds
  (b) No, the operation should proceed regardless (overdraft)
  (c) It's more nuanced: [user specifies]
  (d) I'm not sure
```

**User's Response:**
```
(a) Yes, fail with exception if not enough funds
```

**Your Finding Record:**
```
FINDING #3: Insufficient funds handling
Category: Intentional
Severity: Low

Source: QUESTION: Insufficient funds behavior
User's answer: (a) Yes, fail with exception if not enough funds

Interpretation:
Code correctly implements fail-on-insufficient-funds behavior.
This matches user intent. Can be promoted to [CONFIRMED].

Recommended action:
Promote in confirmed spec:
  "withdraw pre-condition includes: balance >= amount"
  Mark as [CONFIRMED by user, Finding #3]
```

### Complete Example 2: Missing Spec → Discovery → Finding

**Your Question (Pattern 3A):**
```
MISSING SPEC: Concurrent withdraw safety

The code does NOT currently:
- Define behavior when two threads call withdraw() simultaneously on same account
- Use locks or synchronization primitives

Should the specification include concurrency guarantees?
  (a) Yes, it must be thread-safe: [user specifies how]
  (b) No, single-threaded environment is guaranteed
  (c) Maybe—explain what scenarios concern you
  (d) I need to think about this
```

**User's Response:**
```
(a) Yes, it must be thread-safe. Here's what we need:
"If two concurrent withdrawals are requested, exactly one should succeed.
The second should fail with 'account locked' error or retry logic."
```

**Your Finding Record:**
```
FINDING #7: Concurrent withdraw safety (Spec Gap)
Category: Spec Gap
Severity: High

Source: MISSING SPEC: Concurrent withdraw safety
User's answer: (a) Requires thread-safety with serialization

Interpretation:
Current code has no concurrency protection. User requires that:
- Concurrent withdraw calls be serialized
- One succeeds, others fail or retry

This is a spec gap requiring code addition.

Recommended action:
Add new operation variant or invariant:
  "Invariant: Only one withdraw() call can modify balance at a time"
Add implementation notes:
  "Use mutex lock on account.balance"
Priority: High (required for production use)
```

---

## Part 8: Efficiency Tips

### Batch When Safe, Question When Risky

**Safe to batch:**
- Data validation constraints (non-null, min/max, type checks)
- Simple invariants (balance >= 0, ID is unique)
- Low-risk edge cases (empty list handling)

**Always question individually:**
- Error handling logic
- Concurrency or timing behavior
- Business rule conflicts
- Features mentioned but not implemented

### Question Prioritization

Ask in this order for efficiency:

1. **[QUESTION] items first** (code seems wrong)
2. **[MISSING] items second** (biggest spec gaps)
3. **[IMPLICIT] items third** (in batches of 3-5)
4. **[PROVISIONAL] items last** (bulk confirm obvious ones)

### Pacing Rule

- Never ask more than 5 items per round
- Alternate between hard questions (Q) and easy confirmations (P)
- Show progress: "That's 8 of 12 items resolved"

### Use "I'm Recording This" to Build Confidence

After each answer, say:
```
I'm recording this as Finding #N: {Title}
Classification: {Bug/Spec Gap/Intentional/Debt}

Moving to the next item...
```

This helps user see their input is being captured and valued.

---

## Summary: Dialogue Pattern Checklist

Before asking each question:
- [ ] Question type identified (QUESTION / IMPLICIT / MISSING / PROVISIONAL)
- [ ] Bilingual presentation ready (EN + JP)
- [ ] Multiple choice options provided (a/b/c/d)
- [ ] Concrete example or test case included
- [ ] "I don't know" option available
- [ ] Pacing appropriate (not asking too many at once)

After user answers:
- [ ] Response recorded as Finding
- [ ] Classification assigned (Bug/Spec Gap/Intentional/Debt)
- [ ] Provenance noted
- [ ] Recommended action clear
- [ ] User sees response was understood

This ensures dialogue is clear, bilingual, and drives toward convergence efficiently.
