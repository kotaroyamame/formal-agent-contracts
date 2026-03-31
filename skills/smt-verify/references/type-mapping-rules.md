# VDM-SL → SMT-LIB Type Mapping Rules

VDM-SL → SMT-LIB 型マッピングルール

## Important: SMT-LIB Syntax Notes

SMT-LIB構文の注意事項

1. **Write `(set-logic ALL)` at the beginning of the file** — required to combine string, array, and integer theories

   ファイル冒頭に `(set-logic ALL)` を記述する — 文字列理論・配列理論・整数理論を併用するため

2. **Parenthesis structure of `declare-datatypes`** — constructor lists require double parentheses:

   `declare-datatypes`の括弧構造 — コンストラクタリストには二重括弧が必要:
   ```smt-lib
   ; Correct: wrap constructor list in (( ... ))
   ; 正しい: (( ... )) でコンストラクタリストを囲む
   (declare-datatypes ((TypeName 0))
     (((CtorName (field1 Sort1) (field2 Sort2)))))

   ; Wrong: one layer of parentheses missing
   ; 間違い: 括弧が1段足りない
   (declare-datatypes ((TypeName 0))
     ((CtorName (field1 Sort1) (field2 Sort2))))
   ```

3. **Avoid selector name collisions** — prefix selectors that may collide with Z3 built-in functions (e.g., `name` → `user_name`)

   セレクタ名の衝突回避 — Z3組込み関数と衝突する可能性のあるセレクタ名にはプレフィックスを付与

## Basic Types / 基本型

| VDM-SL Type | SMT-LIB Sort | Additional Constraints / 追加制約 |
|-------------|-------------|----------------------------------|
| `bool` | `Bool` | None / なし |
| `nat` | `Int` | `(>= x 0)` |
| `nat1` | `Int` | `(>= x 1)` |
| `int` | `Int` | None / なし |
| `real` | `Real` | None / なし |
| `char` | `Int` | `(and (>= x 0) (<= x 1114111))` — Unicode code point |
| `token` | Uninterpreted sort / 未解釈ソート | `(declare-sort Token 0)` |

### Example: nat variable declaration / nat型の変数宣言
```
VDM-SL: forall x : nat & ...
SMT-LIB: (forall ((x Int)) (=> (>= x 0) ...))
```

### Example: nat1 variable declaration / nat1型の変数宣言
```
VDM-SL: forall x : nat1 & ...
SMT-LIB: (forall ((x Int)) (=> (>= x 1) ...))
```

## Record Types → SMT-LIB Datatypes / レコード型

```
VDM-SL:
  User :: name  : seq1 of char
          email : seq1 of char
          age   : nat
  inv u == u.age <= 150;

SMT-LIB:
  (declare-datatypes ((User 0))
    (((mk_User (user_name String) (user_email String) (age Int)))))

  (define-fun inv_User ((u User)) Bool
    (and
      (>= (age u) 0)         ; nat constraint / nat制約
      (<= (age u) 150)       ; invariant / 不変条件
      (> (str.len (user_name u)) 0)   ; seq1 constraint / seq1制約
      (> (str.len (user_email u)) 0)  ; seq1 constraint / seq1制約
    ))
```

- Record constructor `mk_User(...)` → SMT-LIB datatype constructor `(mk_User ...)`
- Field access `u.name` → datatype selector `(user_name u)`
- **Note**: Prefix selectors like `name` that may collide with Z3 built-ins with `user_` etc.
- Invariants are defined as `inv_TypeName` using `define-fun`

- レコードコンストラクタ → SMT-LIBのdatatypeコンストラクタ
- フィールドアクセス → datatypeセレクタ
- 衝突回避のためプレフィックスを付与
- 不変条件は `inv_TypeName` として `define-fun` で定義

## seq of char (String Type) / 文字列型

```
VDM-SL: seq of char
SMT-LIB: String

VDM-SL: seq1 of char
SMT-LIB: String  + constraint: (> (str.len s) 0)
```

String operations / 文字列操作:
| VDM-SL | SMT-LIB |
|--------|---------|
| `len s` | `(str.len s)` |
| `s1 ^ s2` | `(str.++ s1 s2)` |

## seq of T (General Sequence Type) / 一般シーケンス型

General sequences are not directly supported in standard SMT-LIB theories; encode using Array theory.

一般シーケンスはSMT-LIBの標準理論では直接サポートされないため、Array理論でエンコードする。

```
SMT-LIB:
  ; Represent sequence as (length, element array) pair
  ; シーケンスを (長さ, 要素配列) のペアとして表現
  (declare-sort Seq_T 0)
  (declare-fun seq_len (Seq_T) Int)
  (declare-fun seq_elem (Seq_T Int) T)  ; 1-indexed

  ; seq1 constraint / seq1制約
  (assert (> (seq_len s) 0))
```

