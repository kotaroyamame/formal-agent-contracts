# VDM-SL → SMT-LIB Expression Mapping Rules

VDM-SL → SMT-LIB 式マッピングルール

## Logical Operators / 論理演算子

| VDM-SL | SMT-LIB |
|--------|---------|
| `P and Q` | `(and P Q)` |
| `P or Q` | `(or P Q)` |
| `not P` | `(not P)` |
| `P => Q` | `(=> P Q)` |
| `P <=> Q` | `(= P Q)` |

## Arithmetic Operators / 算術演算子

| VDM-SL | SMT-LIB | Notes / 備考 |
|--------|---------|-------------|
| `a + b` | `(+ a b)` | |
| `a - b` | `(- a b)` | |
| `a * b` | `(* a b)` | |
| `a / b` | `(/ a b)` | Real division / 実数除算 |
| `a div b` | `(div a b)` | Integer division / 整数除算 |
| `a mod b` | `(mod a b)` | |
| `a ** b` | No direct mapping | Expand small exponents; use uninterpreted function otherwise / 小さい指数は展開、それ以外は未解釈関数 |
| `abs a` | `(ite (>= a 0) a (- a))` | |

## Comparison Operators / 比較演算子

| VDM-SL | SMT-LIB |
|--------|---------|
| `a = b` | `(= a b)` |
| `a <> b` | `(not (= a b))` |
| `a < b` | `(< a b)` |
| `a <= b` | `(<= a b)` |
| `a > b` | `(> a b)` |
| `a >= b` | `(>= a b)` |

## Quantified Expressions / 量化式

### forall (Universal Quantification / 全称量化)

```
VDM-SL: forall x : T & P(x)
SMT-LIB: (forall ((x T_smt)) (=> type_constraint(x) P_smt(x)))
```

- `T_smt` is converted according to the type mapping rules / 型マッピングルールに従って変換
- `type_constraint(x)` is the type's constraint (nat → `(>= x 0)`, record → `inv_T(x)`, etc.) / 型の制約
- When no type binding constraints exist (int, bool, etc.), `=>` can be omitted / 型バインドの制約がない場合は `=>` を省略可能

### exists (Existential Quantification / 存在量化)

```
VDM-SL: exists x : T & P(x)
SMT-LIB: (exists ((x T_smt)) (and type_constraint(x) P_smt(x)))
```

Note: `forall` uses `=>` while `exists` uses `and`. This is the logically correct expansion.

注意: `forall` では `=>` を使い、`exists` では `and` を使う。これは論理的に正しい展開。

### Set-Bound Quantification / 集合バインドの量化

```
VDM-SL: forall x in set S & P(x)
SMT-LIB: (forall ((x T)) (=> (select S x) P_smt(x)))

VDM-SL: exists x in set S & P(x)
SMT-LIB: (exists ((x T)) (and (select S x) P_smt(x)))
```

## Let Expressions / let式

```
VDM-SL: let x : T = e1 in e2
SMT-LIB: (let ((x e1_smt)) e2_smt)
```

When type constraints are needed / 型制約が必要な場合:
```
VDM-SL: let x : nat1 = e1 in e2
SMT-LIB: (let ((x e1_smt)) (=> (>= x 1) e2_smt))
```

However, in PO let expressions, variables are usually bound to concrete values, so adding type constraints is often unnecessary.

ただしPOのlet式では通常、変数の値が具体的に束縛されるため型制約の追加は不要な場合が多い。

## Record Pattern Matching / レコードパターンマッチ

VDMJ POs use record patterns in forall bindings:

VDMJのPOではforall束縛でレコードパターンが使われる:

```
VDM-SL: forall mk_UserDB(users, nextId) : UserDB & P
SMT-LIB:
  (forall ((db UserDB))
    (=> (inv_UserDB db)
        (let ((users (users db)) (nextId (nextId db)))
          P_smt)))
```

Procedure / 手順:
1. Convert pattern `mk_R(f1, f2, ...)` to a single variable `r : R` / パターンを単一変数に変換
2. Bind fields with `let`: `(let ((f1 (f1_selector r)) (f2 (f2_selector r))) ...)` / letでフィールドを束縛
3. Add invariant `inv_R(r)` as antecedent if defined / 不変条件があれば前提に追加

## is_ Expression (Type Test) / is_式（型テスト）

Frequently appears in VDMJ total function POs:

VDMJのtotal function POで頻出:

```
VDM-SL: is_(inv_User(u), bool)
```

Meaning: The evaluation result of `inv_User(u)` is of type bool.
In SMT-LIB, function return types are statically determined, so this kind of PO is usually **trivially satisfied**.

意味: `inv_User(u)` の評価結果がbool型であること。
SMT-LIBでは関数の返り値型が静的に決まるため、通常 **自明に成立** する。

Conversion strategy / 変換方針:
- `is_(f(args), bool)` where `f` is a total function → convert to `true` (trivial) / 全域関数の場合 → `true`
- If `f` contains partial application (map apply, division, etc.) → expand partial application preconditions / 部分適用がある場合 → 事前条件を展開

```
SMT-LIB:
  ; is_(inv_User(u), bool) — confirm inv_User evaluates without error
  ; inv_User(u) == u.age <= 150
  ; u.age is nat → >= 0 guaranteed by type constraint → comparison always returns bool
  ; Therefore: true
  true
```

## pre_f / post_f / inv_T References / 事前条件・事後条件・不変条件の参照

When POs reference pre-conditions, post-conditions, or invariants:

PO内で事前条件・事後条件・不変条件が参照される場合:

```
VDM-SL: pre_findUser(uid, users) => uid in set dom users
```

Conversion strategy / 変換方針:
1. Declare `pre_f(args)` as an uninterpreted function / 未解釈関数として宣言
2. Add definition as an axiom / 定義を公理として追加
3. Convert the PO body / PO本体を変換

```
SMT-LIB:
  ; Pre-condition definition / 事前条件の定義
  (define-fun pre_findUser ((uid Int) (users Map_UserId_User)) Bool
    (select (map_dom users) uid))

  ; PO body / PO本体
  (assert (not
    (forall ((uid Int) (users Map_UserId_User))
      (=> (>= uid 1)    ; nat1 constraint / nat1制約
          (=> (pre_findUser uid users)
              (select (map_dom users) uid))))))
  (check-sat)
```

## Set Comprehension / 集合内包表記

```
VDM-SL: {users(id).email | id in set dom users}
SMT-LIB:
  ; Define result set as characteristic function
  ; 結果集合を特性関数として定義
  (define-fun comprehension ((e String)) Bool
    (exists ((id Int))
      (and (select (map_dom users) id)
           (= e (email (map_apply users id))))))
```

## if-then-else

```
VDM-SL: if P then e1 else e2
SMT-LIB: (ite P e1_smt e2_smt)
```

## cases Expression / cases式

```
VDM-SL:
  cases status:
    <Active>   -> "active",
    <Inactive> -> "inactive",
    others     -> "unknown"
  end

SMT-LIB:
  (ite (= status Active) "active"
    (ite (= status Inactive) "inactive"
      "unknown"))
```
