# Diff Analysis Rules for Spec-Code Reconciliation

## Overview / 概要

This document defines the rules and heuristics for comparing VDM-SL specification items against actual code implementations. These rules enable systematic, language-agnostic matching between formal specs and code artifacts.

このドキュメントは、VDM-SL仕様項目と実装コードを比較するためのルールとヒューリスティックを定義します。これらのルールは、形式仕様とコード成果物の間での体系的で言語に依存しない照合を可能にします。

---

## Part 1: Type Definition Matching / 第1部: 型定義のマッチング

### Rule T1: Direct Type Correspondence

**EN:** A VDM-SL type definition corresponds to a code type if:
- The code contains a type definition with the same semantic name (accounting for naming conventions)
- The code type has the same structure (fields/properties with same names and types)
- Optional/required markers align with VDM-SL optional fields

**JP:** VDM-SL型定義は、以下の場合にコード型に対応します:
- コードが同じセマンティック名で型定義を含む（命名規則を考慮）
- コード型が同じ構造を持つ（同じ名前と型を持つフィールド/プロパティ）
- オプション/必須マーカーがVDM-SLのオプションフィールドと一致

**Example:**

```
VDM-SL:
  User :: email : String
          name : String
          age : nat
          phone : [String]

Matches (TypeScript):
  interface User {
    email: string;
    name: string;
    age: number;
    phone?: string;  // [String] → phone?
  }

Matches (Python):
  @dataclass
  class User:
    email: str
    name: str
    age: int
    phone: Optional[str] = None
```

### Rule T2: Type Equivalence Classes

**EN:** Map VDM-SL primitive types to language-specific equivalents:

| VDM-SL | TypeScript | Python | Java | C# |
|--------|-----------|--------|------|-----|
| bool | boolean | bool | boolean | bool |
| nat | number | int | int | int |
| int | number | int | int | int |
| rat | number | float | double | double |
| seq of X | X[] | List[X] | List<X> | List<X> |
| set of X | Set<X> | set[X] | Set<X> | HashSet<X> |
| map X to Y | Map<X,Y> | dict[X,Y] | Map<X,Y> | Dictionary<X,Y> |
| [T] (optional) | T \| null | Optional[T] | Optional<T> | T? |
| record | interface/class | dataclass | class/record | class |

**JP:** VDM-SLプリミティブ型を言語固有の同等物にマップ:

[Same table as above]

### Rule T3: Field Name Matching

**EN:** Field names should match exactly after converting to target language convention:
- snake_case (VDM-SL) → camelCase (TypeScript)
- CONSTANT_NAME → constantName
- Allow minor variations if the semantic meaning is identical
- Flag as Partial match if field renamed for clarity

**JP:** フィールド名は対象言語の規則に変換した後、正確に一致する必要があります:
- snake_case (VDM-SL) → camelCase (TypeScript)
- CONSTANT_NAME → constantName
- セマンティック意味が同一の場合、軽微なバリエーションを許可
- 明確化のためにフィールド名が変更された場合、部分一致としてフラグ

**Example:**

```
VDM-SL:
  Account :: account_number : String
            balance : rat

TypeScript Match:
  interface Account {
    accountNumber: string;  // snake_case → camelCase (OK)
    balance: number;
  }

TypeScript Mismatch:
  interface Account {
    id: string;             // renamed (Partial - field renamed)
    balance: number;
  }
```

### Rule T4: Extra Fields in Code

**EN:** If code has fields not in spec:
- Status: ⚠️ Partial (unless field is implementation-only like internal ID)
- Check if field is required for functionality
- If field carries state that affects contracts, flag as ❌ Mismatch
- If field is purely internal (prefixed with `_`, or internal field), allow as ✅ Match

**JP:** コードに仕様にないフィールドがある場合:
- ステータス: ⚠️ 部分一致（フィールドが実装専用（内部IDなど）でない限り）
- フィールドが機能に必要かどうかを確認
- フィールドが契約に影響する状態を持つ場合、❌ 不一致としてフラグ
- フィールドが純粋に内部的（`_`で始まる、または内部フィールド）の場合、✅ 一致を許可

