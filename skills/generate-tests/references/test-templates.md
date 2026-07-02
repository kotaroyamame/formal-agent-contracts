# テストテンプレート集 (v2.0.0)

VDM-SL仕様から自動生成されるテストの標準テンプレート集です。各テンプレートにはVDM-SL入力パターンとそれに対応するViestテストコード出力を記載します。

---

## テンプレート1：型不変式テスト

**対象**: VDM-SLの`inv`（不変式）定義
**テスト目的**: 型が常に制約を満たすことを検証

### VDM-SL入力パターン

```vdm-sl
-- パターン1a: 単純な数値範囲
Score = nat1
inv s == s >= 1 and s <= 100

-- パターン1b: 複合条件
Priority = nat0
inv p == p >= 0 and p <= 10 and (p > 5 implies true)

-- パターン1c: レコード型の不変式
Ticket ::
  id : nat1
  title : seq of char
  priority : Priority

inv ticket_inv(t : Ticket) ==
  t.id > 0 and
  len t.title > 0 and len t.title <= 255 and
  t.priority >= 0 and t.priority <= 10
```

### Viestテスト出力

```javascript
import { describe, it, expect } from 'vitest';
import { isValidScore, isValidPriority, isValidTicket } from './validators';

// ============================================
// テンプレート1：型不変式テスト
// ============================================

describe('Type Invariants', () => {
  
  // ============================================
  // テスト1a: 数値範囲の不変式
  // ============================================
  
  describe('Score type (nat1, inv: 1 <= s <= 100)', () => {
    // 有効な境界値
    it('accepts score at lower boundary (1)', () => {
      expect(isValidScore(1)).toBe(true);
    });
    
    it('accepts score at upper boundary (100)', () => {
      expect(isValidScore(100)).toBe(true);
    });
    
    it('accepts score within range (50)', () => {
      expect(isValidScore(50)).toBe(true);
    });
    
    // 無効な値
    it('rejects score below lower boundary (0)', () => {
      expect(isValidScore(0)).toBe(false);
    });
    
    it('rejects score above upper boundary (101)', () => {
      expect(isValidScore(101)).toBe(false);
    });
    
    it('rejects negative score (-5)', () => {
      expect(isValidScore(-5)).toBe(false);
    });
    
    // 非整数値（JavaScriptの場合）
    it('rejects non-integer score (50.5)', () => {
      expect(isValidScore(50.5)).toBe(false);
    });
  });
  
  // ============================================
  // テスト1b: 複合条件の不変式
  // ============================================
  
  describe('Priority type (nat0, inv: 0 <= p <= 10)', () => {
    const validPriorities = [0, 1, 5, 10];
    const invalidPriorities = [-1, 11, 100, -100];
    
    validPriorities.forEach(p => {
      it(`accepts valid priority (${p})`, () => {
        expect(isValidPriority(p)).toBe(true);
      });
    });
    
    invalidPriorities.forEach(p => {
      it(`rejects invalid priority (${p})`, () => {
        expect(isValidPriority(p)).toBe(false);
      });
    });
  });
  
  // ============================================
  // テスト1c: レコード型の不変式
  // ============================================
  
  describe('Ticket record type', () => {
    it('accepts valid ticket', () => {
      const ticket = {
        id: 1,
        title: 'Test Ticket',
        priority: 5
      };
      expect(isValidTicket(ticket)).toBe(true);
    });
    
    // id の制約
    it('rejects ticket with invalid id (0)', () => {
      const ticket = {
        id: 0,
        title: 'Test',
        priority: 5
      };
      expect(isValidTicket(ticket)).toBe(false);
    });
    
    it('rejects ticket with negative id', () => {
      const ticket = {
        id: -1,
        title: 'Test',
        priority: 5
      };
      expect(isValidTicket(ticket)).toBe(false);
    });
    
    // title の制約
    it('rejects ticket with empty title', () => {
      const ticket = {
        id: 1,
        title: '',
        priority: 5
      };
      expect(isValidTicket(ticket)).toBe(false);
    });
    
    it('rejects ticket with oversized title (256+ chars)', () => {
      const ticket = {
        id: 1,
        title: 'x'.repeat(256),
        priority: 5
      };
      expect(isValidTicket(ticket)).toBe(false);
    });
    
    it('accepts ticket with max-length title (255 chars)', () => {
      const ticket = {
        id: 1,
        title: 'x'.repeat(255),
        priority: 5
      };
      expect(isValidTicket(ticket)).toBe(true);
    });
    
    // priority の制約
    it('rejects ticket with invalid priority', () => {
      const ticket = {
        id: 1,
        title: 'Test',
        priority: 11
      };
      expect(isValidTicket(ticket)).toBe(false);
    });
  });
});
```

