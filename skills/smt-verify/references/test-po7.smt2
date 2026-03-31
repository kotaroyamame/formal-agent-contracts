; ===== PO 7: map apply obligation =====
; forall uid:UserId, users:map UserId to User &
;   pre_findUser(uid, users) => uid in set dom users
; 期待結果: unsat（= 事前条件により写像適用は安全）

(set-logic ALL)

; 型宣言
(declare-datatypes ((User 0))
  (((mk_User (user_name String) (user_email String) (age Int)))))

(declare-sort Map_UserId_User 0)
(declare-fun map_apply (Map_UserId_User Int) User)
(declare-fun map_dom (Map_UserId_User) (Array Int Bool))

; 事前条件の定義
; pre_findUser(uid, users) == uid in set dom users
(define-fun pre_findUser ((uid Int) (m Map_UserId_User)) Bool
  (select (map_dom m) uid))

; PO: 否定を assert
(assert (not
  (forall ((uid Int) (m Map_UserId_User))
    (=> (>= uid 1)
        (=> (pre_findUser uid m)
            (select (map_dom m) uid))))))

(check-sat)
; 実行: z3 test-po7.smt2
; 期待結果: unsat（事前条件の定義と結論が一致するため自明）
