# VDM-SL → SMT-LIB 型マッピングルール

## 基本型

| VDM-SL型 | SMT-LIBソート | 追加制約 |
|----------|-------------|---------|
| `bool` | `Bool` | なし |
| `nat` | `Int` | `(>= x 0)` |
| `nat1` | `Int` | `(>= x 1)` |
| `int` | `Int` | なし |
| `real` | `Real` | なし |
| `char` | `Int` | `(and (>= x 0) (<= x 1114111))` — Unicodeコードポイント |
| `token` | 未解釈ソート | `(declare-sort Token 0)` |

### 例: nat型の変数宣言
```
VDM-SL: forall x : nat & ...
SMT-LIB: (forall ((x Int)) (=> (>= x 0) ...))
```

### 例: nat1型の変数宣言
```
VDM-SL: forall x : nat1 & ...
SMT-LIB: (forall ((x Int)) (=> (>= x 1) ...))
```

## レコード型 → SMT-LIB datatype

```
VDM-SL:
  User :: name  : seq1 of char
          email : seq1 of char
          age   : nat
  inv u == u.age <= 150;

SMT-LIB:
  (declare-datatypes ((User 0))
    ((mk_User (name String) (email String) (age Int))))

  (define-fun inv_User ((u User)) Bool
    (and
      (>= (age u) 0)         ; nat制約
      (<= (age u) 150)       ; 不変条件
      (> (str.len (name u)) 0)   ; seq1制約
      (> (str.len (email u)) 0)  ; seq1制約
    ))
```

- レコードコンストラクタ `mk_User(...)` → SMT-LIBのdatatypeコンストラクタ `(mk_User ...)`
- フィールドアクセス `u.name` → datatypeセレクタ `(name u)`
- 不変条件は `inv_TypeName` として `define-fun` で定義

## seq of char (文字列型)

```
VDM-SL: seq of char
SMT-LIB: String

VDM-SL: seq1 of char
SMT-LIB: String  ※ (> (str.len s) 0) の制約を追加
```

文字列操作:
| VDM-SL | SMT-LIB |
|--------|---------|
| `len s` | `(str.len s)` |
| `s1 ^ s2` | `(str.++ s1 s2)` |

## seq of T (一般シーケンス型)

一般シーケンスはSMT-LIBの標準理論では直接サポートされていないため、
Array理論でエンコードする。

```
SMT-LIB:
  ; シーケンスを (長さ, 要素配列) のペアとして表現
  (declare-sort Seq_T 0)
  (declare-fun seq_len (Seq_T) Int)
  (declare-fun seq_elem (Seq_T Int) T)  ; 1-indexed

  ; seq1制約
  (assert (> (seq_len s) 0))
```

シーケンス操作:
| VDM-SL | SMT-LIB |
|--------|---------|
| `len s` | `(seq_len s)` |
| `s(i)` | `(seq_elem s i)` |
| `hd s` | `(seq_elem s 1)` |
| `elems s` | 集合への変換が必要（後述） |

## set of T (集合型)

```
SMT-LIB:
  ; 集合を特性関数として表現
  (define-sort Set_T () (Array T Bool))

  ; 要素の所属
  ; e in set S  →  (select S e)
  ; e not in set S  →  (not (select S e))
```

集合操作:
| VDM-SL | SMT-LIB |
|--------|---------|
| `e in set S` | `(select S e)` |
| `e not in set S` | `(not (select S e))` |
| `S1 union S2` | 要素ごとの `or`: `(lambda ((x T)) (or (select S1 x) (select S2 x)))` |
| `S1 inter S2` | 要素ごとの `and` |
| `S1 \ S2` | `(lambda ((x T)) (and (select S1 x) (not (select S2 x))))` |
| `S1 subset S2` | `(forall ((x T)) (=> (select S1 x) (select S2 x)))` |
| `card S` | 有限集合の要素数 — 直接表現困難、補助変数で近似 |

## map K to V (写像型)

写像はArray理論 + Optionパターンでエンコードする。

```
SMT-LIB:
  ; 写像を (要素配列, 定義域集合) のペアとして表現
  (declare-sort Map_K_V 0)
  (declare-fun map_apply (Map_K_V K) V)
  (declare-fun map_dom (Map_K_V) (Array K Bool))

  ; m(k)  →  (map_apply m k)
  ;           事前条件: (select (map_dom m) k)
  ; dom m  →  (map_dom m)
  ; k in set dom m  →  (select (map_dom m) k)
```

写像操作:
| VDM-SL | SMT-LIB |
|--------|---------|
| `m(k)` | `(map_apply m k)` |
| `dom m` | `(map_dom m)` |
| `rng m` | 明示的なエンコーディングが必要 |
| `k in set dom m` | `(select (map_dom m) k)` |
| `m1 munion m2` | 下記参照 |
| `m ++ {k \|-> v}` | 下記参照 |
| `{k \|-> v}` (リテラル) | 下記参照 |

### munion のエンコーディング

```
VDM-SL: m1 munion m2
SMT-LIB:
  ; 結果写像の定義域
  (= (map_dom result)
     (lambda ((k K)) (or (select (map_dom m1) k) (select (map_dom m2) k))))
  ; 結果写像の値（m2が優先ではなく、互換性が前提）
  (forall ((k K))
    (=> (select (map_dom m1) k) (= (map_apply result k) (map_apply m1 k))))
  (forall ((k K))
    (=> (and (select (map_dom m2) k) (not (select (map_dom m1) k)))
        (= (map_apply result k) (map_apply m2 k))))
```

### 写像リテラルのエンコーディング

```
VDM-SL: {uid |-> mk_User(name, email, 0)}
SMT-LIB:
  (declare-const lit_map Map_UserId_User)
  ; 定義域は uid のみ
  (assert (forall ((k Int))
    (= (select (map_dom lit_map) k) (= k uid))))
  ; 値
  (assert (= (map_apply lit_map uid) (mk_User name email 0)))
```

### 写像上書き (++) のエンコーディング

```
VDM-SL: m ++ {k |-> v}
SMT-LIB:
  ; 定義域: 元の定義域 + 新しいキー
  (= (map_dom result)
     (lambda ((x K)) (or (select (map_dom m) x) (= x k))))
  ; 値: kなら新しい値、それ以外は元の値
  (forall ((x K))
    (= (map_apply result x)
       (ite (= x k) v (map_apply m x))))
```

## 合併型（Union Type）

```
VDM-SL: nat | bool
SMT-LIB:
  (declare-datatypes ((Union_nat_bool 0))
    ((union_nat (union_nat_val Int))
     (union_bool (union_bool_val Bool))))
```

## オプション型

```
VDM-SL: [nat]  -- nat または nil
SMT-LIB:
  (declare-datatypes ((Option_nat 0))
    ((some_nat (option_val Int))
     (none_nat)))
```