---

## テンプレート2：前提条件テスト

**対象**: VDM-SLの`pre`（前提条件）定義
**テスト目的**: 関数が前提条件を適切に検証することを確認

### VDM-SL入力パターン

```vdm-sl
-- パターン2a: 単純な前提条件
increment : nat1 -> nat1
increment(n) == n + 1
pre increment(n) == n < 100

-- パターン2b: 複合前提条件
decide : Ticket -> Score -> Score -> Action
decide(ticket, t1, t2) == ???
pre decide(ticket, t1, t2) ==
  t1 > t2 and
  ticket.complexity_score >= 1 and ticket.complexity_score <= 100 and
  t1 >= 1 and t1 <= 100 and
  t2 >= 1 and t2 <= 100

-- パターン2c: 集合操作の前提条件
findElement : (set of nat1) * nat1 -> bool
findElement(s, x) == x in set s
pre findElement(s, x) == s <> {} and x > 0
```

### Viestテスト出力

```javascript
import { describe, it, expect } from 'vitest';
import { increment, decide, findElement } from './functions';

// ============================================
// テンプレート2：前提条件テスト
// ============================================

describe('Preconditions', () => {
  
  // ============================================
  // テスト2a: 単純な前提条件
  // ============================================
  
  describe('increment(n) precondition: n < 100', () => {
    // 前提条件を満たす場合：実行成功
    it('succeeds when precondition is met (n=50)', () => {
      expect(() => increment(50)).not.toThrow();
      expect(increment(50)).toBe(51);
    });
    
    it('succeeds when at boundary (n=99)', () => {
      expect(() => increment(99)).not.toThrow();
      expect(increment(99)).toBe(100);
    });
    
    // 前提条件を満たさない場合：エラーまたは例外
    it('throws error when precondition violated (n=100)', () => {
      expect(() => increment(100)).toThrow(
        /[Pp]recondition|[Pp]re-condition/
      );
    });
    
    it('throws error when n exceeds limit (n=101)', () => {
      expect(() => increment(101)).toThrow();
    });
  });
  
  // ============================================
  // テスト2b: 複合前提条件
  // ============================================
  
  describe('decide(ticket, t1, t2) preconditions', () => {
    const validTicket = {
      id: 1,
      title: 'Test',
      complexity_score: 50
    };
    
    // すべての前提条件を満たす場合
    it('succeeds when all preconditions met', () => {
      expect(() => decide(validTicket, 80, 20)).not.toThrow();
    });
    
    // 前提条件1: t1 > t2
    describe('precondition: t1 > t2', () => {
      it('succeeds when t1 > t2 (80 > 20)', () => {
        expect(() => decide(validTicket, 80, 20)).not.toThrow();
      });
      
      it('throws when t1 == t2 (20 == 20)', () => {
        expect(() => decide(validTicket, 20, 20)).toThrow();
      });
      
      it('throws when t1 < t2 (20 < 80)', () => {
        expect(() => decide(validTicket, 20, 80)).toThrow();
      });
    });
    
    // 前提条件2: complexity_score が有効範囲
    describe('precondition: 1 <= complexity_score <= 100', () => {
      it('succeeds with score=1', () => {
        const ticket = { ...validTicket, complexity_score: 1 };
        expect(() => decide(ticket, 80, 20)).not.toThrow();
      });
      
      it('succeeds with score=100', () => {
        const ticket = { ...validTicket, complexity_score: 100 };
        expect(() => decide(ticket, 80, 20)).not.toThrow();
      });
      
      it('throws with score=0', () => {
        const ticket = { ...validTicket, complexity_score: 0 };
        expect(() => decide(ticket, 80, 20)).toThrow();
      });
      
      it('throws with score=101', () => {
        const ticket = { ...validTicket, complexity_score: 101 };
        expect(() => decide(ticket, 80, 20)).toThrow();
      });
    });
    
    // 前提条件3-4: t1, t2 が有効範囲
    describe('precondition: 1 <= t1, t2 <= 100', () => {
      it('throws when t1=0', () => {
        expect(() => decide(validTicket, 0, 20)).toThrow();
      });
      
      it('throws when t1=101', () => {
        expect(() => decide(validTicket, 101, 20)).toThrow();
      });
      
      it('throws when t2=0', () => {
        expect(() => decide(validTicket, 80, 0)).toThrow();
      });
      
      it('throws when t2=101', () => {
        expect(() => decide(validTicket, 80, 101)).toThrow();
      });
    });
  });
  
  // ============================================
  // テスト2c: 集合操作の前提条件
  // ============================================
  
  describe('findElement(s, x) preconditions', () => {
    describe('precondition: s <> {} and x > 0', () => {
      it('succeeds with non-empty set and positive x', () => {
        const set = new Set([1, 2, 3]);
        expect(() => findElement(set, 2)).not.toThrow();
      });
      
      it('throws when set is empty', () => {
        const set = new Set();
        expect(() => findElement(set, 5)).toThrow();
      });
      
      it('throws when x <= 0', () => {
        const set = new Set([1, 2, 3]);
        expect(() => findElement(set, 0)).toThrow();
      });
      
      it('throws when x < 0', () => {
        const set = new Set([1, 2, 3]);
        expect(() => findElement(set, -5)).toThrow();
      });
    });
  });
});
```

