# VDM-SL → TypeScript Conversion Rules / VDM-SL → TypeScript 変換ルール

## Type Conversion / 型の変換

### Basic Types / 基本型

| VDM-SL | TypeScript | Notes / 備考 |
|--------|-----------|------|
| `bool` | `boolean` | |
| `nat` | `number` | Runtime check: `>= 0` / ランタイム検証 |
| `nat1` | `number` | Runtime check: `>= 1` / ランタイム検証 |
| `int` | `number` | |
| `real` | `number` | |
| `char` | `string` | Single character string / 1文字の文字列 |
| `token` | `symbol` または `string` | Branded type recommended / ブランド型推奨 |

Use branded types for stricter nat/nat1 representation: / nat/nat1をより厳密に表現したい場合はブランド型を使用:
```typescript
type Nat = number & { readonly __brand: 'nat' };
type Nat1 = number & { readonly __brand: 'nat1' };

function asNat(n: number): Nat {
  if (!Number.isInteger(n) || n < 0) throw new ContractError(`nat constraint: ${n} < 0`);
  return n as Nat;
}
```

### Compound Types / 複合型

| VDM-SL | TypeScript |
|--------|-----------|
| `seq of T` | `T[]` |
| `seq1 of T` | `T[]` (runtime: `.length > 0`) |
| `set of T` | `Set<T>` |
| `set1 of T` | `Set<T>` (runtime: `.size > 0`) |
| `map K to V` | `Map<K, V>` |
| `[T]` (option) | `T \| null` |
| `T1 \| T2` (union) | `T1 \| T2` |

### Record Types → interface + Factory Function / レコード型

```
VDM-SL:
  User :: name  : seq1 of char
          email : seq1 of char
          age   : nat
  inv u == u.age <= 150;
```

```typescript
/** VDM-SL Record: User */
interface User {
  readonly name: string;
  readonly email: string;
  readonly age: number;
}

/** Invariant: User / 不変条件 */
function invUser(u: User): boolean {
  return u.name.length > 0
    && u.email.length > 0
    && Number.isInteger(u.age) && u.age >= 0
    && u.age <= 150;
}

/** Factory: mk_User / ファクトリ関数 */
function mkUser(name: string, email: string, age: number): User {
  const u: User = { name, email, age };
  if (!invUser(u)) {
    throw new ContractError(`User invariant violated: ${JSON.stringify(u)}`);
  }
  return u;
}
```

### Type Aliases / 型の別名

```
VDM-SL: UserId = nat1;
```

```typescript
type UserId = number;

function isValidUserId(id: number): boolean {
  return Number.isInteger(id) && id >= 1;
}
```

## Function Conversion / 関数の変換

### With Explicit Definition (convert implementation) / 明示的定義あり

```
VDM-SL:
  findUser: UserId * map UserId to User -> User
  findUser(uid, users) == users(uid)
  pre uid in set dom users;
```

```typescript
/**
 * VDM-SL: findUser
 * @pre uid in set dom users
 */
function findUser(uid: UserId, users: Map<UserId, User>): User {
  // Pre-condition
  if (contractsEnabled()) {
    assert(users.has(uid), `Pre-condition failed: uid ${uid} not in dom users`);
  }

  // Implementation (from VDM-SL body)
  const result = users.get(uid)!;

  return result;
}
```

### Implicit Definition (generate stub) / 暗黙的定義

```
VDM-SL:
  sqrt: real -> real
  sqrt(x)
  pre x >= 0
  post RESULT * RESULT = x and RESULT >= 0;
```

```typescript
/**
 * VDM-SL: sqrt (implicit definition)
 * @pre x >= 0
 * @post RESULT * RESULT = x and RESULT >= 0
 */
function sqrt(x: number): number {
  // Pre-condition
  if (contractsEnabled()) {
    assert(x >= 0, `Pre-condition failed: x = ${x} < 0`);
  }

  // TODO: Implement - must satisfy: RESULT * RESULT = x and RESULT >= 0
  const result: number = Math.sqrt(x);

  // Post-condition
  if (contractsEnabled()) {
    assert(
      Math.abs(result * result - x) < 1e-10 && result >= 0,
      `Post-condition failed: result = ${result}`
    );
  }

  return result;
}
```

## Operation Conversion / 操作の変換

Operations modify state, so they are generated as class methods. / 操作は状態を変更するため、クラスのメソッドとして生成する。

