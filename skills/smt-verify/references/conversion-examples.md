# PO → SMT-LIB 変換の具体例

実際のVDMJ PO出力をSMT-LIBに変換した完全な例を示す。
すべてZ3で検証済み。

## 例1: invariant satisfiability（最も単純）

### 元のPO
```
Proof Obligation 2: (Unproved)
User: invariant satisfiability obligation in 'TestPO' at line 9:7
exists u : User & ((u.age) <= 150)
```

### SMT-LIB変換

```smt-lib
; ===== 型宣言 =====
(declare-datatypes ((User 0))
  ((mk_User (name String) (email String) (age Int))))

; ===== PO: exists u : User & u.age <= 150 =====
; 戦略: 否定を assert して unsat を確認
; unsat = 元の命題は valid（不変条件を満たす値が存在する）
(assert (not
  (exists ((u User))
    (and
      ; 型制約: age は nat（>= 0）
      (>= (age u) 0)
      ; 型制約: name は seq1 of char（非空文字列）
      (> (str.len (name u)) 0)
      ; 型制約: email は seq1 of char（非空文字列）
      (> (str.len (email u)) 0)
      ; 不変条件本体
      (<= (age u) 150)
    ))))

(check-sat)
; 期待結果: unsat（元の命題は valid）
```

### 解説
- `exists` + `and` パターン（存在量化の型制約は `and` で結合）
- レコード型は `declare-datatypes` で宣言
- `seq1 of char` は `String` + 長さ制約
- `nat` は `Int` + `>= 0` 制約

---

## 例2: state init obligation

### 元のPO
```
Proof Obligation 5: (Unproved)
UserDB: state init obligation in 'TestPO' at line 15:6
exists s : UserDB & (s = mk_UserDB({|->}, 1))
```

### SMT-LIB変換

```smt-lib
; ===== 型宣言 =====
(declare-datatypes ((User 0))
  ((mk_User (name String) (email String) (age Int))))

; 写像型の宣言
(declare-sort Map_UserId_User 0)
(declare-fun map_apply (Map_UserId_User Int) User)
(declare-fun map_dom (Map_UserId_User) (Array Int Bool))

; 空の写像
(declare-const empty_map Map_UserId_User)
(assert (forall ((k Int)) (not (select (map_dom empty_map) k))))

; UserDB型
(declare-datatypes ((UserDB 0))
  ((mk_UserDB (users Map_UserId_User) (nextId Int))))

; 状態不変条件
(define-fun inv_UserDB ((s UserDB)) Bool
  (and
    (>= (nextId s) 1)  ; nat1制約
    (not (select (map_dom (users s)) (nextId s)))))  ; nextId not in set dom users

; ===== PO: exists s : UserDB & s = mk_UserDB({|->}, 1) =====
; 暗黙的に不変条件も満たす必要がある
(assert (not
  (exists ((s UserDB))
    (and
      (= s (mk_UserDB empty_map 1))
      (inv_UserDB s)
    ))))

(check-sat)
; 期待結果: unsat
; 理由: s = mk_UserDB({|->}, 1) のとき
;   nextId = 1 >= 1 ✓
;   dom users = {} なので 1 not in set {} ✓
```

---

## 例3: map apply obligation

### 元のPO
```
Proof Obligation 7: (Unproved)
findUser: map apply obligation in 'TestPO' at line 20:27
(forall uid:UserId, users:map UserId to User & pre_findUser(uid, users) =>
  uid in set dom users)
```

### SMT-LIB変換

```smt-lib
; ===== 型宣言 =====
(declare-datatypes ((User 0))
  ((mk_User (name String) (email String) (age Int))))

(declare-sort Map_UserId_User 0)
(declare-fun map_apply (Map_UserId_User Int) User)
(declare-fun map_dom (Map_UserId_User) (Array Int Bool))

; ===== 事前条件の定義 =====
; pre_findUser(uid, users) == uid in set dom users
(define-fun pre_findUser ((uid Int) (users Map_UserId_User)) Bool
  (select (map_dom users) uid))

; ===== PO =====
(assert (not
  (forall ((uid Int) (users Map_UserId_User))
    (=> (>= uid 1)  ; UserId = nat1
        (=> (pre_findUser uid users)
            (select (map_dom users) uid))))))

(check-sat)
; 期待結果: unsat
; 理由: pre_findUser の定義がそのまま結論と一致するため自明
```

---

## 例4: subtype obligation（レコード不変条件）

### 元のPO
```
Proof Obligation 10: (Unproved)
RegisterUser: subtype obligation in 'TestPO' at line 31:36
(forall name:seq1 of char, email:Email, mk_UserDB(users, nextId):UserDB &
  pre_RegisterUser(name, email, mk_UserDB(users, nextId)) =>
  (let uid : UserId = nextId in
    inv_User(mk_User(name, email, 0))))
```

### SMT-LIB変換