---

## テンプレート3：後提条件テスト

**対象**: VDM-SLの`post`（後提条件）定義
**テスト目的**: 関数が約束した結果を返すことを検証

### VDM-SL入力パターン

```vdm-sl
-- パターン3a: 単純な後提条件
absolute : int -> nat0
absolute(n) == if n >= 0 then n else -n
post absolute(n) == absolute(n) >= 0

-- パターン3b: 複合的な論理式の後提条件
decide : Ticket -> Score -> Score -> Action
decide(ticket, t1, t2) == ???
post decide(ticket, t1, t2) ==
  (let action = decide(ticket, t1, t2) in
    (ticket.complexity_score > t1 => action = <OperatorOnly>) and
    (t2 < ticket.complexity_score <= t1 => action = <OperatorAndLLM>) and
    (ticket.complexity_score <= t2 => action = <AutoReply>)
  )

-- パターン3c: 状態変化の後提条件
addElement : (set of nat1) * nat1 -> (set of nat1)
addElement(s, x) == s union {x}
post addElement(s, x) ==
  x in set addElement(s, x) and
  forall elem in set s & elem in set addElement(s, x)
```

### Viestテスト出力

```javascript
import { describe, it, expect } from 'vitest';
import { absolute, decide, addElement } from './functions';

// ============================================
// テンプレート3：後提条件テスト
// ============================================

describe('Postconditions', () => {
  
  // ============================================
  // テスト3a: 単純な後提条件
  // ============================================
  
  describe('absolute(n) postcondition: result >= 0', () => {
    it('returns non-negative for positive input (5)', () => {
      const result = absolute(5);
      expect(result).toBeGreaterThanOrEqual(0);
    });
    
    it('returns non-negative for negative input (-5)', () => {
      const result = absolute(-5);
      expect(result).toBeGreaterThanOrEqual(0);
    });
    
    it('returns non-negative for zero (0)', () => {
      const result = absolute(0);
      expect(result).toBeGreaterThanOrEqual(0);
    });
    
    // より詳細な検証
    it('returns correct value for positive input', () => {
      expect(absolute(5)).toBe(5);
    });
    
    it('returns correct value for negative input', () => {
      expect(absolute(-5)).toBe(5);
    });
    
    it('returns correct value for zero', () => {
      expect(absolute(0)).toBe(0);
    });
  });
  
  // ============================================
  // テスト3b: 複合的な論理式の後提条件
  // ============================================
  
  describe('decide(ticket, t1, t2) postcondition', () => {
    // テストケーステーブル：
    // [complexity_score, t1, t2, expectedAction]
    const testCases = [
      // 条件: complexity_score > t1
      { score: 90, t1: 80, t2: 20, expected: 'OperatorOnly' },
      { score: 100, t1: 80, t2: 20, expected: 'OperatorOnly' },
      
      // エッジケース: complexity_score == t1
      { score: 80, t1: 80, t2: 20, expected: 'OperatorAndLLM' },
      
      // 条件: t2 < complexity_score <= t1
      { score: 50, t1: 80, t2: 20, expected: 'OperatorAndLLM' },
      { score: 21, t1: 80, t2: 20, expected: 'OperatorAndLLM' },
      
      // エッジケース: complexity_score == t2
      { score: 20, t1: 80, t2: 20, expected: 'AutoReply' },
      
      // 条件: complexity_score <= t2
      { score: 10, t1: 80, t2: 20, expected: 'AutoReply' },
      { score: 1, t1: 80, t2: 20, expected: 'AutoReply' },
    ];
    
    testCases.forEach(({ score, t1, t2, expected }) => {
      it(
        `returns ${expected} ` +
        `(score=${score}, t1=${t1}, t2=${t2})`,
        () => {
          const ticket = { id: 1, complexity_score: score };
          const result = decide(ticket, t1, t2);
          expect(result).toBe(expected);
        }
      );
    });
    
    // 条件ごとの詳細テスト
    describe('condition: complexity_score > t1', () => {
      it('returns OperatorOnly', () => {
        const ticket = { id: 1, complexity_score: 90 };
        const result = decide(ticket, 80, 20);
        expect(result).toBe('OperatorOnly');
      });
      
      it('returns OperatorOnly for score=100, t1=99', () => {
        const ticket = { id: 1, complexity_score: 100 };
        const result = decide(ticket, 99, 20);
        expect(result).toBe('OperatorOnly');
      });
    });
    
    describe('condition: t2 < complexity_score <= t1', () => {
      it('returns OperatorAndLLM', () => {
        const ticket = { id: 1, complexity_score: 50 };
        const result = decide(ticket, 80, 20);
        expect(result).toBe('OperatorAndLLM');
      });
      
      it('returns OperatorAndLLM for score=t1', () => {
        const ticket = { id: 1, complexity_score: 80 };
        const result = decide(ticket, 80, 20);
        expect(result).toBe('OperatorAndLLM');
      });
      
      it('returns OperatorAndLLM for score=t2+1', () => {
        const ticket = { id: 1, complexity_score: 21 };
        const result = decide(ticket, 80, 20);
        expect(result).toBe('OperatorAndLLM');
      });
    });
    
    describe('condition: complexity_score <= t2', () => {
      it('returns AutoReply', () => {
        const ticket = { id: 1, complexity_score: 10 };
        const result = decide(ticket, 80, 20);
        expect(result).toBe('AutoReply');
      });
      
      it('returns AutoReply for score=t2', () => {
        const ticket = { id: 1, complexity_score: 20 };
        const result = decide(ticket, 80, 20);
        expect(result).toBe('AutoReply');
      });
      
      it('returns AutoReply for score=1', () => {
        const ticket = { id: 1, complexity_score: 1 };
        const result = decide(ticket, 80, 20);
        expect(result).toBe('AutoReply');
      });
    });
  });
  
  // ============================================
  // テスト3c: 状態変化の後提条件
  // ============================================
  
  describe('addElement(s, x) postcondition', () => {
    it('added element is in result set', () => {
      const set = new Set([1, 2, 3]);
      const result = addElement(set, 4);
      expect(result.has(4)).toBe(true);
    });
    
    it('original elements remain in result', () => {
      const set = new Set([1, 2, 3]);
      const result = addElement(set, 4);
      expect(result.has(1)).toBe(true);
      expect(result.has(2)).toBe(true);
      expect(result.has(3)).toBe(true);
    });
    
    it('result size increases by 1 for new element', () => {
      const set = new Set([1, 2, 3]);
      const result = addElement(set, 4);
      expect(result.size).toBe(set.size + 1);
    });
    
    it('result size unchanged when adding existing element', () => {
      const set = new Set([1, 2, 3]);
      const result = addElement(set, 3);  // 3は既に存在
      expect(result.size).toBe(set.size);
    });
  });
});
```