**Example:**

```
VDM-SL:
  User :: email : String
          name : String

TypeScript with extra fields:
  interface User {
    email: string;
    name: string;
    _internalId: string;     // Internal (✅ OK)
    createdAt: Date;         // Extra (⚠️ Partial - not in spec)
    lastModified: Date;      // Extra (⚠️ Partial - not in spec)
  }
```

### Rule T5: Missing Fields in Code

**EN:** If code lacks fields from spec:
- Status: ❌ Mismatch (unless field is optional in VDM-SL with default)
- Check if omission breaks contracts
- If optional field [T] is missing, this might be acceptable
- If required field is missing, this is a bug

**JP:** コードに仕様のフィールドがない場合:
- ステータス: ❌ 不一致（VDM-SLでオプション[T]でデフォルトがない限り）
- 削除が契約を破るかどうかを確認
- オプションフィールド[T]が欠落している場合、受け入れ可能かもしれません
- 必須フィールドが欠落している場合、これはバグです

**Example:**

```
VDM-SL:
  User :: email : String
          name : String
          phone : [String]  -- optional

TypeScript Mismatch (missing required):
  interface User {
    email: string;
    // name is missing ❌ Mismatch - required field
    phone?: string;
  }

TypeScript Match (missing optional):
  interface User {
    email: string;
    name: string;
    // phone is missing ✅ OK - optional field
  }
```

---

## Part 2: Pre-condition Matching / 第2部: 前提条件のマッチング

### Rule P1: Guard Clause Identification

**EN:** A pre-condition is implemented in code as:
1. **Explicit guards** — Early return or throw for invalid input
2. **Type guards** — Type system enforces the condition (e.g., non-null type)
3. **Framework guards** — Validation framework (like Joi, Pydantic) enforces checks
4. **Implicit guards** — Condition is guaranteed by the calling code

**JP:** 前提条件はコードに以下として実装されます:
1. **明示的ガード** — 無効入力のための早期リターンまたはスロウ
2. **型ガード** — 型システムが条件を強制（例：非nullの型）
3. **フレームワークガード** — 検証フレームワークがチェックを強制
4. **暗黙的ガード** — 条件が呼び出しコードによって保証される

**Examples:**

```
VDM-SL pre-condition:
  createUser(name: String) (pre: len name > 0)

TypeScript - Explicit Guard (✅ Match):
  function createUser(name: string) {
    if (name.length === 0) {
      throw new ValidationError('Name cannot be empty');
    }
    // ...
  }

TypeScript - Type Guard (✅ Match):
  function createUser(name: NonEmptyString) {
    // Type system guarantees len > 0
  }

TypeScript - Framework Guard (✅ Match):
  function createUser(name: string) {
    schema.validate({ name }); // Joi schema has min length
    // ...
  }

TypeScript - No Guard (❌ Mismatch):
  function createUser(name: string) {
    db.insert({ name }); // No validation
  }
```

### Rule P2: Condition Logic Equivalence

**EN:** The guard logic must be semantically equivalent to the VDM-SL condition:

- `x > 0` in spec → `x > 0` in code (exact match preferred)
- `x > 0` in spec → `x >= 1` in code (equivalent, ⚠️ Partial)
- `x > 0` in spec → `x > 0.5` in code (not equivalent, ❌ Mismatch)
- `len s > 0` in spec → `s.length > 0` in code (✅ Match)
- `len s > 0` in spec → `s` (truthy check, ⚠️ Partial - weaker)

**JP:** ガード ロジックは VDM-SL条件と意味的に等価である必要があります:

- `x > 0` 仕様 → `x > 0` コード（正確な一致推奨）
- `x > 0` 仕様 → `x >= 1` コード（等価、⚠️ 部分一致）
- `x > 0` 仕様 → `x > 0.5` コード（等価でない、❌ 不一致）
- `len s > 0` 仕様 → `s.length > 0` コード（✅ 一致）
- `len s > 0` 仕様 → `s` (truthy チェック、⚠️ 部分一致 - 弱い)