```
VDM-SL:
  state UserDB of
    users : map UserId to User
    nextId : UserId
  inv mk_UserDB(users, nextId) == nextId not in set dom users
  init s == s = mk_UserDB({|->}, 1)
  end

  RegisterUser: seq1 of char * Email ==> UserId
  RegisterUser(name, email) == ...
  pre email not in set {users(id).email | id in set dom users}
  post RESULT in set dom users and users(RESULT).name = name
```

```typescript
/** VDM-SL State: UserDB */
class UserDB {
  private _users: Map<UserId, User>;
  private _nextId: UserId;

  constructor() {
    // init s == s = mk_UserDB({|->}, 1)
    this._users = new Map();
    this._nextId = 1;
    this.checkInvariant();
  }

  /** State invariant / 状態不変条件 */
  private checkInvariant(): void {
    if (!contractsEnabled()) return;
    assert(
      !this._users.has(this._nextId),
      `State invariant violated: nextId ${this._nextId} in dom users`
    );
  }

  /** Read-only accessor / 読み取り専用 */
  get users(): ReadonlyMap<UserId, User> { return this._users; }
  get nextId(): UserId { return this._nextId; }

  /**
   * VDM-SL Operation: RegisterUser
   * @pre email not in set {users(id).email | id in set dom users}
   * @post RESULT in set dom users and users(RESULT).name = name
   */
  registerUser(name: string, email: string): UserId {
    // Pre-condition
    if (contractsEnabled()) {
      assert(name.length > 0, 'Pre-condition failed: name must be non-empty (seq1)');
      assert(email.length > 0, 'Pre-condition failed: email must be non-empty (seq1)');
      const existingEmails = new Set([...this._users.values()].map(u => u.email));
      assert(!existingEmails.has(email), `Pre-condition failed: email ${email} already exists`);
    }

    // Implementation
    const uid = this._nextId;
    this._users.set(uid, mkUser(name, email, 0));
    this._nextId = this._nextId + 1;

    // State invariant check
    this.checkInvariant();

    // Post-condition
    if (contractsEnabled()) {
      assert(this._users.has(uid), `Post-condition failed: ${uid} not in dom users`);
      assert(this._users.get(uid)!.name === name, 'Post-condition failed: name mismatch');
    }

    return uid;
  }
}
```

## Contract Verification Infrastructure / 契約検証の基盤コード

Common utilities that all generated files depend on: / 生成ファイルが依存する共通ユーティリティ:

```typescript
// contracts.ts

/** Contract violation error */
export class ContractError extends Error {
  constructor(message: string) {
    super(`[Contract Violation] ${message}`);
    this.name = 'ContractError';
  }
}

/** 契約チェックの有効/無効（環境変数で制御） */
export function contractsEnabled(): boolean {
  return process.env.VDM_CONTRACT_CHECK !== 'off';
}

/** アサーション */
export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new ContractError(message);
  }
}
```

## VDM-SL Expression Mapping Patterns / VDM-SL式の変換パターン

| VDM-SL式 | TypeScript |
|---------|-----------|
| `e in set S` | `S.has(e)` |
| `e not in set S` | `!S.has(e)` |
| `dom m` | `new Set(m.keys())` |
| `rng m` | `new Set(m.values())` |
| `m(k)` | `m.get(k)!` (guaranteed by pre-condition / 事前条件で存在保証) |
| `card S` | `S.size` |
| `len s` | `s.length` |
| `s1 ^ s2` | `[...s1, ...s2]` |
| `hd s` | `s[0]` |
| `tl s` | `s.slice(1)` |
| `m1 munion m2` | `new Map([...m1, ...m2])` |
| `m ++ {k \|-> v}` | `new Map([...m, [k, v]])` |
| `{k} <-: m` | `(() => { const r = new Map(m); r.delete(k); return r; })()` |
| `mk_T(a, b)` | `mkT(a, b)` (via factory function / ファクトリ関数経由) |
| `r.field` | `r.field` |
| `if P then A else B` | `P ? A : B` |
| `let x = e in body` | `(() => { const x = e; return body; })()` |

## Naming Conventions / 命名規則

| VDM-SL | TypeScript |
|--------|-----------|
| `UserId` (type / 型) | `UserId` (type alias) |
| `mk_User` (constructor / コンストラクタ) | `mkUser` (factory function / ファクトリ関数) |
| `inv_User` (invariant / 不変条件) | `invUser` (validation function / 検証関数) |
| `pre_findUser` (pre-condition / 事前条件) | guard clause in function / 関数内のガード節 |
| `RegisterUser` (operation / 操作) | `registerUser` (method, camelCase / メソッド、camelCase) |
| `UserDB` (state / 状態) | `UserDB` (class) |