```smt-lib
; ===== 型宣言 =====
(declare-datatypes ((User 0))
  ((mk_User (name String) (email String) (age Int))))

(declare-sort Map_UserId_User 0)
(declare-fun map_apply (Map_UserId_User Int) User)
(declare-fun map_dom (Map_UserId_User) (Array Int Bool))

(declare-datatypes ((UserDB 0))
  ((mk_UserDB (users Map_UserId_User) (nextId Int))))

; ===== 不変条件 =====
(define-fun inv_User ((u User)) Bool
  (and (>= (age u) 0) (<= (age u) 150)
       (> (str.len (name u)) 0)
       (> (str.len (email u)) 0)))

(define-fun inv_UserDB ((db UserDB)) Bool
  (and (>= (nextId db) 1)
       (not (select (map_dom (users db)) (nextId db)))))

; ===== 事前条件 =====
(declare-fun pre_RegisterUser (String String UserDB) Bool)
; pre の具体的定義は複雑なため未解釈関数として宣言

; ===== PO =====
(assert (not
  (forall ((name_arg String) (email_arg String) (db UserDB))
    (=> (and
          (> (str.len name_arg) 0)   ; seq1制約
          (> (str.len email_arg) 0)  ; seq1制約
          (inv_UserDB db)            ; 状態不変条件
          (pre_RegisterUser name_arg email_arg db))
        (let ((uid (nextId db)))
          (inv_User (mk_User name_arg email_arg 0)))))))

(check-sat)
; 期待結果: unsat
; 理由: mk_User(name, email, 0) で
;   age = 0 >= 0 かつ 0 <= 150 ✓
;   name は seq1（事前条件で非空保証）✓
;   email は seq1（事前条件で非空保証）✓
```

---

## 例5: operation postcondition（最も複雑）

### 元のPO
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

### SMT-LIB変換

```smt-lib
; ===== 型宣言（省略: 上記と同じ） =====
(declare-datatypes ((User 0))
  ((mk_User (name String) (email String) (age Int))))

(declare-sort Map_UserId_User 0)
(declare-fun map_apply_m (Map_UserId_User Int) User)
(declare-fun map_dom_m (Map_UserId_User) (Array Int Bool))

(declare-datatypes ((UserDB 0))
  ((mk_UserDB (users Map_UserId_User) (nextId Int))))

(define-fun inv_UserDB ((db UserDB)) Bool
  (and (>= (nextId db) 1)
       (not (select (map_dom_m (users db)) (nextId db)))))

; ===== 事前条件（未解釈） =====
(declare-fun pre_RegisterUser (String String UserDB) Bool)

; ===== munion結果の写像を宣言 =====
; users_new = users munion {uid |-> mk_User(name, email, 0)}
(declare-const users_old Map_UserId_User)
(declare-const users_new Map_UserId_User)
(declare-const name_arg String)
(declare-const email_arg String)
(declare-const uid Int)

; 前提条件
(assert (> (str.len name_arg) 0))
(assert (> (str.len email_arg) 0))
(assert (>= uid 1))  ; nat1
(assert (inv_UserDB (mk_UserDB users_old uid)))
(assert (pre_RegisterUser name_arg email_arg (mk_UserDB users_old uid)))

; munion のセマンティクス
; users_new の定義域 = users_old の定義域 ∪ {uid}
(assert (forall ((k Int))
  (= (select (map_dom_m users_new) k)
     (or (select (map_dom_m users_old) k) (= k uid)))))

; users_new の値:
; uid → mk_User(name, email, 0)
(assert (= (map_apply_m users_new uid) (mk_User name_arg email_arg 0)))
; それ以外 → users_old と同じ
(assert (forall ((k Int))
  (=> (and (select (map_dom_m users_old) k) (not (= k uid)))
      (= (map_apply_m users_new k) (map_apply_m users_old k)))))

; ===== PO本体（否定） =====
; RESULT = uid, users は users_new に更新済み
; 確認: RESULT in set dom users_new and users_new(RESULT).name = name
(assert (not
  (and
    (select (map_dom_m users_new) uid)              ; RESULT in set dom users_new
    (= (name (map_apply_m users_new uid)) name_arg) ; users_new(RESULT).name = name
  )))

(check-sat)
; 期待結果: unsat
; 理由:
;   1. uid は users_new の定義域に含まれる（munionで追加したため）
;   2. users_new(uid) = mk_User(name, email, 0) なので .name = name ✓
```

---

## SMT-LIB変換の一般手順（まとめ）

1. **型宣言フェーズ**: POに出現するすべての型をSMT-LIBで宣言
2. **補助定義フェーズ**: inv_T, pre_f, post_f を define-fun で定義
3. **PO変換フェーズ**: POの式を式マッピングルールに従って変換
4. **否定+check-sat**: `(assert (not PO_smt))` → `(check-sat)`
5. **結果解釈**: `unsat` = valid, `sat` = 反例あり, `unknown` = 判定不能