### Rule P3: Error Type Correspondence

**EN:** When a pre-condition is violated, code should throw an appropriate error:

| VDM-SL Semantics | Expected Error Type | Matches |
|------------------|-------------------|---------|
| Invalid input | ValidationError, ValueError, ArgumentException | ✅ |
| Out of range | RangeError, IndexError, OutOfRangeException | ✅ |
| Type mismatch | TypeError, TypeMismatchException | ✅ |
| Precondition violation | PreconditionError, ContractException | ✅ |
| Generic error | Error, Exception | ⚠️ (too generic) |
| No error thrown | (throws nothing) | ❌ (mismatch) |

**JP:** 前提条件が違反された場合、コードは適切なエラーをスロウすべき:

[Same table as above]

### Rule P4: Error Message Quality

**EN:** Error messages should identify the violated condition:

```
VDM-SL: pre: age >= 0

Good (✅): throw new ValidationError('Age must be non-negative, got ' + age)
Acceptable (⚠️): throw new ValidationError('Invalid age')
Poor (❌): throw new Error('Error')
```

**JP:** エラーメッセージは違反した条件を識別する必要があります:

[Same examples]

### Rule P5: Multiple Pre-conditions

**EN:** If VDM-SL defines multiple pre-conditions:
- Code should check all of them
- Each violation should throw appropriate error
- Each condition may need its own test

**JP:** VDM-SLが複数の前提条件を定義する場合:
- コードはすべてをチェックすべき
- 各違反は適切なエラーをスロウすべき
- 各条件が独自のテストを必要とする場合がある

---

## Part 3: Post-condition Matching / 第3部: 後提条件のマッチング

### Rule C1: Return Value Correspondence

**EN:** A post-condition is implemented in code as:
1. **Return value constraint** — Function returns a value meeting the post-condition
2. **Type constraint** — Return type ensures post-condition is met
3. **State mutation** — Function modifies state meeting post-condition
4. **Side effect** — Function produces observable effects meeting post-condition

**JP:** 後提条件はコードに以下として実装されます:
1. **戻り値制約** — 関数が後提条件を満たす値を返す
2. **型制約** — 戻り型が後提条件が満たされることを確認
3. **状態変異** — 関数が後提条件を満たす状態を変更
4. **副作用** — 関数が後提条件を満たす観測可能な効果を生成

**Example:**

```
VDM-SL post-condition:
  createUser(name: String) -> User
  post: result.name = name and result.id <> nil

TypeScript Implementation (✅ Match):
  function createUser(name: string): User {
    const user: User = {
      id: generateUUID(),
      name: name,
      email: ''
    };
    return user;
    // Returns object with non-nil id and correct name
  }
```

### Rule C2: State Mutation Verification

**EN:** If post-condition involves state change, verify:
- State modification occurs (side effect is present)
- Modification matches post-condition (e.g., element added to list)
- Modification is persistent (survives function return)

**JP:** 後提条件が状態変化を含む場合、確認:
- 状態変更が発生（副作用が存在）
- 変更が後提条件と一致（例：リストに要素を追加）
- 変更は永続的（関数リターンを通して存続）

**Example:**

```
VDM-SL post-condition:
  addUser(user: User) -> ()
  post: user in users

TypeScript Implementation (✅ Match):
  function addUser(user: User): void {
    users.push(user);
    // After function returns, user is in users list
  }

TypeScript Mismatch (❌):
  function addUser(user: User): void {
    const tempUsers = [...users, user];
    // tempUsers is local, not persistent
  }
```

### Rule C3: Return Type Alignment

**EN:** Code return type should match or be more specific than post-condition:

