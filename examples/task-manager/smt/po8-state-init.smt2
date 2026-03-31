; PO 8: TaskManagerState - state init obligation
; Prove: exists s : TaskManagerState & (s = mk_TaskManagerState({|->}, 1))
; i.e., the initial state satisfies the state invariant
;
; State invariant:
;   forall id in set dom board & id < nextId
;   AND nextId >= 1
;
; Initial state: board = {|->} (empty map), nextId = 1
; For empty board, forall is vacuously true, and 1 >= 1, so this should hold.

(set-logic ALL)

; The PO asks: does the initial state (empty board, nextId=1) satisfy the invariant?
; Invariant check: (forall id in dom {} . id < 1) AND (1 >= 1)
; forall over empty set is true, and 1 >= 1 is true.
; We negate to check unsatisfiability.

(assert (not
  (and
    true              ; forall over empty domain is vacuously true
    (>= 1 1)         ; nextId >= 1
  )
))

(check-sat)
; Expected: unsat (= proved)
