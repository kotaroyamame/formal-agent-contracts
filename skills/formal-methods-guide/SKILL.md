---
name: formal-methods-guide
description: >
  VDM-SLと形式手法の参考知識を提供する。「VDM-SLの文法」「型の書き方」「事前条件とは」
  「不変条件とは」「証明責務（PO）の意味」「形式手法とは何か」「形式的仕様記述」
  といった質問に使用する。他のスキル（define-contract, verify-spec）からも
  背景知識として参照される。
metadata:
  version: "0.1.0"
---

# 形式手法ガイド

形式手法やVDM-SLに関する質問に対し、開発者が理解しやすい言葉で説明する。
専門用語を使う場合は必ず平易な説明を添える。

## 形式手法の3つの柱

形式手法は大きく3つの分野に分かれる:

1. **形式的仕様記述** — システムの振る舞いを数学的に記述する（VDM-SL, TLA+, B-Method, Z）
2. **モデル検査** — 状態空間を網羅的に探索して性質を検証する（SPIN, NuSMV, TLA+）
3. **定理証明** — 論理的な推論で性質を証明する（Coq, Isabelle/HOL, Lean）

本プラグインは**形式的仕様記述**、特にVDM-SLを中心に扱う。

## VDM-SLの基本概念

### 型（Types）
VDM-SLの型システムは、エージェント間の契約で「何を受け渡すか」を厳密に定義する基盤。

基本型:
- `nat` — 0以上の自然数、`nat1` — 1以上の自然数
- `int` — 整数、`real` — 実数
- `bool` — 真偽値
- `char` — 文字、`token` — 抽象トークン

複合型:
- `seq of T` — Tのシーケンス（リスト）、`seq1 of T` — 非空シーケンス
- `set of T` — Tの集合
- `map K to V` — KからVへの写像（辞書/マップ）
- レコード型 — `T :: field1 : Type1  field2 : Type2` で構造体を定義

### 不変条件（Invariant）
型や状態に対して「常に成り立つべき条件」を宣言する。

```vdm-sl
types
  Age = nat
  inv a == a <= 150;
```

これは「年齢は0以上150以下」という制約。型を使うすべての箇所でこの条件が自動的に検証対象になる。

### 事前条件（Pre-condition）と事後条件（Post-condition）
関数や操作に対して「呼び出し側の責任」と「実装側の保証」を定義する。

```vdm-sl
functions
  divide: real * real -> real
  divide(a, b) == a / b
  pre b <> 0
  post RESULT * b = a;
```

- `pre` — この関数を呼ぶ側が満たすべき条件（bは0でない）
- `post` — 関数が返す結果が満たすべき条件（結果×b＝a）

### 状態（State）
操作（operation）が読み書きする可変状態を定義する。

```vdm-sl
state SystemState of
  users : map UserId to User
  nextId : UserId
inv mk_SystemState(users, nextId) == nextId not in set dom users
init s == s = mk_SystemState({|->}, 1)
end
```

## 証明責務（Proof Obligation）の種類

VDMJが生成する主要なPO種別と、開発者向けの平易な説明:

| PO種別 | 意味 | 開発者向け説明 |
|--------|------|---------------|
| subtype | 値が型の制約を満たすか | 「この値は本当にこの型に入る？」 |
| invariant satisfiability | 不変条件を満たす値が存在するか | 「この制約は厳しすぎて何も入らない、ということはない？」 |
| map apply | 写像適用のキーが存在するか | 「このキーでmapを引けることは保証されてる？」 |
| total function | 関数の事前/事後/不変条件が正しく評価できるか | 「この条件自体がエラーにならない？」 |
| func post condition | 関数が事後条件を満たすか | 「この関数は約束通りの結果を返す？」 |
| operation postcondition | 操作が事後条件を満たすか | 「この操作は約束通りに状態を変更する？」 |
| state invariant | 操作後も状態不変条件が維持されるか | 「操作した後もシステムの整合性は保たれる？」 |
| map compatible | 写像結合時に重複キーの値が一致するか | 「2つのmapを合体させるとき、同じキーに違う値が入ってない？」 |

## マルチエージェント開発における形式手法の役割

エージェント間の契約を形式的に定義することで:

1. **曖昧さの排除** — 「ユーザー情報を返す」ではなく、型・制約・条件を明示
2. **自動検証** — 契約違反を実行前に検出（PO生成→検証）
3. **責任の明確化** — 事前条件＝呼び出し側の責任、事後条件＝実装側の保証
4. **段階的詳細化** — 抽象仕様から具体実装へ、各段階で整合性を保証

## 詳細リファレンス

より詳しい内容は `references/` ディレクトリを参照:
- `references/vdm-sl-syntax.md` — VDM-SL構文の完全リファレンス
- `references/po-types-detail.md` — 全38種のPO種別の詳細解説