| VDM-SL Return | TypeScript Return | Status |
|---------------|------------------|--------|
| User | User | ✅ Match |
| [User] (optional) | User \| null | ✅ Match |
| seq of User | User[] | ✅ Match |
| User | any | ⚠️ Partial (too generic) |
| User | Promise<User> | ✅ Match (async) |
| () void | void | ✅ Match |

**JP:** コード戻り型は後提条件と一致するか、それより具体的である必要があります:

[Same table]

### Rule C4: Guarantee Verification

**EN:** If post-condition guarantees a property, code should:
1. **Always provide it** — Every code path returns it
2. **Never violate it** — No code path contradicts it
3. **Make it observable** — Property is accessible to caller

**JP:** 後提条件がプロパティを保証する場合、コード:
1. **常にそれを提供** — すべてのコードパスがそれを返す
2. **それを決して違反しない** — コードパスがそれに矛盾しない
3. **それを観測可能にする** — プロパティは呼び出し側がアクセス可能

**Example:**

```
VDM-SL: post: result.id <> nil and len result.name > 0

TypeScript (✅ Match):
  function createUser(name: string): User {
    return {
      id: generateUUID(), // Never nil
      name: name.trim(),  // Always > 0 after trim
      ...
    };
  }

TypeScript (⚠️ Partial):
  function createUser(name: string): User {
    return {
      id: generateUUID(),
      name: name  // Could be empty if input is empty
    };
  }

TypeScript (❌ Mismatch):
  function createUser(name: string): User {
    return {
      id: Math.random() < 0.1 ? null : generateUUID(),  // Can be nil!
      name: name
    };
  }
```

### Rule C5: Exception Handling in Post-conditions

**EN:** If post-condition includes exception case:
- Code may throw exception that matches exception post-condition
- Exception type should be documented
- Exception should prevent state change if promised by post-condition

**JP:** 後提条件が例外ケースを含む場合:
- コードは例外後提条件と一致する例外をスロウ可能
- 例外型はドキュメント化される必要があります
- 例外は後提条件で約束された場合、状態変更を防ぐ必要があります

---

## Part 4: Invariant Matching / 第4部: 不変式のマッチング

### Rule I1: Invariant Enforcement Points

**EN:** A class invariant must be enforced at:
1. **Construction** — All constructor paths establish invariant
2. **Public methods** — All public methods maintain invariant
3. **Mutation points** — All state-changing operations preserve invariant
4. **Finalization** — Invariant holds when object is destroyed

**JP:** クラス不変式は以下で強制される必要があります:
1. **構築** — すべてのコンストラクタパスが不変式を確立
2. **パブリックメソッド** — すべてのパブリックメソッドが不変式を維持
3. **変異ポイント** — すべての状態変更操作が不変式を保存
4. **最終化** — オブジェクトが破棄されるとき、不変式が保持される

**Example:**

```
VDM-SL class invariant:
  Account :: balance : rat
  inv: balance >= 0

TypeScript Enforcement:

// 1. Constructor (✅ established)
class Account {
  private balance: number;

  constructor(initialBalance: number) {
    if (initialBalance < 0) {
      throw new Error('Initial balance must be non-negative');
    }
    this.balance = initialBalance;
  }

  // 2. Public methods (✅ maintained)
  deposit(amount: number): void {
    if (amount < 0) throw new Error('Amount must be positive');
    this.balance += amount;
    // Invariant maintained: was >= 0, added > 0
  }

  withdraw(amount: number): void {
    if (amount < 0 || amount > this.balance) {
      throw new Error('Invalid withdraw amount');
    }
    this.balance -= amount;
    // Invariant maintained: result >= 0
  }

  getBalance(): number {
    return this.balance;
    // Invariant observable
  }
}
```

### Rule I2: Type-Based Invariant Enforcement

**EN:** Some invariants can be enforced by the type system:

```
VDM-SL invariant: balance >= 0

TypeScript type-based (✅ Match):
  class Account {
    balance: NonNegativeNumber;  // Type guarantees >= 0
  }

TypeScript runtime-based (✅ Match):
  class Account {
    private balance: number;
    private validateBalance() {
      if (this.balance < 0) throw Error('...');
    }
  }

TypeScript unenfaced (❌ Mismatch):
  class Account {
    balance: number;  // No invariant enforcement
  }
```