---

## テンプレート4：プロトコルメッセージ型テスト（新v2.0.0）

**対象**: VDM-SLのメッセージプロトコル定義
**テスト目的**: メッセージ型とペイロードの整合性を検証

### VDM-SL入力パターン

```vdm-sl
-- パターン4a: メッセージ型定義
UserMsgType = <TicketCreate> | <TicketUpdate> | <EscalationRequest>
ServerToUserMsgType = <TicketCreated> | <AutoReply> | <OperatorReply>

-- パターン4b: ペイロード型定義
TicketCreatePayload ::
  customer_id : nat1
  title : seq of char

AutoReplyPayload ::
  ticket_id : nat1
  reply_text : seq of char

-- パターン4c: WsMessage不変式
WsMessage ::
  msg_type : (UserMsgType | ServerToUserMsgType)
  payload : ???

inv msg_inv(m : WsMessage) ==
  (m.msg_type = <TicketCreate> => is_TicketCreatePayload(m.payload)) and
  (m.msg_type = <AutoReply> => is_AutoReplyPayload(m.payload)) and
  ...
```

### Viestテスト出力

```javascript
import { describe, it, expect } from 'vitest';
import {
  isValidWsMessage,
  isTicketCreatePayload,
  isAutoReplyPayload,
  isClientToServer,
  isServerToClient
} from './protocol';

// ============================================
// テンプレート4：プロトコルテスト（v2.0.0）
// ============================================

describe('MessageProtocol', () => {
  
  // ============================================
  // テスト4a: メッセージ型とペイロード整合性
  // ============================================
  
  describe('WsMessage invariants', () => {
    it('TicketCreate message with correct payload', () => {
      const msg = {
        msg_type: 'TicketCreate',
        payload: {
          customer_id: 1,
          title: 'New Bug'
        },
        timestamp: Date.now()
      };
      expect(isValidWsMessage(msg)).toBe(true);
      expect(isTicketCreatePayload(msg.payload)).toBe(true);
    });
    
    it('rejects TicketCreate with wrong payload type', () => {
      const msg = {
        msg_type: 'TicketCreate',
        payload: {
          ticket_id: 100,
          reply_text: 'Got it'  // AutoReplyPayload
        },
        timestamp: Date.now()
      };
      expect(isValidWsMessage(msg)).toBe(false);
    });
    
    it('AutoReply message with correct payload', () => {
      const msg = {
        msg_type: 'AutoReply',
        payload: {
          ticket_id: 100,
          reply_text: 'Thank you'
        },
        timestamp: Date.now()
      };
      expect(isValidWsMessage(msg)).toBe(true);
      expect(isAutoReplyPayload(msg.payload)).toBe(true);
    });
    
    it('rejects AutoReply with wrong payload type', () => {
      const msg = {
        msg_type: 'AutoReply',
        payload: {
          customer_id: 1,
          title: 'wrong'  // TicketCreatePayload
        },
        timestamp: Date.now()
      };
      expect(isValidWsMessage(msg)).toBe(false);
    });
    
    // すべてのメッセージ型を網羅
    const messagePayloadPairs = [
      ['TicketCreate', { customer_id: 1, title: 'Test' }],
      ['TicketUpdate', { ticket_id: 100, new_status: 'Assigned' }],
      ['EscalationRequest', { ticket_id: 100, reason: 'Complex' }],
      ['TicketCreated', { ticket_id: 100, status: 'Created' }],
      ['AutoReply', { ticket_id: 100, reply_text: 'OK' }],
      ['OperatorReply', { ticket_id: 100, operator_id: 1, message: 'Handled' }],
    ];
    
    messagePayloadPairs.forEach(([msgType, payload]) => {
      it(`validates ${msgType} message`, () => {
        const msg = {
          msg_type: msgType,
          payload: payload,
          timestamp: Date.now()
        };
        expect(isValidWsMessage(msg)).toBe(true);
      });
    });
  });
  
  // ============================================
  // テスト4b: ペイロード型の個別検証
  // ============================================
  
  describe('Payload type validation', () => {
    describe('TicketCreatePayload', () => {
      it('accepts valid payload', () => {
        const payload = {
          customer_id: 1,
          title: 'Bug Report'
        };
        expect(isTicketCreatePayload(payload)).toBe(true);
      });
      
      it('rejects payload with missing customer_id', () => {
        const payload = {
          title: 'Bug Report'
        };
        expect(isTicketCreatePayload(payload)).toBe(false);
      });
      
      it('rejects payload with invalid customer_id (0)', () => {
        const payload = {
          customer_id: 0,
          title: 'Bug Report'
        };
        expect(isTicketCreatePayload(payload)).toBe(false);
      });
      
      it('rejects payload with empty title', () => {
        const payload = {
          customer_id: 1,
          title: ''
        };
        expect(isTicketCreatePayload(payload)).toBe(false);
      });
    });
    
    describe('AutoReplyPayload', () => {
      it('accepts valid payload', () => {
        const payload = {
          ticket_id: 100,
          reply_text: 'Thank you for reporting'
        };
        expect(isAutoReplyPayload(payload)).toBe(true);
      });
      
      it('rejects payload with missing fields', () => {
        const payload = {
          ticket_id: 100
        };
        expect(isAutoReplyPayload(payload)).toBe(false);
      });
    });
  });
  
  // ============================================
  // テスト4c: メッセージ方向の検証
  // ============================================
  
  describe('Message direction', () => {
    it('isClientToServer returns true for TicketCreate', () => {
      const msg = { msg_type: 'TicketCreate' };
      expect(isClientToServer(msg)).toBe(true);
    });
    
    it('isClientToServer returns true for UserMsgType', () => {
      const userMessages = ['TicketCreate', 'TicketUpdate', 'EscalationRequest'];
      userMessages.forEach(type => {
        const msg = { msg_type: type };
        expect(isClientToServer(msg)).toBe(true);
      });
    });
    
    it('isClientToServer returns false for ServerToUserMsgType', () => {
      const serverMessages = ['TicketCreated', 'AutoReply', 'OperatorReply'];
      serverMessages.forEach(type => {
        const msg = { msg_type: type };
        expect(isClientToServer(msg)).toBe(false);
      });
    });
    
    it('isServerToClient returns true for AutoReply', () => {
      const msg = { msg_type: 'AutoReply' };
      expect(isServerToClient(msg)).toBe(true);
    });
    
    it('isServerToClient returns false for TicketCreate', () => {
      const msg = { msg_type: 'TicketCreate' };
      expect(isServerToClient(msg)).toBe(false);
    });
  });
});
```