Sequence operations / シーケンス操作:
| VDM-SL | SMT-LIB |
|--------|---------|
| `len s` | `(seq_len s)` |
| `s(i)` | `(seq_elem s i)` |
| `hd s` | `(seq_elem s 1)` |
| `elems s` | Requires conversion to set / 集合への変換が必要 |

## set of T (Set Type) / 集合型

```
SMT-LIB:
  ; Represent set as characteristic function
  ; 集合を特性関数として表現
  (define-sort Set_T () (Array T Bool))

  ; Membership / 要素の所属
  ; e in set S  →  (select S e)
  ; e not in set S  →  (not (select S e))
```

Set operations / 集合操作:
| VDM-SL | SMT-LIB |
|--------|---------|
| `e in set S` | `(select S e)` |
| `e not in set S` | `(not (select S e))` |
| `S1 union S2` | Per-element `or`: `(lambda ((x T)) (or (select S1 x) (select S2 x)))` |
| `S1 inter S2` | Per-element `and` |
| `S1 \ S2` | `(lambda ((x T)) (and (select S1 x) (not (select S2 x))))` |
| `S1 subset S2` | `(forall ((x T)) (=> (select S1 x) (select S2 x)))` |
| `card S` | Finite set cardinality — difficult to express directly; approximate with auxiliary variables / 直接表現困難、補助変数で近似 |

## map K to V (Map Type) / 写像型

Maps are encoded using Array theory + Option pattern.

写像はArray理論 + Optionパターンでエンコードする。

```
SMT-LIB:
  ; Represent map as (element array, domain set) pair
  ; 写像を (要素配列, 定義域集合) のペアとして表現
  (declare-sort Map_K_V 0)
  (declare-fun map_apply (Map_K_V K) V)
  (declare-fun map_dom (Map_K_V) (Array K Bool))

  ; m(k)  →  (map_apply m k)
  ;           precondition: (select (map_dom m) k)
  ; dom m  →  (map_dom m)
  ; k in set dom m  →  (select (map_dom m) k)
```

Map operations / 写像操作:
| VDM-SL | SMT-LIB |
|--------|---------|
| `m(k)` | `(map_apply m k)` |
| `dom m` | `(map_dom m)` |
| `rng m` | Requires explicit encoding / 明示的なエンコーディングが必要 |
| `k in set dom m` | `(select (map_dom m) k)` |
| `m1 munion m2` | See below / 下記参照 |
| `m ++ {k \|-> v}` | See below / 下記参照 |
| `{k \|-> v}` (literal) | See below / 下記参照 |

### munion Encoding / munionのエンコーディング

```
VDM-SL: m1 munion m2
SMT-LIB:
  ; Result map domain / 結果写像の定義域
  (= (map_dom result)
     (lambda ((k K)) (or (select (map_dom m1) k) (select (map_dom m2) k))))
  ; Result map values (compatibility assumed, not m2-priority)
  ; 結果写像の値（互換性が前提）
  (forall ((k K))
    (=> (select (map_dom m1) k) (= (map_apply result k) (map_apply m1 k))))
  (forall ((k K))
    (=> (and (select (map_dom m2) k) (not (select (map_dom m1) k)))
        (= (map_apply result k) (map_apply m2 k))))
```

### Map Literal Encoding / 写像リテラルのエンコーディング

```
VDM-SL: {uid |-> mk_User(name, email, 0)}
SMT-LIB:
  (declare-const lit_map Map_UserId_User)
  ; Domain is uid only / 定義域は uid のみ
  (assert (forall ((k Int))
    (= (select (map_dom lit_map) k) (= k uid))))
  ; Value / 値
  (assert (= (map_apply lit_map uid) (mk_User name email 0)))
```

### Map Override (++) Encoding / 写像上書きのエンコーディング

```
VDM-SL: m ++ {k |-> v}
SMT-LIB:
  ; Domain: original domain + new key
  ; 定義域: 元の定義域 + 新しいキー
  (= (map_dom result)
     (lambda ((x K)) (or (select (map_dom m) x) (= x k))))
  ; Value: new value for k, original otherwise
  ; 値: kなら新しい値、それ以外は元の値
  (forall ((x K))
    (= (map_apply result x)
       (ite (= x k) v (map_apply m x))))
```

## Union Type / 合併型

```
VDM-SL: nat | bool
SMT-LIB:
  (declare-datatypes ((Union_nat_bool 0))
    (((union_nat (union_nat_val Int))
      (union_bool (union_bool_val Bool)))))
```

## Optional Type / オプション型

```
VDM-SL: [nat]  -- nat or nil / nat または nil
SMT-LIB:
  (declare-datatypes ((Option_nat 0))
    (((some_nat (option_val Int))
      (none_nat))))
```