**JP:** 型システムで一部の不変式を強制できます:

[Same examples]

### Rule I3: Invariant at All Mutation Points

**EN:** For each mutation point (setter, state change), verify:
1. **Pre-check** — Guard prevents invariant violation
2. **Post-check** — Invariant verified after mutation
3. **Atomic** — Mutation is atomic (no intermediate state violates invariant)

**JP:** 各変異ポイント（setter、状態変更）について、確認:
1. **プリチェック** — ガードが不変式違反を防止
2. **ポストチェック** — 不変式が変異後に検証される
3. **アトミック** — 変異がアトミック（中間状態が不変式を違反しない）

**Example:**

```
VDM-SL invariant: age >= 0 and age < 150

TypeScript (✅ Match):
  class User {
    private age: number;

    setAge(newAge: number): void {
      if (newAge < 0 || newAge >= 150) {
        throw new Error('Age out of valid range');
      }
      this.age = newAge;
      // Invariant checked before mutation
    }
  }

TypeScript (⚠️ Partial):
  class User {
    age: number;  // No check on assignment

    validateAge(): boolean {
      return this.age >= 0 && this.age < 150;
    }
    // Validation exists but not enforced at mutation
  }

TypeScript (❌ Mismatch):
  class User {
    age: number;  // No enforcement at all
  }
```

### Rule I4: Constructor Invariant Establishment

**EN:** Constructor must establish invariant for all paths:

```
VDM-SL:
  User :: age : nat
  inv age >= 0

TypeScript (✅ Match):
  class User {
    age: number;
    constructor(age: number) {
      if (age < 0) throw new Error('Age must be non-negative');
      this.age = age;
    }
  }

TypeScript (❌ Mismatch):
  class User {
    age: number;
    constructor(age: number) {
      // Accepts negative age!
      this.age = age;
    }
  }
```

**JP:** コンストラクタはすべてのパスについて不変式を確立する必要があります:

[Same examples]

### Rule I5: Invariant Visibility and Testing

**EN:** Invariants should be:
1. **Documented** — Code comments reference VDM-SL invariant
2. **Testable** — Invariant validation can be called in tests
3. **Reportable** — Violations produce clear error messages
4. **Observable** — Invariant state can be inspected (if needed)

**JP:** 不変式は以下である必要があります:
1. **ドキュメント化** — コードコメントがVDM-SL不変式を参照
2. **テスト可能** — 不変式検証はテストで呼び出し可能
3. **レポート可能** — 違反は明確なエラーメッセージを生成
4. **観測可能** — 不変式の状態を検査可能（必要な場合）

---

## Part 5: Indirect/Implicit Implementation / 第5部: 間接的/暗黙的実装

### Rule I1: Framework-Based Implementation

**EN:** A spec item may be implemented indirectly through:
- **Validation frameworks** — (Joi, Yup, Pydantic, Zod) enforce pre-conditions
- **Type systems** — (TypeScript, Kotlin, Rust) encode invariants
- **ORM constraints** — (Sequelize, SQLAlchemy, Hibernate) enforce DB-level invariants
- **Middleware** — (Express, FastAPI) enforce guards before handler

**JP:** 仕様項目は以下を通じて間接的に実装される場合があります:
- **検証フレームワーク** — (Joi, Yup, Pydantic, Zod) 前提条件を強制
- **型システム** — (TypeScript, Kotlin, Rust) 不変式をエンコード
- **ORM制約** — (Sequelize, SQLAlchemy, Hibernate) DBレベル不変式を強制
- **ミドルウェア** — (Express, FastAPI) ハンドラー前のガードを強制

**Example:**