---

## テンプレート5：状態遷移テスト（新v2.0.0）

**対象**: VDM-SLの状態遷移規則（`validTransition`等）
**テスト目的**: 状態遷移の有効性と完全性を検証

### VDM-SL入力パターン

```vdm-sl
-- パターン5a: 単純な状態遷移
TicketStatus = <Created> | <Assigned> | <InProgress> | <Resolved> | <Closed>

validTransition : (TicketStatus * TicketStatus) -> bool
validTransition(from, to) == (
  from = <Created> => to in set {<Assigned>, <Closed>} and
  from = <Assigned> => to in set {<InProgress>, <Closed>} and
  from = <InProgress> => to in set {<Resolved>, <Closed>} and
  from = <Resolved> => to in set {<Closed>} and
  from = <Closed> => to = <Closed>
)

-- パターン5b: 複雑な状態機械
SystemState = <Idle> | <Processing> | <Error> | <Complete>
```

### Viestテスト出力

```javascript
import { describe, it, expect } from 'vitest';
import { validTransition, computeReachable } from './statemachine';

// ============================================
// テンプレート5：状態遷移テスト（v2.0.0）
// ============================================

describe('State Transitions', () => {
  
  // ============================================
  // テスト5a: 有効な遷移
  // ============================================
  
  describe('validTransition function', () => {
    describe('valid transitions', () => {
      const validTransitions = [
        // from Created
        ['Created', 'Assigned'],
        ['Created', 'Closed'],
        
        // from Assigned
        ['Assigned', 'InProgress'],
        ['Assigned', 'Closed'],
        
        // from InProgress
        ['InProgress', 'Resolved'],
        ['InProgress', 'Closed'],
        
        // from Resolved
        ['Resolved', 'Closed'],
        
        // from Closed
        ['Closed', 'Closed'],
      ];
      
      validTransitions.forEach(([from, to]) => {
        it(`allows transition ${from} -> ${to}`, () => {
          expect(validTransition(from, to)).toBe(true);
        });
      });
    });
    
    // ============================================
    // テスト5b: 無効な遷移
    // ============================================
    
    describe('invalid transitions', () => {
      const invalidTransitions = [
        // from Created（許可されない遷移）
        ['Created', 'InProgress'],
        ['Created', 'Resolved'],
        
        // from Assigned
        ['Assigned', 'Created'],
        ['Assigned', 'Assigned'],
        
        // from InProgress
        ['InProgress', 'Assigned'],
        ['InProgress', 'Created'],
        
        // from Resolved
        ['Resolved', 'InProgress'],
        ['Resolved', 'Assigned'],
        
        // from Closed
        ['Closed', 'Created'],
        ['Closed', 'Assigned'],
      ];
      
      invalidTransitions.forEach(([from, to]) => {
        it(`rejects transition ${from} -> ${to}`, () => {
          expect(validTransition(from, to)).toBe(false);
        });
      });
    });
  });
  
  // ============================================
  // テスト5c: 状態到達可能性
  // ============================================
  
  describe('State reachability', () => {
    it('all states reachable from Created', () => {
      const reachable = computeReachable('Created');
      expect(reachable).toContain('Created');
      expect(reachable).toContain('Assigned');
      expect(reachable).toContain('InProgress');
      expect(reachable).toContain('Resolved');
      expect(reachable).toContain('Closed');
    });
    
    it('normal path: Created -> Assigned -> InProgress -> Resolved -> Closed', () => {
      expect(validTransition('Created', 'Assigned')).toBe(true);
      expect(validTransition('Assigned', 'InProgress')).toBe(true);
      expect(validTransition('InProgress', 'Resolved')).toBe(true);
      expect(validTransition('Resolved', 'Closed')).toBe(true);
    });
    
    it('cancellation path: any state -> Closed', () => {
      const states = ['Created', 'Assigned', 'InProgress', 'Resolved'];
      states.forEach(state => {
        expect(validTransition(state, 'Closed')).toBe(true);
      });
    });
  });
  
  // ============================================
  // テスト5d: 状態機械の性質
  // ============================================
  
  describe('State machine properties', () => {
    it('no cycles except Closed->Closed', () => {
      // Closed以外での自己遷移がないことを確認
      const nonFinalStates = ['Created', 'Assigned', 'InProgress', 'Resolved'];
      nonFinalStates.forEach(state => {
        expect(validTransition(state, state)).toBe(false);
      });
      
      // Closedは自己遷移可能
      expect(validTransition('Closed', 'Closed')).toBe(true);
    });
    
    it('Closed is terminal state', () => {
      // Closedからは他の状態に遷移できない
      const otherStates = ['Created', 'Assigned', 'InProgress', 'Resolved'];
      otherStates.forEach(state => {
        expect(validTransition('Closed', state)).toBe(false);
      });
    });
    
    it('Created is initial state with limited options', () => {
      // Createdからはこの2つの遷移のみ
      expect(validTransition('Created', 'Assigned')).toBe(true);
      expect(validTransition('Created', 'Closed')).toBe(true);
      
      const otherStates = ['InProgress', 'Resolved'];
      otherStates.forEach(state => {
        expect(validTransition('Created', state)).toBe(false);
      });
    });
  });
});
```

