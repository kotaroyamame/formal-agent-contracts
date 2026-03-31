# PO → SMT-LIB Conversion Examples / PO → SMT-LIB 変換の具体例

This section presents complete examples of converting actual VDMJ PO output into SMT-LIB format.
All examples have been verified with Z3 4.13.0.
実際のVDMJ PO出力をSMT-LIBに変換した完全な例を示す。
すべてZ3 4.13.0で検証済み。

**Important / 重要**: All SMT-LIB files must include `(set-logic ALL)` at the beginning.
すべてのSMT-LIBファイルは冒頭に `(set-logic ALL)` を記述すること。

## Example 1 / 例1: invariant satisfiability（最も単純）

### Original PO / 元のPO
```
Proof Obligation 2: (Unproved)
User: invariant satisfiability obligation in 'TestPO' at line 9:7
exists u : User & ((u.age) <= 150)
```

### SMT-LIB Conversion / SMT-LIB変換

```smt-lib
(set-logic ALL)

; ===== Type Declarations / 型宣言 =====
(declare-datatypes ((User 0))
  (((mk_User (user_name String) (user_email String) (age Int)))))

; ===== PO: exists u : User & u.age <= 150 =====
; Strategy: assert negation and check for unsat / 戦略: 否定を assert して unsat を確認
; unsat = the original proposition is valid (a value exists that satisfies the invariant) / unsat = 元の命題は valid（不変条件を満たす値が存在する）
(assert (not
  (exists ((u User))
    (and
      ; Type constraint: age is nat (>= 0) / 型制約: age は nat（>= 0）
      (>= (age u) 0)
      ; Type constraint: name is seq1 of char (non-empty string) / 型制約: name は seq1 of char（非空文字列）
      (> (str.len (user_name u)) 0)
      ; Type constraint: email is seq1 of char (non-empty string) / 型制約: email は seq1 of char（非空文字列）
      (> (str.len (user_email u)) 0)
      ; Invariant body / 不変条件本体
      (<= (age u) 150)
    ))))

(check-sat)
; Expected: unsat (the original proposition is valid) / 期待結果: unsat（元の命題は valid）
```

### Explanation / 解説
- `exists` + `and` pattern (existential quantifier type constraints combined with `and`) / `exists` + `and` パターン（存在量化の型制約は `and` で結合）
- Record types declared with `declare-datatypes` (constructor list uses double parentheses) / レコード型は `declare-datatypes` で宣言（コンストラクタリストは二重括弧）
- `seq1 of char` is `String` + length constraint / `seq1 of char` は `String` + 長さ制約
- `nat` is `Int` + `>= 0` constraint / `nat` は `Int` + `>= 0` 制約
- Selector names use prefixes like `user_name`, `user_email` to avoid collisions with Z3 built-in functions / セレクタ名は `user_name`, `user_email` のようにプレフィックス付与（Z3組込み関数との衝突回避）

---

## Example 2 / 例2: state init obligation

### Original PO / 元のPO
```
Proof Obligation 5: (Unproved)
UserDB: state init obligation in 'TestPO' at line 15:6
exists s : UserDB & (s = mk_UserDB({|->}, 1))
```

### SMT-LIB Conversion / SMT-LIB変換

```smt-lib
(set-logic ALL)

; ===== Type Declarations / 型宣言 =====
(declare-datatypes ((User 0))
  (((mk_User (user_name String) (user_email String) (age Int)))))

; Map type declaration (must be declared before declare-datatypes that references it) / 写像型の宣言（declare-datatypesより先に宣言すること）
(declare-sort Map_UserId_User 0)
(declare-fun map_apply (Map_UserId_User Int) User)
(declare-fun map_dom (Map_UserId_User) (Array Int Bool))

; Empty map / 空の写像
(declare-const empty_map Map_UserId_User)
(assert (forall ((k Int)) (not (select (map_dom empty_map) k))))

; UserDB type (references Map_UserId_User, so declared after declare-sort) / UserDB型（Map_UserId_Userを参照するので、declare-sortの後に宣言）
(declare-datatypes ((UserDB 0))
  (((mk_UserDB (users Map_UserId_User) (nextId Int)))))

; State invariant / 状態不変条件
(define-fun inv_UserDB ((s UserDB)) Bool
  (and
    (>= (nextId s) 1)  ; nat1 constraint / nat1制約
    (not (select (map_dom (users s)) (nextId s)))))  ; nextId not in set dom users

; ===== PO: exists s : UserDB & s = mk_UserDB({|->}, 1) =====
; Must also satisfy the invariant implicitly / 暗黙的に不変条件も満たす必要がある
(assert (not
  (exists ((s UserDB))
    (and
      (= s (mk_UserDB empty_map 1))
      (inv_UserDB s)
    ))))

(check-sat)
; Expected: unsat / 期待結果: unsat
; Reason: when s = mk_UserDB({|->}, 1) / 理由: s = mk_UserDB({|->}, 1) のとき
;   nextId = 1 >= 1 ✓
;   dom users = {} so 1 not in set {} ✓ / dom users = {} なので 1 not in set {} ✓
```

