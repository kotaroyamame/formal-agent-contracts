# VDM-SL構文リファレンス

## モジュール構造

```vdm-sl
module ModuleName
imports from OtherModule types TypeName; functions funcName
exports all
definitions

types
  -- 型定義

values
  -- 定数定義

functions
  -- 関数定義（副作用なし）

operations
  -- 操作定義（状態の読み書きあり）

state StateName of
  -- 状態変数定義
end

end ModuleName
```

## 型定義

### 基本型
| 型 | 説明 | 例の値 |
|---|------|-------|
| `bool` | 真偽値 | `true`, `false` |
| `nat` | 自然数（0以上） | `0`, `42` |
| `nat1` | 正の自然数（1以上） | `1`, `100` |
| `int` | 整数 | `-5`, `0`, `42` |
| `real` | 実数 | `3.14` |
| `char` | 文字 | `'a'` |
| `token` | 抽象トークン | `mk_token("id")` |

### 型コンストラクタ
```vdm-sl
-- 集合型
set of nat              -- 自然数の集合
set1 of nat             -- 非空の自然数の集合

-- シーケンス型
seq of char             -- 文字列（文字のシーケンス）
seq1 of char            -- 非空文字列

-- 写像型
map nat to seq of char  -- 自然数から文字列への写像

-- 直積型
nat * seq of char       -- 自然数と文字列のペア

-- 合併型
nat | bool              -- 自然数または真偽値

-- オプション型
[nat]                   -- nat または nil
```

### レコード型
```vdm-sl
types
  User :: name  : seq1 of char
          email : seq1 of char
          age   : nat
  inv u == u.age <= 150;
```

- `mk_User("Alice", "alice@example.com", 30)` で構築
- `u.name` でフィールドアクセス

### 型の別名と不変条件
```vdm-sl
types
  UserId = nat1;
  Email = seq1 of char
  inv e == len e <= 254;
```

## 関数定義

```vdm-sl
functions
  -- 明示的定義
  isAdult: User -> bool
  isAdult(u) == u.age >= 18;

  -- 事前条件・事後条件付き
  findUser: UserId * map UserId to User -> User
  findUser(uid, users) == users(uid)
  pre uid in set dom users
  post RESULT.name <> [];

  -- 暗黙的定義（実装なし、仕様のみ）
  sqrt: real -> real
  sqrt(x)
  pre x >= 0
  post RESULT * RESULT = x and RESULT >= 0;
```

## 操作定義

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

- `==>` は操作の型シグネチャ（副作用あり）
- `dcl` はローカル変数宣言
- 状態変数（`users`, `nextId`）に直接代入可能

## 式

### 集合演算
| 式 | 意味 |
|---|------|
| `{1, 2, 3}` | 集合リテラル |
| `{x \| x in set s & x > 0}` | 集合内包表記 |
| `s1 union s2` | 和集合 |
| `s1 inter s2` | 共通集合 |
| `s1 \ s2` | 差集合 |
| `e in set s` | 所属判定 |
| `card s` | 要素数 |
| `s1 subset s2` | 部分集合 |
| `s1 psubset s2` | 真部分集合 |

### 写像演算
| 式 | 意味 |
|---|------|
| `{1 \|-> "a", 2 \|-> "b"}` | 写像リテラル |
| `m(k)` | キーkの値を取得 |
| `dom m` | 定義域（キーの集合） |
| `rng m` | 値域（値の集合） |
| `m1 munion m2` | 写像の結合 |
| `m ++ {k \|-> v}` | 写像の上書き |
| `{k} <: m` | 定義域制限 |
| `{k} <-: m` | 定義域除外 |

### シーケンス演算
| 式 | 意味 |
|---|------|
| `[1, 2, 3]` | シーケンスリテラル |
| `s(i)` | i番目の要素（1始まり） |
| `hd s` | 先頭要素 |
| `tl s` | 先頭以外 |
| `len s` | 長さ |
| `s1 ^ s2` | 連結 |
| `elems s` | 要素の集合 |
| `inds s` | インデックスの集合 |

### 量化式
```vdm-sl
-- 全称量化: すべてのxについてPが成り立つ
forall x in set S & P(x)
forall x : T & P(x)

-- 存在量化: あるxについてPが成り立つ
exists x in set S & P(x)

-- 一意存在量化: ちょうど1つのxについてPが成り立つ
exists1 x in set S & P(x)
```

### let式とcases式
```vdm-sl
-- let式
let x = expr1 in expr2

-- cases式
cases status:
  <Active>   -> "active",
  <Inactive> -> "inactive",
  others     -> "unknown"
end
```