---

## テンプレート6：インターフェース互換性テスト（新v2.0.0）

**対象**: VDM-SL仕様と実装コードの対応検証
**テスト目的**: VDM-SL仕様が実装で正確に実現されていることを確認

### VDM-SL入力パターン

```vdm-sl
-- パターン6a: 型対応の検証
Score = nat1
inv s == s >= 1 and s <= 100

-- パターン6b: 関数シグネチャの対応
decide : Ticket -> Score -> Score -> Action
pre decide(ticket, t1, t2) == t1 > t2 and ...
post decide(ticket, t1, t2) == ...
```

### Viestテスト出力

```javascript
import { describe, it, expect } from 'vitest';
import type { Score, Ticket, Action } from './types';
import { decide } from './HybridJudgeAgent';

// ============================================
// テンプレート6：インターフェース互換性テスト（v2.0.0）
// ============================================

describe('VDM-SL Type Implementation Compatibility', () => {
  
  // ============================================
  // テスト6a: TypeScript型対応
  // ============================================
  
  describe('Type correspondences', () => {
    it('Score type is implemented as number', () => {
      const score: Score = 50;
      expect(typeof score).toBe('number');
      expect(Number.isInteger(score)).toBe(true);
    });
    
    it('Score respects nat1 invariant (1-100)', () => {
      const validScores: Score[] = [1, 50, 100];
      validScores.forEach(s => {
        expect(s).toBeGreaterThanOrEqual(1);
        expect(s).toBeLessThanOrEqual(100);
      });
    });
    
    it('Ticket type has required fields', () => {
      const ticket: Ticket = {
        id: 1,
        title: 'Test',
        content: 'Description',
        priority: 5,
        complexity_score: 50
      };
      
      expect(ticket).toHaveProperty('id');
      expect(ticket).toHaveProperty('title');
      expect(ticket).toHaveProperty('content');
      expect(ticket).toHaveProperty('priority');
      expect(ticket).toHaveProperty('complexity_score');
    });
    
    it('Action is union of correct values', () => {
      const validActions: Action[] = ['AutoReply', 'OperatorAndLLM', 'OperatorOnly'];
      validActions.forEach(action => {
        expect(['AutoReply', 'OperatorAndLLM', 'OperatorOnly']).toContain(action);
      });
    });
  });
  
  // ============================================
  // テスト6b: 関数シグネチャの対応
  // ============================================
  
  describe('Function signature implementation', () => {
    it('decide accepts 3 parameters', () => {
      const ticket: Ticket = { id: 1, title: 'Test', content: '', priority: 5, complexity_score: 50 };
      expect(() => decide(ticket, 80, 20)).not.toThrow();
    });
    
    it('decide returns Action type', () => {
      const ticket: Ticket = { id: 1, title: 'Test', content: '', priority: 5, complexity_score: 50 };
      const result = decide(ticket, 80, 20);
      expect(['AutoReply', 'OperatorAndLLM', 'OperatorOnly']).toContain(result);
    });
    
    it('decide parameter types match VDM-SL spec', () => {
      const ticket: Ticket = { id: 1, title: 'Test', content: '', priority: 5, complexity_score: 50 };
      const t1: Score = 80;
      const t2: Score = 20;
      
      expect(typeof ticket).toBe('object');
      expect(typeof t1).toBe('number');
      expect(typeof t2).toBe('number');
      
      expect(() => decide(ticket, t1, t2)).not.toThrow();
    });
  });
  
  // ============================================
  // テスト6c: 前提条件の実装対応
  // ============================================
  
  describe('Precondition implementation', () => {
    const validTicket: Ticket = {
      id: 1,
      title: 'Test',
      content: 'Description',
      priority: 5,
      complexity_score: 50
    };
    
    it('pre(t1 > t2) is enforced', () => {
      // t1 > t2の場合は成功
      expect(() => decide(validTicket, 80, 20)).not.toThrow();
      
      // t1 <= t2の場合はエラー
      expect(() => decide(validTicket, 20, 80)).toThrow();
    });
    
    it('pre(1 <= complexity_score <= 100) is enforced', () => {
      // 有効な複雑度スコア
      expect(() => decide({ ...validTicket, complexity_score: 1 }, 80, 20)).not.toThrow();
      expect(() => decide({ ...validTicket, complexity_score: 100 }, 80, 20)).not.toThrow();
      
      // 無効な複雑度スコア
      expect(() => decide({ ...validTicket, complexity_score: 0 }, 80, 20)).toThrow();
      expect(() => decide({ ...validTicket, complexity_score: 101 }, 80, 20)).toThrow();
    });
  });
  
  // ============================================
  // テスト6d: 後提条件の実装対応
  // ============================================
  
  describe('Postcondition implementation', () => {
    it('post conditions are satisfied for all valid inputs', () => {
      const testCases = [
        { score: 90, t1: 80, t2: 20, expected: 'OperatorOnly' },
        { score: 50, t1: 80, t2: 20, expected: 'OperatorAndLLM' },
        { score: 10, t1: 80, t2: 20, expected: 'AutoReply' },
      ];
      
      testCases.forEach(({ score, t1, t2, expected }) => {
        const ticket: Ticket = { id: 1, title: 'Test', content: '', priority: 5, complexity_score: score };
        const result = decide(ticket, t1, t2);
        expect(result).toBe(expected);
      });
    });
  });
});
```

