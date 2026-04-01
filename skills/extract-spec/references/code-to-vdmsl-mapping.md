# Code to VDM-SL Mapping Guide

This guide provides comprehensive mapping rules for converting code constructs to VDM-SL
specifications. Use these rules during the extraction process to generate provisional
VDM-SL from source code.

<!-- 日本語 -->

このガイドは、コード構文をVDM-SL仕様に変換するための包括的なマッピングルールを提供します。
抽出プロセス中にこれらのルールを使用して、ソースコードから暫定VDM-SLを生成します。

## Table of Contents

1. [TypeScript/JavaScript Mappings](#typescriptjavascript-mappings)
2. [Python Mappings](#python-mappings)
3. [Java Mappings](#java-mappings)
4. [Pre-condition Extraction Patterns](#pre-condition-extraction-patterns)
5. [Post-condition Extraction Patterns](#post-condition-extraction-patterns)
6. [Invariant Extraction Patterns](#invariant-extraction-patterns)
7. [Special Cases](#special-cases)

---

## TypeScript/JavaScript Mappings

### Type System Mappings

#### Simple Types

| TypeScript | VDM-SL | Notes |
|-----------|--------|-------|
| `string` | `seq of char` or `seq1 of char` | Use `seq1 of char` if non-empty |
| `number` | `int` or `nat` or `nat1` | `nat` for non-negative, `nat1` for positive |
| `boolean` | `bool` | Direct mapping |
| `any` | Don't map; flag as [QUESTION] | Indicates missing type information |
| `void` | No return type in function signature | Operation with no return value |
| `null` \| `undefined` | Optional type `[T]` | Part of union handling below |

<!-- 日本語 -->

| TypeScript | VDM-SL | 注釈 |
|-----------|--------|------|
| `string` | `seq of char` または `seq1 of char` | 空でない場合は `seq1 of char` を使う |
| `number` | `int` または `nat` または `nat1` | `nat` は非負、 `nat1` は正 |
| `boolean` | `bool` | 直接対応 |
| `any` | マップしない；[QUESTION]としてフラグ | 型情報がないことを示す |
| `void` | 関数シグネチャに戻り値がない | 戻り値のない操作 |
| `null` \| `undefined` | オプション型 `[T]` | 下記の合併型処理の一部 |

#### Interface Mapping

**TypeScript:**
```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
  role: "admin" | "user" | "guest";
}
```

**VDM-SL:**
```vdmsl
-- [PROVISIONAL] Extracted from interfaces/User.ts lines 1-8
types
  UserId = nat1;
  UserName = seq1 of char;
  Email = seq1 of char;
  UserRole = <ADMIN> | <USER> | <GUEST>;
  User :: id : UserId
           name : UserName
           email : Email
           age : [nat]
           role : UserRole
  inv user == true;  -- [QUESTION] Are there constraints on User fields?
```

**Mapping Rules:**
- Top-level interface → record type
- `string` field → `seq1 of char` (or `seq of char` if empty is allowed)
- `number` field → `nat1` or `nat` (use `nat1` for positive integers like IDs)
- `boolean` field → `bool`
- Optional field (suffix `?`) → Optional type `[T]`
- String union (`"a" | "b" | "c"`) → Quote union `<A> | <B> | <C>`
- Nested interface → Define as separate record type, reference in parent

<!-- 日本語 -->

**マッピングルール:**
- トップレベルインターフェース → レコード型
- `string` フィールド → `seq1 of char` （または空が許容される場合は `seq of char` ）
- `number` フィールド → `nat1` または `nat` （IDのような正の整数には `nat1` を使う）
- `boolean` フィールド → `bool`
- オプショナルフィールド（サフィックス `?`） → オプション型 `[T]`
- 文字列合併（ `"a" | "b" | "c"` ） → クォート合併 `<A> | <B> | <C>`
- ネストされたインターフェース → 別のレコード型として定義。親で参照

#### Type Alias Mapping

**TypeScript:**
```typescript
type Email = string & { readonly __brand: "Email" };
type Age = number;
type Status = "active" | "inactive" | "pending";
```

**VDM-SL:**
```vdmsl
-- [PROVISIONAL] type aliases from types/User.ts
types
  Email = seq1 of char;
  -- [QUESTION] Should Email have validation constraints?

  Age = nat;
  -- [QUESTION] Should Age have upper/lower bounds?

  Status = <ACTIVE> | <INACTIVE> | <PENDING>;
```

#### Enum Mapping

**TypeScript:**
```typescript
enum UserRole {
  Admin = "admin",
  User = "user",
  Guest = "guest"
}
```

**VDM-SL:**
```vdmsl
-- [PROVISIONAL] Enum from enums/UserRole.ts
types
  UserRole = <ADMIN> | <USER> | <GUEST>;
```

#### Optional Type Mapping

**TypeScript:**
```typescript
interface User {
  name: string;
  middle_name?: string;
  nickname: string | null;
  profile: string | undefined;
}
```

**VDM-SL:**
```vdmsl
-- [PROVISIONAL] Optional types from User interface
types
  User :: name : seq1 of char
          middle_name : [seq1 of char]
          nickname : [seq1 of char]
          profile : [seq1 of char];
```

**Rules:**
- `T | null` or `T | undefined` or `T?` → `[T]` (optional type)
- Use optional type for fields that may be absent
- Zero-argument constructor signals absence in VDM-SL

#### Union Type Mapping

**TypeScript:**
```typescript
type Result = { status: "success"; data: User } |
             { status: "error"; message: string };
```

**VDM-SL:**
```vdmsl
-- [PROVISIONAL] Tagged union from types/Result.ts
types
  Result = SuccessResult | ErrorResult;
  SuccessResult :: data : User;
  ErrorResult :: message : seq1 of char;
```

<!-- 日本語 -->

```vdmsl
-- [PROVISIONAL] タグ付き合併 types/Result.tsから
types
  Result = SuccessResult | ErrorResult;
  SuccessResult :: data : User;
  ErrorResult :: message : seq1 of char;
```

**Rules:**
- Tagged unions → separate record types combined with union
- Untagged unions → use union type `T1 | T2 | T3`

#### Array/Collection Mapping

**TypeScript:**
```typescript
interface Repository {
  users: User[];
  user_ids: number[];
  tags: Set<string>;
  metadata: Map<string, any>;
  indexed: Record<string, number>;
}
```

**VDM-SL:**
```vdmsl
-- [PROVISIONAL] Collections from Repository interface
types
  Repository :: users : seq of User
               user_ids : seq of nat1
               tags : set of (seq1 of char)
               metadata : map seq1 of char to seq of char
               indexed : map seq1 of char to int;
```

**Rules:**
- `T[]` → `seq of T`
- `T[]` with minimum length → `seq1 of T` (non-empty)
- `Set<T>` → `set of T`
- `Map<K, V>` or `Record<K, V>` → `map K to V`
- For `Record<string, T>`, use `map seq1 of char to T`
- `[T, U, V]` (fixed tuple) → Define as record type

#### Class Mapping

**TypeScript:**
```typescript
class UserService {
  private users: Map<number, User>;

  constructor(initialUsers?: User[]) { }

  addUser(user: User): boolean { }
  findUser(id: number): User | null { }
  removeUser(id: number): void { }
  getAllUsers(): User[] { }
}
```

**VDM-SL:**
```vdmsl
-- [PROVISIONAL] Class UserService from services/UserService.ts
module UserService
  definitions
    types
      ServiceState :: users : map nat1 to User;

    operations
      -- Constructor: initialize with optional users
      Init: seq of User ==> UserService
      Init(initialUsers) ==
        users := {i |-> initialUsers(i) | i in set inds initialUsers}
      post dom users = inds initialUsers;

      -- Add a user
      AddUser: User ==> bool
      AddUser(user) ==
        (if user.id not in set dom users then
          (users(user.id) := user;
           return true)
         else
          return false)
      pre user.id > 0
      post users = old users union {user.id |-> user} or users = old users;

      -- Find a user
      FindUser: nat1 ==> [User]
      FindUser(id) ==
        if id in set dom users
        then return users(id)
        else return nil
      post RESULT = users(id) if id in set dom users else nil;

      -- Remove a user
      RemoveUser: nat1 ==> ()
      RemoveUser(id) ==
        if id in set dom users then
          delete users(id)
      post id not in set dom users;

      -- Get all users
      GetAllUsers: () ==> seq of User
      GetAllUsers() ==
        return [users(i) | i in set dom users]
      post len RESULT = card dom users;

  state UserServiceState of
    users : map nat1 to User
  end
end UserService
```

**Rules:**
- Class → VDM-SL module
- Private fields → State component (section `state ... of ... end`)
- Constructor → `Init` operation
- Public methods → operations or functions
- Methods with side effects → operations
- Getters returning data → functions (if no state change)

---

## Python Mappings

### Type System Mappings

#### Simple Types

| Python | VDM-SL | Notes |
|--------|--------|-------|
| `str` | `seq of char` or `seq1 of char` | Use `seq1 of char` if non-empty |
| `int` | `int` or `nat` or `nat1` | Check range; use `nat`/`nat1` for non-negative |
| `float` | Not directly supported in VDM-SL | Flag as [QUESTION]; may require discretization |
| `bool` | `bool` | Direct mapping |
| `None` | Optional type `[T]` | Part of union handling |
| `Any` | Don't map; flag as [QUESTION] | Missing type information |

<!-- 日本語 -->

| Python | VDM-SL | 注釈 |
|--------|--------|------|
| `str` | `seq of char` または `seq1 of char` | 空でない場合は `seq1 of char` を使う |
| `int` | `int` または `nat` または `nat1` | 範囲を確認；非負の場合は `nat`/`nat1` を使う |
| `float` | VDM-SLで直接サポートなし | [QUESTION]としてフラグ。離散化が必要な場合もある |
| `bool` | `bool` | 直接対応 |
| `None` | オプション型 `[T]` | 合併型処理の一部 |
| `Any` | マップしない；[QUESTION]としてフラグ | 型情報がない |

#### Dataclass Mapping

**Python:**
```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class User:
    id: int
    name: str
    email: str
    age: Optional[int] = None
    role: str = "user"
```

**VDM-SL:**
```vdmsl
-- [PROVISIONAL] Dataclass User from models/user.py lines 5-14
types
  UserId = nat1;
  UserName = seq1 of char;
  Email = seq1 of char;
  UserRole = seq1 of char;  -- [QUESTION] Is role constrained to specific values?

  User :: id : UserId
          name : UserName
          email : Email
          age : [nat]
          role : UserRole
  inv user == user.id > 0 and len user.name > 0 and len user.email > 0;
```

#### Optional Type Mapping

**Python:**
```python
from typing import Optional

def get_user(user_id: int) -> Optional[User]:
    ...

class Profile:
    bio: Optional[str]
    website: Optional[str]
```

**VDM-SL:**
```vdmsl
-- [PROVISIONAL] Optional types
types
  UserOptional = [User];

  Profile :: bio : [seq1 of char]
            website : [seq1 of char];
```

#### Union Type Mapping

**Python:**
```python
from typing import Union

Result = Union[User, str]  # Success or error message
Status = Union[int, str]   # ID or status name
```

**VDM-SL:**
```vdmsl
-- [PROVISIONAL] Union types from types.py
types
  Result = User | seq1 of char;
  -- [QUESTION] Which variant indicates success, which error?

  Status = nat1 | seq1 of char;
```

#### List Type Mapping

**Python:**
```python
from typing import List

users: List[User] = []
ids: List[int]
non_empty: List[str]  # Documented as non-empty
```

**VDM-SL:**
```vdmsl
-- [PROVISIONAL] List types from models.py
types
  UserList = seq of User;
  IdList = seq of nat1;
  NonEmptyStringList = seq1 of (seq1 of char);
  -- [IMPLICIT] Constraint inferred from documentation
```

#### Dict/Mapping Type Mapping

**Python:**
```python
from typing import Dict

user_map: Dict[int, User] = {}
config: Dict[str, str]
```

**VDM-SL:**
```vdmsl
-- [PROVISIONAL] Dict/Map types from models.py
types
  UserMap = map nat1 to User;
  ConfigMap = map seq1 of char to seq1 of char;
```

#### Enum Mapping

**Python:**
```python
from enum import Enum

class UserRole(Enum):
    ADMIN = "admin"
    USER = "user"
    GUEST = "guest"

class Status(Enum):
    PENDING = 1
    ACTIVE = 2
    INACTIVE = 3
```

**VDM-SL:**
```vdmsl
-- [PROVISIONAL] Enums from enums/roles.py
types
  UserRole = <ADMIN> | <USER> | <GUEST>;
  Status = <PENDING> | <ACTIVE> | <INACTIVE>;
```

#### Class Mapping

**Python:**
```python
class UserRepository:
    def __init__(self):
        self._users: Dict[int, User] = {}

    def add_user(self, user: User) -> bool:
        ...

    def get_user(self, user_id: int) -> Optional[User]:
        ...

    def remove_user(self, user_id: int) -> None:
        ...
```

**VDM-SL:**
```vdmsl
-- [PROVISIONAL] Class UserRepository from repositories/user.py
module UserRepository
  definitions
    types
      RepositoryState :: users : map nat1 to User;

    operations
      -- Constructor
      Init: () ==> UserRepository
      Init() ==
        users := {}
      post users = {};

      -- Add a user
      AddUser: User ==> bool
      AddUser(user) ==
        if user.id not in set dom users then
          (users(user.id) := user;
           return true)
        else
          return false
      pre user.id > 0
      post users = old users union {user.id |-> user} or users = old users;

      -- Get a user
      GetUser: nat1 ==> [User]
      GetUser(user_id) ==
        if user_id in set dom users
        then return users(user_id)
        else return nil
      post RESULT = users(user_id) if user_id in set dom users else nil;

      -- Remove a user
      RemoveUser: nat1 ==> ()
      RemoveUser(user_id) ==
        if user_id in set dom users then
          delete users(user_id)
      post user_id not in set dom users;

  state UserRepositoryState of
    users : map nat1 to User
  end
end UserRepository
```

---

## Java Mappings

### Type System Mappings

#### Simple Types

| Java | VDM-SL | Notes |
|------|--------|-------|
| `String` | `seq of char` or `seq1 of char` | Use `seq1 of char` if non-empty |
| `int`, `long`, `Integer` | `int` or `nat` or `nat1` | Check for null/Optional |
| `boolean`, `Boolean` | `bool` | Check for null/Optional |
| `double`, `float` | Not directly supported | Flag as [QUESTION] |
| `void` | No return type | Operation with no return |
| `null` | Part of optional handling | Use `[T]` for nullable types |

#### Class Mapping

**Java:**
```java
public class User {
    private int id;
    private String name;
    private String email;
    private Integer age;

    public User(int id, String name, String email) { }
    public int getId() { return id; }
    public void setEmail(String email) { }
}
```

**VDM-SL:**
```vdmsl
-- [PROVISIONAL] Class User from User.java lines 1-15
module User
  definitions
    types
      User :: id : nat1
              name : seq1 of char
              email : seq1 of char
              age : [nat];

    operations
      -- Constructor
      Init: nat1 * seq1 of char * seq1 of char ==> User
      Init(user_id, user_name, user_email) ==
        (id := user_id;
         name := user_name;
         email := user_email;
         age := nil)
      pre user_id > 0 and len user_name > 0 and len user_email > 0;

      -- Getter: getId
      GetId: () ==> nat1
      GetId() == return id;

      -- Setter: setEmail
      SetEmail: seq1 of char ==> ()
      SetEmail(new_email) ==
        email := new_email
      pre len new_email > 0
      post email = new_email;

  state UserState of
    id : nat1
    name : seq1 of char
    email : seq1 of char
    age : [nat]
  end
end User
```

#### Interface Mapping

**Java:**
```java
public interface UserRepository {
    boolean addUser(User user);
    User getUser(int id);
    void removeUser(int id);
    List<User> getAllUsers();
}
```

**VDM-SL:**
```vdmsl
-- [PROVISIONAL] Interface UserRepository from UserRepository.java
module UserRepository
  definitions
    types
      User :: /* ... */;

    operations
      AddUser: User ==> bool;
      GetUser: nat1 ==> [User];
      RemoveUser: nat1 ==> ();
      GetAllUsers: () ==> seq of User;
end UserRepository
```

---

## Pre-condition Extraction Patterns

Pre-conditions specify what must be true BEFORE an operation is called.

### Pattern 1: If-Guard Protecting Operation

**Code:**
```typescript
function updateUser(userId: number, data: UserData): boolean {
  if (userId <= 0) throw new Error("Invalid user ID");
  if (!data.name || data.name.trim() === "") throw new Error("Name required");
  // ... perform update
  return true;
}
```

**Extracted Pre-condition:**
```vdmsl
-- [PROVISIONAL] Pre-condition from updateUser (lines 1-6)
operations
  UpdateUser: nat1 * UserData ==> bool
  UpdateUser(userId, data) ==
    // ...
  pre userId > 0 and len data.name > 0;
  -- [IMPLICIT] Constraints inferred from guard clauses
```

### Pattern 2: Type Constraints

**Code:**
```python
def send_message(user_id: int, content: str) -> bool:
    assert user_id > 0, "User ID must be positive"
    assert len(content) > 0, "Message cannot be empty"
    assert len(content) <= 1000, "Message too long"
    # ...
```

**Extracted Pre-condition:**
```vdmsl
-- [PROVISIONAL] Pre-condition from send_message (lines 1-5)
SendMessage: nat1 * MessageContent ==> bool
SendMessage(user_id, content) ==
  // ...
pre user_id > 0 and 0 < len content and len content <= 1000;
```

### Pattern 3: State-Based Precondition

**Code:**
```typescript
class UserManager {
  private users: Map<number, User>;

  addUser(user: User): boolean {
    if (this.users.has(user.id)) {
      throw new Error("User already exists");
    }
    // ...
  }
}
```

**Extracted Pre-condition:**
```vdmsl
-- [PROVISIONAL] Pre-condition from addUser (state-dependent)
AddUser: User ==> bool
AddUser(user) ==
  // ...
pre user.id not in set dom users;
-- [IMPLICIT] Constraint inferred from guard checking existing state
```

### Pattern 4: Null/Undefined Checks

**Code:**
```typescript
function processUser(user: User | null): string {
  if (user === null) {
    throw new Error("User is required");
  }
  // ...
}
```

**Extracted Pre-condition:**
```vdmsl
-- [PROVISIONAL] Non-null precondition from processUser
ProcessUser: User ==> seq1 of char
ProcessUser(user) ==
  // ...
pre user <> nil;
-- [QUESTION] Should null/undefined be permitted as input type?
```

---

## Post-condition Extraction Patterns

Post-conditions specify what is guaranteed to be true AFTER an operation succeeds.

### Pattern 1: Return Value Constraint

**Code:**
```typescript
function getUserCount(): number {
  return this.users.size;
}
```

**Extracted Post-condition:**
```vdmsl
-- [PROVISIONAL] Post-condition from getUserCount
GetUserCount: () ==> nat
GetUserCount() ==
  return card dom users
post RESULT = card dom users;
```

### Pattern 2: State Mutation

**Code:**
```typescript
function addUser(user: User): void {
  this.users.set(user.id, user);
}
```

**Extracted Post-condition:**
```vdmsl
-- [PROVISIONAL] Post-condition from addUser (state mutation)
AddUser: User ==> ()
AddUser(user) ==
  users(user.id) := user
post users = old users union {user.id |-> user};
```

### Pattern 3: Collection Modification

**Code:**
```python
def append_item(self, item: Item) -> int:
    self.items.append(item)
    return len(self.items)
```

**Extracted Post-condition:**
```vdmsl
-- [PROVISIONAL] Post-condition from append_item
AppendItem: Item ==> nat1
AppendItem(item) ==
  (items := items ^ [item];
   return len items)
post len items = len old items + 1 and RESULT = len items;
```

### Pattern 4: Transactional Guarantee

**Code:**
```typescript
async function deleteUser(userId: number): Promise<boolean> {
  const deleted = await db.delete("users", userId);
  if (!deleted) return false;

  await cache.invalidate(`user:${userId}`);
  return true;
}
```

**Extracted Post-condition:**
```vdmsl
-- [PROVISIONAL] Post-condition from deleteUser (transactional)
DeleteUser: nat1 ==> bool
DeleteUser(userId) ==
  // ...
post (RESULT = true => userId not in set dom users and cache_invalidated);
-- [IMPLICIT] Transactional semantics inferred from async logic
-- [QUESTION] What is the behavior if cache invalidation fails?
```

---

## Invariant Extraction Patterns

Invariants specify conditions that are ALWAYS true for an object or system.

### Pattern 1: Constructor Validation

**Code:**
```typescript
class User {
  id: number;
  email: string;

  constructor(id: number, email: string) {
    if (id <= 0) throw new Error("Invalid ID");
    if (!email.includes("@")) throw new Error("Invalid email");
    this.id = id;
    this.email = email;
  }
}
```

**Extracted Invariant:**
```vdmsl
-- [PROVISIONAL] Invariant from User constructor
types
  User :: id : nat1
          email : seq1 of char
  inv user == user.id > 0 and "@" in elems user.email;
```

### Pattern 2: Validation Decorator

**Code (TypeScript with class-validator):**
```typescript
import { IsEmail, IsPositive, Min, Max } from "class-validator";

class UserDTO {
  @IsPositive()
  id: number;

  @Min(18)
  @Max(120)
  age: number;

  @IsEmail()
  email: string;
}
```

**Extracted Invariant:**
```vdmsl
-- [PROVISIONAL] Invariants from validation decorators
types
  UserDTO :: id : nat1
            age : nat1
            email : seq1 of char
  inv user == user.id > 0 and
              user.age >= 18 and user.age <= 120 and
              "@" in elems user.email;
  -- [IMPLICIT] Constraints inferred from @decorators
```

### Pattern 3: Schema Validation (Pydantic)

**Code (Python):**
```python
from pydantic import BaseModel, EmailStr, validator

class UserModel(BaseModel):
    id: int
    name: str
    email: EmailStr
    age: int

    @validator("age")
    def age_must_be_valid(cls, v):
        if v < 0 or v > 150:
            raise ValueError("Age must be between 0 and 150")
        return v

    class Config:
        frozen = True  # Immutable
```

**Extracted Invariant:**
```vdmsl
-- [PROVISIONAL] Invariants from Pydantic model
types
  User :: id : nat1
          name : seq1 of char
          email : seq1 of char
          age : nat1
  inv user == user.id > 0 and
              len user.name > 0 and
              "@" in elems user.email and
              user.age >= 0 and user.age <= 150;
  -- [IMPLICIT] Immutability constraint from Config.frozen = True
  -- [QUESTION] Should User be defined as an immutable type?
```

### Pattern 4: Domain-Specific Invariant

**Code:**
```typescript
class Account {
  balance: number;
  overdraftLimit: number;

  withdraw(amount: number): void {
    if (this.balance - amount < -this.overdraftLimit) {
      throw new Error("Would exceed overdraft limit");
    }
    this.balance -= amount;
  }

  // Class invariant: balance should never go below -overdraftLimit
}
```

**Extracted Invariant:**
```vdmsl
-- [PROVISIONAL] Domain invariant from Account class
types
  Account :: balance : int
            overdraftLimit : nat1
  inv account == account.balance >= -(account.overdraftLimit);
  -- [IMPLICIT] Constraint inferred from overdraft guard in withdraw()
```

---

## Special Cases

### Case 1: Floating-Point Numbers

**Issue:** VDM-SL does not have native support for floating-point numbers.

**Code:**
```typescript
interface Product {
  price: number;  // e.g., 19.99
  quantity: number;
}
```

**Handling:**
```vdmsl
-- [QUESTION] How should floating-point prices be represented?
-- Option A: Discretized as cents (integer)
types
  Price = nat1;  -- in cents (e.g., 1999 for $19.99)
  Quantity = nat1;
  Product :: price : Price
            quantity : Quantity;

-- Option B: Abstracted as rational number (requires custom theory)
-- [MISSING] Rational or fixed-point arithmetic support
```

### Case 2: Async/Promise-Based APIs

**Issue:** VDM-SL does not have native async semantics. Promises represent deferred computation.

**Code:**
```typescript
async function fetchUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}
```

**Handling:**
```vdmsl
-- [QUESTION] How should async behavior be modeled?
-- Option A: Model as synchronous operation (ignoring timing)
operations
  FetchUser: nat1 ==> User
  FetchUser(id) ==
    // ... assuming fetch is instantaneous
  post RESULT = user_with_id(id) if id in set valid_ids else error;
  -- [IMPLICIT] Success/error implicit in operation contract

-- Option B: Model as returning a result/option type
functions
  FetchUser: nat1 -> [User]
  FetchUser(id) == user_with_id(id) if id in set valid_ids else nil;
  -- [QUESTION] How should failures be represented?
```

### Case 3: Inheritance and Polymorphism

**Issue:** VDM-SL uses union types instead of inheritance.

**Code:**
```typescript
interface Animal {
  name: string;
  age: number;
}

interface Dog extends Animal {
  breed: string;
}

interface Cat extends Animal {
  color: string;
}
```

**Handling:**
```vdmsl
-- [PROVISIONAL] Polymorphic types using union
types
  Animal :: name : seq1 of char
           age : nat1;

  Dog :: name : seq1 of char
        age : nat1
        breed : seq1 of char;

  Cat :: name : seq1 of char
        age : nat1
        color : seq1 of char;

  AnimalUnion = Dog | Cat;
  -- [IMPLICIT] Subtyping relationships converted to union
```

### Case 4: Generic/Parameterized Types

**Issue:** VDM-SL does not have built-in generics like TypeScript or Java.

**Code:**
```typescript
interface Container<T> {
  items: T[];
  add(item: T): void;
  get(index: number): T | null;
}
```

**Handling:**
```vdmsl
-- Option A: Instantiate for specific type
-- [PROVISIONAL] Concrete instantiation for User container
types
  UserContainer :: items : seq of User;

operations
  Add: User ==> ()
  Add(item) == items := items ^ [item];

  Get: nat ==> [User]
  Get(index) ==
    if index >= 0 and index < len items
    then return items(index)
    else return nil;

-- [QUESTION] Should Container be generic, or instantiated separately?
-- [MISSING] Generic type parameter support in VDM-SL
```

### Case 5: Error Handling / Try-Catch

**Issue:** VDM-SL uses pre-conditions; exceptions are implicit in contract violation.

**Code:**
```typescript
function updateUser(id: number, data: UserData): User {
  try {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    const updated = { ...user, ...data };
    this.users.set(id, updated);
    return updated;
  } catch (e) {
    console.error(e);
    throw e;  // Re-throw
  }
}
```

**Handling:**
```vdmsl
-- [PROVISIONAL] Error handling modeled as pre/post-conditions
operations
  UpdateUser: nat1 * UserData ==> User
  UpdateUser(id, data) ==
    let user = users(id)
    in (users(id) := merge(user, data);
        return users(id))
  pre id in set dom users and is_valid_update(data)
  post users(id) = merge(old users(id), data);

  -- [QUESTION] Should "user not found" be modeled as:
  --   (A) Precondition violation (pre id in set dom users), or
  --   (B) Optional return type UpdateUser: ... ==> [User]?
```

---

## Summary of Mapping Rules

| Construct | VDM-SL Equivalent | Tagging | Notes |
|-----------|------------------|---------|-------|
| Interface | Record type | [PROVISIONAL] | Mark constraints as [QUESTION] |
| Class | Module + state | [PROVISIONAL] | Methods → operations/functions |
| Enum | Quote union | [PROVISIONAL] | Direct mapping |
| Optional/Nullable | Optional type `[T]` | [PROVISIONAL] | Clear mapping |
| Array | `seq of T` | [PROVISIONAL] | Check for size constraints |
| Map | `map K to V` | [PROVISIONAL] | Direct mapping |
| Union type | Union `T1 \| T2` | [PROVISIONAL] | May require tagged unions |
| If-guard | Pre-condition | [IMPLICIT] | Inferred from guards |
| State mutation | Post-condition | [IMPLICIT] | Inferred from assignments |
| Validation decorator | Invariant | [IMPLICIT] | Inferred from annotations |
| Try-catch | Pre-condition | [QUESTION] | How to handle errors? |
| Async/Promise | [QUESTION] | [QUESTION] | No native async in VDM-SL |
| Float/Decimal | [QUESTION] | [QUESTION] | Discretize or abstract? |
| Generics | Concrete instantiation | [MISSING] | Create separate types per T |

<!-- 日本語 -->

| 構文 | VDM-SLの同等物 | タグ | 注釈 |
|------|--------------|------|------|
| インターフェース | レコード型 | [PROVISIONAL] | 制約を[QUESTION]でマーク |
| クラス | モジュール + 状態 | [PROVISIONAL] | メソッド → 操作/関数 |
| 列挙型 | クォート合併 | [PROVISIONAL] | 直接対応 |
| オプション/Nullable | オプション型 `[T]` | [PROVISIONAL] | 明確な対応 |
| 配列 | `seq of T` | [PROVISIONAL] | サイズ制約を確認 |
| マップ | `map K to V` | [PROVISIONAL] | 直接対応 |
| 合併型 | 合併 `T1 \| T2` | [PROVISIONAL] | タグ付き合併が必要な場合もある |
| if-ガード | 事前条件 | [IMPLICIT] | ガードから推論 |
| 状態変更 | 事後条件 | [IMPLICIT] | 代入から推論 |
| 検証デコレータ | 不変条件 | [IMPLICIT] | アノテーションから推論 |
| try-catch | 事前条件 | [QUESTION] | エラーをどう処理するか？ |
| Async/Promise | [QUESTION] | [QUESTION] | VDM-SLにネイティブAsync機能なし |
| Float/Decimal | [QUESTION] | [QUESTION] | 離散化または抽象化？ |
| ジェネリクス | 具体的な実装 | [MISSING] | T当たり個別の型を作成 |

---

## References

- VDM-SL Language Manual: [Official VDM-SL Documentation](https://overture.formalethods.fm/)
- ISO/IEC 13817-1: VDM-SL Formal Specification
- VDMJ Tool: Code generation and verification support