```
VDM-SL:
  createUser(email: String, age: nat)
  pre: len email > 0 and age >= 18

TypeScript with Joi validation (✅ Match - framework-based):
  const schema = Joi.object({
    email: Joi.string().min(1).required(),
    age: Joi.number().min(18).required()
  });

  router.post('/users', (req, res) => {
    const { error, value } = schema.validate(req.body);
    if (error) throw new ValidationError(error.message);
    // Framework enforced the pre-condition
  });
```

### Rule I2: Type-System-Based Implementation

**EN:** Invariants can be encoded in types without explicit runtime checks:

```
VDM-SL invariant: balance >= 0

TypeScript - Type-encoded (✅ Match):
  type NonNegativeNumber = number & { readonly __brand: 'NonNegativeNumber' };
  class Account {
    balance: NonNegativeNumber;
  }
  // Type system prevents invalid construction

Python - Pydantic (✅ Match):
  class Account(BaseModel):
    balance: float = Field(ge=0)  # ge = greater than or equal
```

**JP:** 不変式は明示的なランタイムチェックなしで型にエンコード可能:

[Same examples]

### Rule I3: Implicit Contract (Implicit Guards)

**EN:** A guard may be implicit if:
- The calling code is expected to maintain the invariant
- Documentation clearly states this assumption
- The contract is part of the API design

Mark as: ⚠️ Partial (implicit, requires documentation) or 🔍 Not Found (unclear)

**JP:** ガードが以下の場合は暗黙的:
- 呼び出しコードが不変式を維持することが期待される
- ドキュメントがこの仮定を明確に述べている
- 契約がAPI設計の一部である

マーク: ⚠️ 部分一致（暗黙的、ドキュメント化が必要）または 🔍 見つからない（不明確）

**Example:**

```
VDM-SL:
  updateBalance(amount: rat)
  pre: amount > 0

TypeScript with implicit pre-condition (⚠️ Partial):
  /**
   * Adds amount to balance.
   * PRECONDITION: amount must be positive.
   * (Caller is responsible for validation)
   */
  updateBalance(amount: number): void {
    this.balance += amount;
  }

TypeScript with explicit pre-condition (✅ Match):
  updateBalance(amount: PositiveNumber): void {
    this.balance += amount;
  }
```

---

## Part 6: Status Classification Criteria / 第6部: ステータス分類基準

### Status Code: ✅ Match

**EN:** Use when:
- Type definitions align perfectly
- Pre-condition guard matches exactly
- Post-condition implementation is complete
- Invariant is enforced at all required points
- No discrepancies or gaps

**JP:** 以下の場合に使用:
- 型定義が完全に一致
- 前提条件ガードが正確に一致
- 後提条件実装が完了
- 不変式がすべての必須ポイントで強制される
- 不一致またはギャップがない

### Status Code: ⚠️ Partial

**EN:** Use when:
- Implementation exists but is weaker than spec
- Some fields/conditions implemented, others missing
- Implementation is implicit (requires documentation)
- Type differences exist but are functionally equivalent
- Implementation is incomplete but partially correct

**JP:** 以下の場合に使用:
- 実装は存在するが仕様より弱い
- 一部のフィールド/条件は実装されているが、他は欠落
- 実装は暗黙的（ドキュメント化が必要）
- 型の違いが存在するが、機能的に等価
- 実装は不完全だが、部分的に正しい

### Status Code: ❌ Mismatch

**EN:** Use when:
- Implementation contradicts spec
- Required guard is completely missing
- Type definition is incompatible
- Invariant is violated or unenforced
- Implementation exists but is fundamentally wrong

**JP:** 以下の場合に使用:
- 実装が仕様と矛盾
- 必須ガードが完全に欠落
- 型定義が互換性がない
- 不変式が違反または未強制
- 実装は存在するが、根本的に間違っている

### Status Code: 🔍 Not Found

**EN:** Use when:
- No corresponding code found for spec item
- Spec item is completely unimplemented
- Function doesn't exist in codebase
- Class is missing entirely

**JP:** 以下の場合に使用:
- 仕様項目に対応するコードが見つからない
- 仕様項目が完全に未実装
- 関数がコードベースに存在しない
- クラスが完全に欠落している

