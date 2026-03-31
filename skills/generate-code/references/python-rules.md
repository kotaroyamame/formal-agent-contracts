# VDM-SL → Python 変換ルール

## 型の変換

### 基本型

| VDM-SL | Python | 型ヒント |
|--------|--------|---------|
| `bool` | `bool` | `bool` |
| `nat` | `int` | `int` （ランタイムで `>= 0` 検証） |
| `nat1` | `int` | `int` （ランタイムで `>= 1` 検証） |
| `int` | `int` | `int` |
| `real` | `float` | `float` |
| `char` | `str` | `str` （1文字） |
| `token` | `str` | `str` |

NewTypeで厳密に表現する場合:
```python
from typing import NewType

UserId = NewType('UserId', int)
```

### 複合型

| VDM-SL | Python型ヒント |
|--------|---------------|
| `seq of T` | `list[T]` |
| `seq1 of T` | `list[T]` （ランタイムで `len > 0` 検証） |
| `set of T` | `set[T]` |
| `set1 of T` | `set[T]` （ランタイムで `len > 0` 検証） |
| `map K to V` | `dict[K, V]` |
| `[T]` (option) | `T \| None` |
| `T1 \| T2` (union) | `T1 \| T2` |

### レコード型 → dataclass + バリデーション

```
VDM-SL:
  User :: name  : seq1 of char
          email : seq1 of char
          age   : nat
  inv u == u.age <= 150;
```

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class User:
    """VDM-SL Record: User"""
    name: str
    email: str
    age: int

    def __post_init__(self) -> None:
        """不変条件チェック (inv_User)"""
        if contracts_enabled():
            assert len(self.name) > 0, \
                f"User invariant: name must be non-empty, got '{self.name}'"
            assert len(self.email) > 0, \
                f"User invariant: email must be non-empty, got '{self.email}'"
            assert isinstance(self.age, int) and self.age >= 0, \
                f"User invariant: age must be nat, got {self.age}"
            assert self.age <= 150, \
                f"User invariant: age <= 150 failed, got {self.age}"
```

`frozen=True` にすることで不変（イミュータブル）なレコードを表現する。
VDM-SLのレコードは値型であり、変更は新しいインスタンスの生成で表現される。

### 型の別名

```
VDM-SL: UserId = nat1;
```

```python
UserId = int  # nat1: >= 1

def is_valid_user_id(uid: int) -> bool:
    return isinstance(uid, int) and uid >= 1
```

## 関数の変換

### 明示的定義あり

```
VDM-SL:
  findUser: UserId * map UserId to User -> User
  findUser(uid, users) == users(uid)
  pre uid in set dom users;
```

```python
def find_user(uid: UserId, users: dict[UserId, User]) -> User:
    """
    VDM-SL: findUser

    Pre: uid in set dom users
    """
    # Pre-condition
    if contracts_enabled():
        assert uid in users, \
            f"Pre-condition failed: uid {uid} not in dom users"

    # Implementation (from VDM-SL body)
    result = users[uid]

    return result
```

### 暗黙的定義（スタブ生成）

```
VDM-SL:
  sqrt: real -> real
  sqrt(x)
  pre x >= 0
  post RESULT * RESULT = x and RESULT >= 0;
```

```python
import math

def sqrt(x: float) -> float:
    """
    VDM-SL: sqrt (implicit definition)

    Pre: x >= 0
    Post: RESULT * RESULT = x and RESULT >= 0
    """
    # Pre-condition
    if contracts_enabled():
        assert x >= 0, f"Pre-condition failed: x = {x} < 0"

    # TODO: Implement - must satisfy: RESULT * RESULT = x and RESULT >= 0
    result = math.sqrt(x)

    # Post-condition
    if contracts_enabled():
        assert abs(result * result - x) < 1e-10 and result >= 0, \
            f"Post-condition failed: result = {result}"

    return result
