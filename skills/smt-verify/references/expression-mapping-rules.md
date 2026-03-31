# VDM-SL → SMT-LIB 式マッピングルール

## 論理演算子

| VDM-SL | SMT-LIB |
|--------|---------|
| `P and Q` | `(and P Q)` |
| `P or Q` | `(or P Q)` |
| `not P` | `(not P)` |
| `P => Q` | `(=> P Q)` |
| `P <=> Q` | `(= P Q)` |

## 算術演算子

| VDM-SL | SMT-LIB |
|--------|---------|
| `a + b` | `(+ a b)` |
| `a - b` | `(- a b)` |
| `a * b` | `(* a b)` |
| `a / b` | `(/ a b)` (real除算) |
| `a div b` | `(div a b)` (整数除算) |
| `a mod b` | `(mod a b)` |
| `a ** b` | 直接対応なし — 小さい指数は展開、それ以外は未解釈関数 |
| `abs a` | `(ite (>= a 0) a (- a))` |

## 比較演算子

| VDM-SL | SMT-LIB |
|--------|---------|
| `a = b` | `(= a b)` |
| `a <> b` | `(not (= a b))` |
| `a < b` | `(< a b)` |
| `a <= b` | `(<= a b)` |
| `a > b` | `(> a b)` |
| `a >= b` | `(>= a b)` |

## 量化式

### forall（全称量化）

```
VDM-SL: forall x : T & P(x)
SMT-LIB: (forall ((x T_smt)) (=> type_constraint(x) P_smt(x)))
```

- `T_smt` は型マッピングルールに従って変換
- `type_constraint(x)` は型の制約（nat→`(>= x 0)`, レコード→`inv_T(x)` など）
- 型バインドの制約がない場合（int, boolなど）は `=>` を省略可能

### exists（存在量化）

```
VDM-SL: exists x : T & P(x)
SMT-LIB: (exists ((x T_smt)) (and type_constraint(x) P_smt(x)))
```

注意: `forall` では `=>` を使い、`exists` では `and` を使う。これは論理的に正しい展開。

### 集合バインドの量化

```
VDM-SL: forall x in set S & P(x)
SMT-LIB: (forall ((x T)) (=> (select S x) P_smt(x)))

VDM-SL: exists x in set S & P(x)
SMT-LIB: (exists ((x T)) (and (select S x) P_smt(x)))
```

## let式

```
VDM-SL: let x : T = e1 in e2
SMT-LIB: (let ((x e1_smt)) e2_smt)
```

型制約が必要な場合:
```
VDM-SL: let x : nat1 = e1 in e2
SMT-LIB: (let ((x e1_smt)) (=> (>= x 1) e2_smt))
```

ただしPOのlet式では通常、変数の値が具体的に束縛されるため型制約の追加は不要な場合が多い。

## レコードパターンマッチ

VDMJのPOではforall束縛でレコードパターンが使われる:

```
VDM-SL: forall mk_UserDB(users, nextId) : UserDB & P
SMT-LIB:
  (forall ((db UserDB))
    (=> (inv_UserDB db)
        (let ((users (users db)) (nextId (nextId db)))
          P_smt)))
```

手順:
1. パターン `mk_R(f1, f2, ...)` を単一変数 `r : R` に変換
2. `let` で各フィールドを束縛: `(let ((f1 (f1_selector r)) (f2 (f2_selector r))) ...)`
3. 不変条件があれば `inv_R(r)` を前提に追加

## is_ 式（型テスト）

VDMJのtotal function POで頻出:

```
VDM-SL: is_(inv_User(u), bool)
```

意味: `inv_User(u)` の評価結果がbool型であること。
SMT-LIBでは関数の返り値型が静的に決まるため、この種のPOは通常 **自明に成立** する。

変換方針:
- `is_(f(args), bool)` で `f` が全域関数の場合 → `true` に変換（自明）
- `f` の内部で部分適用（map適用、除算など）がある場合 → 部分適用の事前条件を展開

```
SMT-LIB:
  ; is_(inv_User(u), bool) — inv_User内でエラーが起きないことを確認
  ; inv_User(u) == u.age <= 150
  ; u.age はnat → >= 0 は型制約で保証 → 比較演算は常にboolを返す
  ; よって: true
  true
```

## pre_f / post_f / inv_T 参照

PO内で事前条件・事後条件・不変条件が参照される場合:

```
VDM-SL: pre_findUser(uid, users) => uid in set dom users
```

変換方針:
1. `pre_f(args)` を未解釈関数として宣言
2. 定義を公理として追加
3. PO本体を変換

```
SMT-LIB:
  ; 事前条件の定義
  (define-fun pre_findUser ((uid Int) (users Map_UserId_User)) Bool
    (select (map_dom users) uid))

  ; PO本体
  (assert (not
    (forall ((uid Int) (users Map_UserId_User))
      (=> (>= uid 1)    ; nat1制約
          (=> (pre_findUser uid users)
              (select (map_dom users) uid))))))
  (check-sat)
```

## 集合内包表記

```
VDM-SL: {users(id).email | id in set dom users}
SMT-LIB:
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

## cases式

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
