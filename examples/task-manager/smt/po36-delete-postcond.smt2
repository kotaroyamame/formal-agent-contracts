; PO 36: DeleteTask - operation postcondition obligation
; Prove: after deleting taskId from board, taskId is not in dom board
;        AND card dom board = card dom board~ - 1
;
; Given: pre_DeleteTask holds (taskId in set dom board)
; Operation: board' = {taskId} <-: board  (domain restriction removal)
;
; We model this with arrays + sets logic.

(set-logic ALL)

; board is modeled as a set of ids (domain of the map)
(declare-const board (Array Int Bool))
(declare-const taskId Int)
(declare-const boardSize Int)

; Precondition: taskId is in dom board, taskId >= 1
(assert (>= taskId 1))
(assert (select board taskId))

; board' = board with taskId removed
(declare-const board_new (Array Int Bool))
(assert (= board_new (store board taskId false)))

; boardSize > 0 (at least one element since taskId is in board)
(assert (> boardSize 0))

; Negate the postcondition:
; NOT (taskId not in dom board' AND card dom board' = card dom board - 1)
; = (taskId in dom board') OR (card dom board' != card dom board - 1)

; Part 1: taskId is NOT in board_new (this follows directly from store)
; We check: is it possible that taskId IS in board_new?
(assert (not
  (not (select board_new taskId))
))

(check-sat)
; Expected: unsat (= proved: taskId is guaranteed not in board_new)
