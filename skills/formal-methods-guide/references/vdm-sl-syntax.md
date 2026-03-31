# VDM-SL Syntax Reference / VDM-SL構文リファレンス

## Module Structure / モジュール構造

```vdm-sl
module ModuleName
imports from OtherModule types TypeName; functions funcName
exports all
definitions

types
  -- Type definitions / 型定義

values
  -- Constants / 定数定義

functions
  -- Functions (no side effects) / 関数定義（副作用なし）

operations
  -- Operations (read/write state) / 操作定義（状態の読み書きあり）

state StateName of
  -- State variables / 状態変数定義
end

end ModuleName
```

## Type Definitions / 型定義

### Basic Types / 基本型

| Type | Description | 説明 | Example |
|------|-------------|------|---------|
| `bool` | Boolean | 真偽値 | `true`, `false` |
| `nat` | Natural number (≥ 0) | 自然数（0以上） | `0`, `42` |
| `nat1` | Positive natural (≥ 1) | 正の自然数（1以上） | `1`, `100` |
| `int` | Integer | 整数 | `-5`, `0`, `42` |
| `real` | Real number | 実数 | `3.14` |
| `char` | Character | 文字 | `'a'` |
| `token` | Abstract token | 抽象トークン | `mk_token("id")` |

### Type Constructors / 型コンストラクタ

```vdm-sl
-- Set types / 集合型
set of nat              -- Set of naturals / 自然数の集合
set1 of nat             -- Non-empty set of naturals / 非空の自然数の集合

-- Sequence types / シーケンス型
seq of char             -- String (sequence of characters) / 文字列
seq1 of char            -- Non-empty string / 非空文字列

-- Map types / 写像型
map nat to seq of char  -- Map from naturals to strings / 自然数から文字列への写像

-- Product types / 直積型
nat * seq of char       -- Pair of natural and string / 自然数と文字列のペア

-- Union types / 合併型
nat | bool              -- Natural or boolean / 自然数または真偽値

-- Optional types / オプション型
[nat]                   -- nat or nil / nat または nil
```

### Record Types / レコード型

```vdm-sl
types
  User :: name  : seq1 of char
          email : seq1 of char
          age   : nat
  inv u == u.age <= 150;
```

- Construct with `mk_User("Alice", "alice@example.com", 30)` / `mk_User(...)` で構築
- Access fields with `u.name` / `u.name` でフィールドアクセス

### Type Aliases and Invariants / 型の別名と不変条件

```vdm-sl
types
  UserId = nat1;
  Email = seq1 of char
  inv e == len e <= 254;
```

## Function Definitions / 関数定義

```vdm-sl
functions
  -- Explicit definition / 明示的定義
  isAdult: User -> bool
  isAdult(u) == u.age >= 18;

  -- With pre/post-conditions / 事前条件・事後条件付き
  findUser: UserId * map UserId to User -> User
  findUser(uid, users) == users(uid)
  pre uid in set dom users
  post RESULT.name <> [];

  -- Implicit definition (spec only, no implementation) / 暗黙的定義（仕様のみ）
  sqrt: real -> real
  sqrt(x)
  pre x >= 0
  post RESULT * RESULT = x and RESULT >= 0;
```

## Operation Definitions / 操作定義

```vdm-sl
operations
  RegisterUser: seq1 of char * Email ==> UserId
  RegisterUser(name, email) == (
    dcl uid : UserId := nextId;
    users := users munion {uid |-> mk_User(name, email, 0)};
    nextId := nextId + 1;
    return uid
  )
  pre email not in set {users(id).email | id in set dom users}
  post RESULT in set dom users;
```

- `==>` is the operation type signature (has side effects) / 操作の型シグネチャ（副作用あり）
- `dcl` declares local variables / ローカル変数宣言
- State variables (`users`, `nextId`) can be assigned directly / 状態変数に直接代入可能

## Expressions / 式

### Set Operations / 集合演算

| Expression | Meaning | 意味 |
|------------|---------|------|
| `{1, 2, 3}` | Set literal | 集合リテラル |
| `{x \| x in set s & x > 0}` | Set comprehension | 集合内包表記 |
| `s1 union s2` | Union | 和集合 |
| `s1 inter s2` | Intersection | 共通集合 |
| `s1 \ s2` | Difference | 差集合 |
| `e in set s` | Membership | 所属判定 |
| `card s` | Cardinality | 要素数 |
| `s1 subset s2` | Subset | 部分集合 |
| `s1 psubset s2` | Proper subset | 真部分集合 |

### Map Operations / 写像演算

| Expression | Meaning | 意味 |
|------------|---------|------|
| `{1 \|-> "a", 2 \|-> "b"}` | Map literal | 写像リテラル |
| `m(k)` | Apply (get value for key k) | キーkの値を取得 |
| `dom m` | Domain (set of keys) | 定義域（キーの集合） |
| `rng m` | Range (set of values) | 値域（値の集合） |
| `m1 munion m2` | Map merge | 写像の結合 |
| `m ++ {k \|-> v}` | Map override | 写像の上書き |
| `{k} <: m` | Domain restriction | 定義域制限 |
| `{k} <-: m` | Domain subtraction | 定義域除外 |

### Sequence Operations / シーケンス演算

| Expression | Meaning | 意味 |
|------------|---------|------|
| `[1, 2, 3]` | Sequence literal | シーケンスリテラル |
| `s(i)` | Element at index i (1-based) | i番目の要素（1始まり） |
| `hd s` | Head (first element) | 先頭要素 |
| `tl s` | Tail (all but first) | 先頭以外 |
| `len s` | Length | 長さ |
| `s1 ^ s2` | Concatenation | 連結 |
| `elems s` | Set of elements | 要素の集合 |
| `inds s` | Set of indices | インデックスの集合 |

### Quantified Expressions / 量化式

```vdm-sl
-- Universal quantification: P holds for all x / 全称量化
forall x in set S & P(x)
forall x : T & P(x)

-- Existential quantification: P holds for some x / 存在量化
exists x in set S & P(x)

-- Unique existence: P holds for exactly one x / 一意存在量化
exists1 x in set S & P(x)
```

### Let and Cases Expressions / let式とcases式

```vdm-sl
-- Let expression / let式
let x = expr1 in expr2

-- Cases expression / cases式
cases status:
  <Active>   -> "active",
  <Inactive> -> "inactive",
  others     -> "unknown"
end
```
