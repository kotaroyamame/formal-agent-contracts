---
name: smt-verify
description: >
  VDM-SLの証明責務（PO）をSMT-LIBに変換し、Z3ソルバーで自動検証する。
  「POを証明して」「SMTで検証して」「Z3で確認して」「証明責務を自動検証」
  「仕様が正しいか証明して」「反例を探して」といったリクエストに使用する。
  verify-specスキルでPO生成した後の次のステップとして、またはPO生成と
  SMT検証を一気通貫で行う場合に使用する。
metadata:
  version: "0.2.0"
---

# PO → SMT-LIB 変換と Z3 検証

VDMJが生成した証明責務（PO）をSMT-LIB形式に変換し、Z3で自動検証する。

## 前提条件

### Z3のインストール確認

```bash
which z3 || pip install z3-solver --break-system-packages
```

Z3がない場合はユーザーにインストールを案内する。

### VDMJの準備

verify-specスキルと同じ方法でVDMJ JARを特定する。

## 検証フロー

### Step 1: PO生成

verify-specスキルの手順でPOを生成する。すでにPO出力がある場合はスキップ。

```bash
java -jar <VDMJ_JAR> -vdmsl <files...> -p 2>&1
```

### Step 2: 各POをSMT-LIBに変換

生成された各POについて、以下の手順で変換する。

#### 2a. 型宣言の生成

POに出現するすべての型を走査し、SMT-LIBで宣言する。
変換ルールは `references/type-mapping-rules.md` に従う。

主要な変換:
- `nat` → `Int` + `(>= x 0)` 制約
- `nat1` → `Int` + `(>= x 1)` 制約
- レコード型 → `declare-datatypes` + コンストラクタ/セレクタ
- `seq1 of char` → `String` + `(> (str.len s) 0)` 制約
- `map K to V` → 未解釈ソート + `map_apply`/`map_dom` 関数
- `set of T` → `(Array T Bool)` 特性関数表現

#### 2b. 補助定義の生成

POが参照する不変条件・事前条件・事後条件を `define-fun` で定義:

```smt-lib
(define-fun inv_TypeName ((x TypeSort)) Bool ...)
(define-fun pre_funcName ((arg1 Sort1) ...) Bool ...)
```

不変条件の定義には型制約（nat/nat1のバウンド、seq1の非空制約）も含める。

#### 2c. PO本体の変換

PO式を `references/expression-mapping-rules.md` に従って変換する。

重要なパターン:
- `forall x:T &` → `(forall ((x T_smt)) (=> type_constraint ...))` — 型制約は含意の前件
- `exists x:T &` → `(exists ((x T_smt)) (and type_constraint ...))` — 型制約はandで結合
- `mk_R(f1,f2):R` パターン → 単一変数 + letでフィールド束縛
- `let x = e in body` → `(let ((x e_smt)) body_smt)`
- `is_(e, bool)` → 通常 `true`（全域関数なら自明）

#### 2d. 否定してcheck-sat

SMT-LIBの検証は「否定が充足不能（unsat）なら元の命題はvalid」という反駁法:

```smt-lib
(assert (not <PO_smt>))
(check-sat)
```

### Step 3: Z3で検証実行

変換したSMT-LIBファイルを保存し、Z3で検証する:

```bash
# ファイルに保存
cat > /tmp/po_N.smt2 << 'SMTEOF'
<SMT-LIB内容>
SMTEOF

# Z3で検証
z3 /tmp/po_N.smt2
```

### Step 4: 結果の解釈と報告

Z3の出力を解釈し、ユーザーにわかりやすく報告する。

| Z3出力 | 意味 | ユーザー向け説明 |
|--------|------|----------------|
| `unsat` | 否定が充足不能 → 元のPOはvalid | **証明成功**: この性質は仕様から論理的に導かれます |
| `sat` | 否定が充足可能 → 反例が存在 | **反例発見**: この性質を満たさないケースがあります |
| `unknown` | Z3が判定不能 | **判定不能**: Z3では自動判定できません。仕様の簡略化を検討してください |
| `timeout` | 時間切れ | **タイムアウト**: 検証が時間内に完了しません |

`sat` の場合、Z3にモデル（反例）を出力させる:

```smt-lib
(check-sat)
(get-model)
```

反例を自然言語で説明する。例:
> 反例: name = "", email = "test@example.com", age = 200 のとき、不変条件 age <= 150 に違反します。

### Step 5: 検証サマリー

全PO結果をまとめて報告する:

```
## SMT検証サマリー

| # | 定義名 | PO種別 | Z3結果 | 判定 |
|---|--------|--------|--------|------|
| 1 | User | invariant satisfiability | unsat | 証明成功 |
| 2 | findUser | map apply | unsat | 証明成功 |
| 3 | RegisterUser | state invariant | sat | 反例あり |
| ... | | | | |

証明成功: X/N件
反例あり: Y/N件
判定不能: Z/N件
```

## 変換の優先順位

すべてのPOを一度に変換するのではなく、優先度順に処理する:

1. **invariant satisfiability** — 構造が単純、変換が機械的
2. **state init** — 具体値の等値性、ほぼ自明
3. **total function** — `is_(e, bool)` パターンは通常自明
4. **subtype** — レコード不変条件のチェック
5. **map apply** — 写像理論の基礎
6. **func/op postcondition** — 最も複雑、let式のネストを含む
7. **state invariant** — 状態遷移の追跡が必要
8. **map compatible** — 写像操作の互換性

## 変換できないケースの対処

以下のケースでは変換を断念し、その旨を報告する:

- **高階関数**: SMT-LIBは第一階論理のため、関数を値として渡すパターンは非対応
- **再帰関数の停止性**: SMTソルバーの守備範囲外
- **無限集合/シーケンスの基数**: `card` 演算は有限集合でも近似が必要
- **パターンマッチの網羅性**: cases式の網羅性はSMTよりVDMJのチェッカーが適切

変換不可の場合は:
1. POの自然言語説明を提供（verify-specスキルの解説）
2. 手動検証のヒントを提示
3. 仕様の簡略化案を提案

## 詳細リファレンス

- `references/type-mapping-rules.md` — 型の変換ルール一覧
- `references/expression-mapping-rules.md` — 式の変換ルール一覧
- `references/conversion-examples.md` — 実際のPOの変換例（Z3検証済み）