---

## Example 3 / 例3: map apply obligation

### Original PO / 元のPO
```
Proof Obligation 7: (Unproved)
findUser: map apply obligation in 'TestPO' at line 20:27
(forall uid:UserId, users:map UserId to User & pre_findUser(uid, users) =>
  uid in set dom users)
```

### SMT-LIB Conversion / SMT-LIB変換

```smt-lib
(set-logic ALL)

; ===== Type Declarations / 型宣言 =====
(declare-datatypes ((User 0))
  (((mk_User (user_name String) (user_email String) (age Int)))))

(declare-sort Map_UserId_User 0)
(declare-fun map_apply (Map_UserId_User Int) User)
(declare-fun map_dom (Map_UserId_User) (Array Int Bool))

; ===== Precondition Definition / 事前条件の定義 =====
; pre_findUser(uid, users) == uid in set dom users
(define-fun pre_findUser ((uid Int) (m Map_UserId_User)) Bool
  (select (map_dom m) uid))

; ===== PO =====
(assert (not
  (forall ((uid Int) (m Map_UserId_User))
    (=> (>= uid 1)  ; UserId = nat1
        (=> (pre_findUser uid m)
            (select (map_dom m) uid))))))

(check-sat)
; Expected: unsat / 期待結果: unsat
; Reason: the definition of pre_findUser directly matches the conclusion, so it is trivial / 理由: pre_findUser の定義がそのまま結論と一致するため自明
```

---

## Example 4 / 例4: subtype obligation（レコード不変条件）

### Original PO / 元のPO
```
Proof Obligation 10: (Unproved)
RegisterUser: subtype obligation in 'TestPO' at line 31:36
(forall name:seq1 of char, email:Email, mk_UserDB(users, nextId):UserDB &
  pre_RegisterUser(name, email, mk_UserDB(users, nextId)) =>
  (let uid : UserId = nextId in
    inv_User(mk_User(name, email, 0))))
```

### SMT-LIB Conversion / SMT-LIB変換

```smt-lib
(set-logic ALL)

; ===== Type Declarations / 型宣言 =====
(declare-datatypes ((User 0))
  (((mk_User (user_name String) (user_email String) (age Int)))))

(declare-sort Map_UserId_User 0)
(declare-fun map_dom (Map_UserId_User) (Array Int Bool))

(declare-datatypes ((UserDB 0))
  (((mk_UserDB (users Map_UserId_User) (nextId Int)))))

; ===== Invariants / 不変条件 =====
(define-fun inv_User ((u User)) Bool
  (and (>= (age u) 0) (<= (age u) 150)
       (> (str.len (user_name u)) 0)
       (> (str.len (user_email u)) 0)))

(define-fun inv_UserDB ((db UserDB)) Bool
  (and (>= (nextId db) 1)
       (not (select (map_dom (users db)) (nextId db)))))

; ===== Precondition / 事前条件 =====
(declare-fun pre_RegisterUser (String String UserDB) Bool)
; Specific definition of pre is complex, so declared as uninterpreted function / pre の具体的定義は複雑なため未解釈関数として宣言

; ===== PO =====
(assert (not
  (forall ((name_arg String) (email_arg String) (db UserDB))
    (=> (and
          (> (str.len name_arg) 0)   ; seq1 constraint / seq1制約
          (> (str.len email_arg) 0)  ; seq1 constraint / seq1制約
          (inv_UserDB db)            ; state invariant / 状態不変条件
          (pre_RegisterUser name_arg email_arg db))
        (let ((uid (nextId db)))
          (inv_User (mk_User name_arg email_arg 0)))))))

(check-sat)
; Expected: unsat / 期待結果: unsat
; Reason: in mk_User(name, email, 0) / 理由: mk_User(name, email, 0) で
;   age = 0 >= 0 and 0 <= 150 ✓ / age = 0 >= 0 かつ 0 <= 150 ✓
;   name is seq1 (non-empty guaranteed by precondition) ✓ / name は seq1（事前条件で非空保証）✓
;   email is seq1 (non-empty guaranteed by precondition) ✓ / email は seq1（事前条件で非空保証）✓
```

---

## Example 5 / 例5: operation postcondition（最も複雑）

### Original PO / 元のPO
```
Proof Obligation 14: (Unproved)
RegisterUser: operation postcondition obligation at line 36:32
(forall name:seq1 of char, email:Email, mk_UserDB(users, nextId):UserDB &
  pre_RegisterUser(name, email, mk_UserDB(users, nextId)) =>
  (let uid : UserId = nextId in
    (let users : map UserId to User = (users munion {uid |-> mk_User(name, email, 0)}) in
      (let nextId : UserId = (nextId + 1) in
        (let RESULT : UserId = uid in
          ((RESULT in set (dom users)) and ((users(RESULT).name) = name)))))))
```