---

## VDM-SL → JavaScript型変換リファレンス表

| VDM-SL型 | JavaScript/TypeScript型 | 実装方法 | 検証方法 |
|---------|----------------------|---------|---------|
| `nat1` | `number` | `Number.isInteger(x) && x >= 1` | `typeof x === 'number' && x >= 1` |
| `nat0` | `number` | `Number.isInteger(x) && x >= 0` | `typeof x === 'number' && x >= 0` |
| `int` | `number` | 任意の整数 | `Number.isInteger(x)` |
| `bool` | `boolean` | `true \| false` | `typeof x === 'boolean'` |
| `seq of char` | `string` | 文字列リテラル | `typeof x === 'string'` |
| `seq of T` | `Array<T>` | 配列 | `Array.isArray(x)` |
| `set of T` | `Set<T>` | Set | `x instanceof Set` |
| `map T1 to T2` | `Map<T1, T2>` | Map | `x instanceof Map` |
| `T1 \| T2` (Quote) | Union型 / String型 | `'Val1' \| 'Val2'` | `['Val1', 'Val2'].includes(x)` |
| `Record ::` | Interface / Class | `interface {} / class {}` | `x !== null && typeof x === 'object'` |
| `inv expr` | Runtime validator | 関数で検証 | 前提条件/テストで確認 |
| `pre expr` | Guard clause | `if (!cond) throw Error` | テストで確認 |
| `post expr` | Assertion | テストで検証 | テストで確認 |

