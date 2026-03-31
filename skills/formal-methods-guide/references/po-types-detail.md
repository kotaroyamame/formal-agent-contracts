# 証明責務（Proof Obligation）種別 詳細解説

VDMJが生成する主要なPO種別を、開発者向けの平易な説明とともに解説する。

## 1. subtype obligation（部分型義務）

**発生条件**: 値が型の不変条件を満たすか確認が必要な場合

**開発者向け説明**: 「この値を代入/返却するとき、型の制約をちゃんと満たしている？」

**例**:
```vdm-sl
types
  Age = nat inv a == a <= 150;

functions
  newborn: () -> Age
  newborn() == 0;  -- PO: 0 はAge（0以上150以下）を満たすか
```

生成されるPO:
```
inv_Age(0)
-- つまり: 0 <= 150  → 自明にtrue
```

## 2. invariant satisfiability（不変条件充足可能性）

**発生条件**: 型や状態に不変条件が定義された場合

**開発者向け説明**: 「この制約は矛盾していない？少なくとも1つ条件を満たす値が存在する？」

**例**:
```vdm-sl
types
  Score = nat inv s == s >= 0 and s <= 100;
```

生成されるPO:
```
exists s : Score & s >= 0 and s <= 100
```

もし `inv s == s > 100 and s < 0` と書いたら、このPOは証明不能になる（矛盾した制約）。

## 3. map apply obligation（写像適用義務）

**発生条件**: `m(k)` のように写像をキーで引く場合

**開発者向け説明**: 「このキーでmapを引こうとしてるけど、キーが存在することは保証されてる？」

**例**:
```vdm-sl
findUser(uid, users) == users(uid)
pre uid in set dom users;
```

生成されるPO:
```
forall uid:UserId, users:map UserId to User &
  pre_findUser(uid, users) => uid in set dom users
```

事前条件があるため、この場合は自明に成立する。

## 4. total function obligation（全域関数義務）

**発生条件**: 事前条件、事後条件、不変条件の式自体が正しく評価できるか

**開発者向け説明**: 「条件式そのものがエラーを起こさない？（例: 0除算、範囲外アクセス）」

**例**:
```vdm-sl
inv u == u.age <= 150
```

生成されるPO:
```
forall u:User! & is_(inv_User(u), bool)
```

不変条件の評価結果がbool型になること（評価中にエラーが起きないこと）を確認。

## 5. func post condition obligation（関数事後条件義務）

**発生条件**: 関数に事後条件が定義されている場合

**開発者向け説明**: 「この関数の実装は、宣言した事後条件を本当に満たす？」

**例**:
```vdm-sl
abs: int -> nat
abs(x) == if x >= 0 then x else -x
post RESULT >= 0;
```

生成されるPO:
```
forall x:int &
  (let RESULT = if x >= 0 then x else -x in
    RESULT >= 0)
```

## 6. operation postcondition obligation（操作事後条件義務）

**発生条件**: 操作に事後条件が定義されている場合

**開発者向け説明**: 「この操作を実行した後、約束した条件は満たされる？」

操作のPOはlet式のネストで状態遷移を表現する:
```
forall name, email, mk_State(users, nextId) &
  pre_Op(...) =>
  (let uid = nextId in
    (let users = users munion {uid |-> ...} in
      (let nextId = nextId + 1 in
        (let RESULT = uid in
          postcondition))))
```

## 7. state invariant obligation（状態不変条件義務）

**発生条件**: 状態を変更する操作があり、状態に不変条件がある場合

**開発者向け説明**: 「操作の各ステップで、状態の整合性が壊れていない？」

操作内の各代入文ごとに生成される。3つの代入があれば、最大3つの状態不変条件POが生成される。

## 8. map compatible obligation（写像互換性義務）

**発生条件**: `munion`（写像結合）を使用する場合

**開発者向け説明**: 「2つのmapを合体させるとき、同じキーに異なる値が割り当てられていない？」

```
forall ldom1 in set dom m1, rdom2 in set dom m2 &
  ldom1 = rdom2 => m1(ldom1) = m2(rdom2)
```

## 9. state init obligation（状態初期化義務）

**発生条件**: 状態にinit句がある場合

**開発者向け説明**: 「初期値は状態の不変条件を満たしている？」

## 10. sequence apply obligation（シーケンス適用義務）

**発生条件**: `s(i)` のようにシーケンスをインデックスで引く場合

**開発者向け説明**: 「このインデックスはシーケンスの範囲内？」

## 11. non-empty sequence obligation（非空シーケンス義務）

**発生条件**: `hd s` や `tl s` を使用する場合

**開発者向け説明**: 「空のリストに対してhead/tailを呼んでいない？」

## 12. recursive function obligation（再帰関数義務）

**発生条件**: 再帰関数がある場合

**開発者向け説明**: 「この再帰は必ず終了する？（無限ループにならない？）」

## PO種別の完全一覧

VDMJのPOType enumに定義された全38種:

| カテゴリ | PO種別 |
|---------|--------|
| 型関連 | SUB_TYPE, INVARIANT_SATISFIABILITY, TYPE_COMP_OBLIGATION |
| 関数関連 | FUNC_POST_CONDITION, FUNC_APPLY, TOTAL_FUNCTION, RECURSIVE |
| 操作関連 | OP_POST_CONDITION, STATE_INVARIANT, OPERATION_PATTERNS |
| 写像関連 | MAP_APPLY, MAP_COMPATIBLE, MAP_ITERATION, MAP_COMPOSE, MAP_SET_OF_COMPAT |
| シーケンス関連 | SEQ_APPLY, NON_EMPTY_SEQ |
| 集合関連 | SET_MEMBERSHIP, NON_EMPTY_SET, FINITE_SET |
| その他 | CASES_EXHAUSTIVE, LET_BE_EXISTS, UNIQUE_EXISTENCE, NON_ZERO, TUPLE_SELECT, VALUE_BINDING |

参照元: VDMJソースコード `com.fujitsu.vdmj.pog.POType` enum
