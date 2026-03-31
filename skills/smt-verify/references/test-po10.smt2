; ===== PO 10: subtype obligation =====
; RegisterUser: inv_User(mk_User(name, email, 0))
; 期待結果: unsat（= mk_User(name, email, 0)はUser型の不変条件を満たす）

(set-logic ALL)

; 型宣言
(declare-datatypes ((User 0))
  (((mk_User (user_name String) (user_email String) (age Int)))))

(declare-sort Map_UserId_User 0)
(declare-fun map_dom (Map_UserId_User) (Array Int Bool))

(declare-datatypes ((UserDB 0))
  (((mk_UserDB (users Map_UserId_User) (nextId Int)))))

; 不変条件
(define-fun inv_User ((u User)) Bool
  (and (>= (age u) 0) (<= (age u) 150)
       (> (str.len (user_name u)) 0)
       (> (str.len (user_email u)) 0)))

(define-fun inv_UserDB ((db UserDB)) Bool
  (and (>= (nextId db) 1)
       (not (select (map_dom (users db)) (nextId db)))))

; 事前条件（未解釈）
(declare-fun pre_RegisterUser (String String UserDB) Bool)

; PO: 否定を assert
(assert (not
  (forall ((name_arg String) (email_arg String) (db UserDB))
    (=> (and
          (> (str.len name_arg) 0)
          (> (str.len email_arg) 0)
          (inv_UserDB db)
          (pre_RegisterUser name_arg email_arg db))
        (let ((uid (nextId db)))
          (inv_User (mk_User name_arg email_arg 0)))))))

(check-sat)
; 実行: z3 test-po10.smt2
; 期待結果: unsat
; 理由: mk_User(name, email, 0) で
;   age = 0: >= 0 ✓, <= 150 ✓
;   name: seq1 → str.len > 0 ✓（前提から）
;   email: seq1 → str.len > 0 ✓（前提から）