---

## Part 7: Language-Specific Matching / 第7部: 言語固有のマッチング

### TypeScript/JavaScript Specific Rules

**EN:**
- Use `interface` or `type` for VDM-SL record types
- Use `string | null` or `string | undefined` for optional [String]
- Use `const X: NonEmptyString = ...` for branded types
- Use `Readonly<>` for immutable/constant fields
- Use `as const` for literal type enforcement
- Guard clauses should appear before state modification

**JP:**
- VDM-SL record型に `interface` または `type` を使用
- オプション [String] に `string | null` または `string | undefined` を使用
- ブランド付き型には `const X: NonEmptyString = ...` を使用
- イミュータブル/定数フィールドに `Readonly<>` を使用
- リテラル型強制に `as const` を使用
- ガード句は状態変更前に表示される必要があります

### Python Specific Rules

**EN:**
- Use `@dataclass` for VDM-SL record types
- Use `Optional[T]` for optional [T]
- Use `Field(ge=0)` in Pydantic for invariants
- Use `@property` for read-only access
- Use docstring for pre/post-conditions
- Use `Literal` types for enum-like fields

**JP:**
- VDM-SL record型に `@dataclass` を使用
- オプション [T] に `Optional[T]` を使用
- 不変式に Pydantic の `Field(ge=0)` を使用
- 読み取り専用アクセスに `@property` を使用
- 前/後提条件に docstring を使用
- enum様フィールドに `Literal` 型を使用

### Java Specific Rules

**EN:**
- Use `class` or `record` for VDM-SL record types
- Use `Optional<T>` for optional [T]
- Use `@NotNull`, `@Min(0)` annotations for invariants
- Use `@Override` for method contracts
- Use checked exceptions for contract violations
- Use `final` for immutable fields

**JP:**
- VDM-SL record型に `class` または `record` を使用
- オプション [T] に `Optional<T>` を使用
- 不変式に `@NotNull`, `@Min(0)` アノテーションを使用
- メソッド契約に `@Override` を使用
- 契約違反に checked exceptions を使用
- イミュータブルフィールドに `final` を使用

---

## Example Matching Exercise / マッチング演習例

### Scenario: User Creation Specification

```
VDM-SL Spec:

  User :: email : String
          name : String
          age : nat

  createUser(email: String, name: String, age: nat) -> User
  pre: len email > 0 and len name > 0 and age >= 18
  post: result.email = email and result.name = name and result.age = age

  inv User :: email <> "" and len name > 0 and age >= 0
```

### TypeScript Code:

```typescript
interface User {
  email: string;
  name: string;
  age: number;
}

function createUser(email: string, name: string, age: number): User {
  if (!email || email.trim() === '') {
    throw new Error('Email required');
  }
  if (!name || name.trim() === '') {
    throw new Error('Name required');
  }
  if (age < 18) {
    throw new RangeError('Age must be 18+');
  }
  return { email, name, age };
}
```

### Matching Analysis:

| Item | Analysis | Status |
|------|----------|--------|
| User type | All three fields present, types match (string/string/number = String/String/nat) | ✅ Match |
| email field | Present, string type matches | ✅ Match |
| name field | Present, string type matches | ✅ Match |
| age field | Present, number type matches nat | ✅ Match |
| createUser pre (email) | Guard checks email non-empty, matches "len email > 0" | ✅ Match |
| createUser pre (name) | Guard checks name non-empty, matches "len name > 0" | ⚠️ Partial (truthy check weaker than length check) |
| createUser pre (age) | Guard checks age >= 18, matches spec | ✅ Match |
| createUser post | Returns User object with correct fields | ✅ Match |
| email invariant | Type system + guard prevent empty | ✅ Match |
| name invariant | Guard prevents empty (⚠️ like pre-condition) | ⚠️ Partial |
| age invariant | Constructor checks age >= 18, stronger than inv age >= 0 | ✅ Match |

---

## End of Diff Analysis Rules