```

## 操作（operation）の変換

操作はクラスのメソッドとして生成する。

```python
class UserDB:
    """
    VDM-SL State: UserDB

    Invariant: nextId not in set dom users
    """

    def __init__(self) -> None:
        """init s == s = mk_UserDB({|->}, 1)"""
        self._users: dict[UserId, User] = {}
        self._next_id: UserId = UserId(1)
        self._check_invariant()

    def _check_invariant(self) -> None:
        """状態不変条件"""
        if not contracts_enabled():
            return
        assert self._next_id not in self._users, \
            f"State invariant: nextId {self._next_id} in dom users"

    @property
    def users(self) -> dict[UserId, User]:
        return dict(self._users)  # コピーを返す

    @property
    def next_id(self) -> UserId:
        return self._next_id

    def register_user(self, name: str, email: str) -> UserId:
        """
        VDM-SL Operation: RegisterUser

        Pre: email not in set {users(id).email | id in set dom users}
        Post: RESULT in set dom users and users(RESULT).name = name
        """
        # Pre-condition
        if contracts_enabled():
            assert len(name) > 0, "Pre-condition: name must be non-empty (seq1)"
            assert len(email) > 0, "Pre-condition: email must be non-empty (seq1)"
            existing_emails = {u.email for u in self._users.values()}
            assert email not in existing_emails, \
                f"Pre-condition: email '{email}' already exists"

        # Implementation
        uid = self._next_id
        self._users[uid] = User(name=name, email=email, age=0)
        self._next_id = UserId(self._next_id + 1)

        # State invariant
        self._check_invariant()

        # Post-condition
        if contracts_enabled():
            assert uid in self._users, \
                f"Post-condition: {uid} not in dom users"
            assert self._users[uid].name == name, \
                "Post-condition: name mismatch"

        return uid
```

## 契約検証の基盤コード

```python
# contracts.py

import os

class ContractError(AssertionError):
    """契約違反エラー"""
    def __init__(self, message: str) -> None:
        super().__init__(f"[Contract Violation] {message}")

def contracts_enabled() -> bool:
    """契約チェックの有効/無効（環境変数で制御）"""
    return os.environ.get('VDM_CONTRACT_CHECK', 'on') != 'off'
```

## VDM-SL式の変換パターン

| VDM-SL式 | Python |
|---------|--------|
| `e in set S` | `e in S` |
| `e not in set S` | `e not in S` |
| `dom m` | `set(m.keys())` or `m.keys()` |
| `rng m` | `set(m.values())` |
| `m(k)` | `m[k]` |
| `card S` | `len(S)` |
| `len s` | `len(s)` |
| `s1 ^ s2` | `s1 + s2` |
| `hd s` | `s[0]` |
| `tl s` | `s[1:]` |
| `m1 munion m2` | `{**m1, **m2}` |
| `m ++ {k \|-> v}` | `{**m, k: v}` |
| `{k} <-: m` | `{k2: v for k2, v in m.items() if k2 != k}` |
| `mk_T(a, b)` | `T(a=a, b=b)` （dataclass） |
| `r.field` | `r.field` |
| `if P then A else B` | `A if P else B` |
| `let x = e in body` | `(lambda x: body)(e)` or ブロック |
| `{f(x) \| x in set S & P(x)}` | `{f(x) for x in S if P(x)}` |
| `forall x in set S & P(x)` | `all(P(x) for x in S)` |
| `exists x in set S & P(x)` | `any(P(x) for x in S)` |

## 命名規則

| VDM-SL | Python |
|--------|--------|
| `UserId` (型) | `UserId` (NewType or type alias) |
| `mk_User` (コンストラクタ) | `User(...)` (dataclass) |
| `inv_User` (不変条件) | `__post_init__` 内 |
| `pre_findUser` (事前条件) | 関数内のガード節 |
| `RegisterUser` (操作) | `register_user` (snake_case) |
| `UserDB` (状態) | `UserDB` (class, PascalCase) |
| `findUser` (関数) | `find_user` (snake_case) |
| `isAdult` (関数) | `is_adult` (snake_case) |