---

## テスト生成時のベストプラクティス

### 1. テストケースの体系的抽出

```javascript
// ❌ アドホックなテストケース
it('works with score 50', () => { ... });
it('works with score 80', () => { ... });

// ✓ VDM-SLから体系的に抽出
const testCases = [
  // 前提条件を満たさないケース
  { score: 0, t1: 80, t2: 20, shouldThrow: true },
  
  // 各分岐をカバーするケース
  { score: 90, t1: 80, t2: 20, expected: 'OperatorOnly' },
  { score: 50, t1: 80, t2: 20, expected: 'OperatorAndLLM' },
  { score: 10, t1: 80, t2: 20, expected: 'AutoReply' },
  
  // エッジケース
  { score: 80, t1: 80, t2: 20, expected: 'OperatorAndLLM' },
  { score: 20, t1: 80, t2: 20, expected: 'AutoReply' },
];

testCases.forEach(tc => {
  // 各ケースをテスト
});
```

### 2. メッセージプロトコルの網羅的なテスト

```javascript
// すべてのメッセージ型を定義
const allMessageTypes = [
  'TicketCreate', 'TicketUpdate', 'EscalationRequest',
  'ReplyManual', 'MarkComplete', 'EscalateOperator',
  'TicketCreated', 'AutoReply', 'OperatorReply', 'TicketUpdated'
];

// 各メッセージに対応するペイロード型を検証
allMessageTypes.forEach(msgType => {
  it(`validates ${msgType} message`, () => {
    const msg = createMessage(msgType, payloadForType(msgType));
    expect(isValidWsMessage(msg)).toBe(true);
  });
});
```

### 3. 状態遷移の完全性テスト

```javascript
// すべての状態ペアを検証
const states = ['Created', 'Assigned', 'InProgress', 'Resolved', 'Closed'];

states.forEach(from => {
  states.forEach(to => {
    const isValid = validTransition(from, to);
    // VDM-SL定義と一致するか確認
    expect(isValid).toBe(expectedTransition(from, to));
  });
});
```

---

**最終更新**: 2026-04-12  
**バージョン**: 2.0.0  
**メンテナ**: Formal Agent Contracts チーム
