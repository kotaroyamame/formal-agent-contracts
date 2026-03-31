; ===== PO 5: state init obligation =====
; exists s : UserDB & (s = mk_UserDB({|->}, 1))
; 期待結果: unsat（= 初期状態は不変条件を満たす）

; 型宣言
(declare-datatypes ((User 0))
  ((mk_User (name String) (email String) (age Int))))

; 写像型
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
    (>= (nextId s) 1)
    (not (select (map_dom (users s)) (nextId s)))))

; PO: 否定を assert
(assert (not
  (exists ((s UserDB))
    (and
      (= s (mk_UserDB empty_map 1))
      (inv_UserDB s)
    ))))

(check-sat)
; 実行: z3 test-po5.smt2
; 期待結果: unsat