### SMT-LIB Conversion / SMT-LIB変換

```smt-lib
(set-logic ALL)

; ===== Type Declarations / 型宣言 =====
(declare-datatypes ((User 0))
  (((mk_User (user_name String) (user_email String) (age Int)))))

(declare-sort Map_UserId_User 0)
(declare-fun map_apply_m (Map_UserId_User Int) User)
(declare-fun map_dom_m (Map_UserId_User) (Array Int Bool))

(declare-datatypes ((UserDB 0))
  (((mk_UserDB (users Map_UserId_User) (nextId Int)))))

(define-fun inv_UserDB ((db UserDB)) Bool
  (and (>= (nextId db) 1)
       (not (select (map_dom_m (users db)) (nextId db)))))

; ===== Precondition (uninterpreted) / 事前条件（未解釈） =====
(declare-fun pre_RegisterUser (String String UserDB) Bool)

; ===== Declare map resulting from munion / munion結果の写像を宣言 =====
; users_new = users munion {uid |-> mk_User(name, email, 0)}
(declare-const users_old Map_UserId_User)
(declare-const users_new Map_UserId_User)
(declare-const name_arg String)
(declare-const email_arg String)
(declare-const uid Int)

; Preconditions / 前提条件
(assert (> (str.len name_arg) 0))
(assert (> (str.len email_arg) 0))
(assert (>= uid 1))  ; nat1
(assert (inv_UserDB (mk_UserDB users_old uid)))
(assert (pre_RegisterUser name_arg email_arg (mk_UserDB users_old uid)))

; Semantics of munion / munion のセマンティクス
; Domain of users_new = domain of users_old ∪ {uid} / users_new の定義域 = users_old の定義域 ∪ {uid}
(assert (forall ((k Int))
  (= (select (map_dom_m users_new) k)
     (or (select (map_dom_m users_old) k) (= k uid)))))

; Value of users_new: / users_new の値:
; uid → mk_User(name, email, 0)
(assert (= (map_apply_m users_new uid) (mk_User name_arg email_arg 0)))
; Otherwise → same as users_old / それ以外 → users_old と同じ
(assert (forall ((k Int))
  (=> (and (select (map_dom_m users_old) k) (not (= k uid)))
      (= (map_apply_m users_new k) (map_apply_m users_old k)))))

; ===== PO Body (negated) / PO本体（否定） =====
; RESULT = uid, users updated to users_new / RESULT = uid, users は users_new に更新済み
; Check: RESULT in set dom users_new and users_new(RESULT).name = name / 確認: RESULT in set dom users_new and users_new(RESULT).name = name
(assert (not
  (and
    (select (map_dom_m users_new) uid)                       ; RESULT in set dom users_new
    (= (user_name (map_apply_m users_new uid)) name_arg)     ; users_new(RESULT).name = name
  )))

(check-sat)
; Expected: unsat / 期待結果: unsat
; Reason: / 理由:
;   1. uid is in the domain of users_new (added by munion) / uid は users_new の定義域に含まれる（munionで追加したため）
;   2. users_new(uid) = mk_User(name, email, 0) so .user_name = name ✓ / users_new(uid) = mk_User(name, email, 0) なので .user_name = name ✓
```

---

## General SMT-LIB Conversion Procedure (Summary) / SMT-LIB変換の一般手順（まとめ）

1. **Include `(set-logic ALL)` at the beginning / `(set-logic ALL)` を冒頭に記述** — Necessary for concurrent use of string, array, and integer theories / 文字列・配列・整数理論の併用に必要
2. **Type Declaration Phase / 型宣言フェーズ**: Declare all types appearing in PO in SMT-LIB / POに出現するすべての型をSMT-LIBで宣言
   - `declare-datatypes` uses double parentheses: `(((CtorName (field Sort))))` / `declare-datatypes` は二重括弧: `(((CtorName (field Sort))))`
   - Be careful of collisions with Z3 built-in functions in selector names (use prefixes) / セレクタ名のZ3組込み関数との衝突に注意（プレフィックス付与）
   - Uninterpreted sorts (`declare-sort`) must be declared before any `declare-datatypes` that reference them / 未解釈ソート (`declare-sort`) はそれを使う `declare-datatypes` より先に宣言
3. **Auxiliary Definition Phase / 補助定義フェーズ**: Define inv_T, pre_f, post_f using define-fun / inv_T, pre_f, post_f を define-fun で定義
4. **PO Transformation Phase / PO変換フェーズ**: Transform the PO expression according to expression mapping rules / POの式を式マッピングルールに従って変換
5. **Negation + check-sat / 否定+check-sat**: `(assert (not PO_smt))` → `(check-sat)` / `(assert (not PO_smt))` → `(check-sat)`
6. **Result Interpretation / 結果解釈**: `unsat` = valid, `sat` = counterexample exists, `unknown` = undecidable / `unsat` = valid, `sat` = 反例あり, `unknown` = 判定不能
