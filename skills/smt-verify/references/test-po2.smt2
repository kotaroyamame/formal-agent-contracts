; ===== PO 2: invariant satisfiability =====
; exists u : User & ((u.age) <= 150)
; 期待結果: unsat（= 元の命題は valid）

; 型宣言
(declare-datatypes ((User 0))
  ((mk_User (name String) (email String) (age Int))))

; PO: 否定を assert
(assert (not
  (exists ((u User))
    (and
      (>= (age u) 0)             ; nat制約
      (> (str.len (name u)) 0)   ; seq1制約
      (> (str.len (email u)) 0)  ; seq1制約
      (<= (age u) 150)           ; 不変条件
    ))))

(check-sat)
; 実行: z3 test-po2.smt2
; 期待結果: unsat
