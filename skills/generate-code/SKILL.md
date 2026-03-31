---
name: generate-code
description: >
  VDM-SL仕様からTypeScript/Pythonのコードスキャフォールドを自動生成する。
  「仕様からコードを生成して」「TypeScriptに変換して」「Pythonコードにして」
  「スキャフォールドを作って」「実装の雛形を生成して」「VDMから型定義を作って」
  「エージェントのコードを生成して」といったリクエストに使用する。
  事前条件・事後条件・不変条件のランタイム検証コードも含めて生成する。
metadata:
  version: "0.3.0"
---

# VDM-SL仕様からのコード生成

VDM-SL仕様（型、関数、操作、不変条件）を読み取り、TypeScriptまたはPythonの
実装スキャフォールドを生成する。ランタイム検証（pre/post/inv チェック）も含める。

## 生成フロー

### Step 1: 仕様ファイルの読み取り

ユーザーが指定した `.vdmsl` ファイルを読み取る。
ファイルが指定されていない場合、ワークスペース内の `.vdmsl` ファイルを探す。

### Step 2: ターゲット言語の確認

ユーザーが明示しない場合、AskUserQuestionで確認する:
- TypeScript
- Python
- 両方

### Step 3: VDM-SL → コードの変換

`references/typescript-rules.md` または `references/python-rules.md` の変換ルールに従う。

生成するファイル構成:

**TypeScriptの場合:**
```
generated/
├── types.ts          -- 型定義（interface/type）
├── contracts.ts      -- 事前条件・事後条件・不変条件の検証関数
├── <module>.ts       -- 関数・操作の実装スキャフォールド
└── index.ts          -- エクスポート
```

**Pythonの場合:**
```
generated/
├── types.py          -- 型定義（dataclass）
├── contracts.py      -- 事前条件・事後条件・不変条件の検証関数
├── <module>.py       -- 関数・操作の実装スキャフォールド
└── __init__.py       -- エクスポート
```

### Step 4: 型の変換

VDM-SL型をターゲット言語の型に変換する。変換ルールの詳細はリファレンス参照。

核となるマッピング:

| VDM-SL | TypeScript | Python |
|--------|-----------|--------|
| `nat`, `nat1`, `int` | `number` | `int` |
| `real` | `number` | `float` |
| `bool` | `boolean` | `bool` |
| `seq of char` | `string` | `str` |
| `seq of T` | `T[]` | `list[T]` |
| `set of T` | `Set<T>` | `set[T]` |
| `map K to V` | `Map<K, V>` | `dict[K, V]` |
| レコード型 | `interface` | `@dataclass` |
| `[T]`（option） | `T \| null` | `Optional[T]` |
| 合併型 | union type | `Union[...]` |

### Step 5: 契約検証コードの生成

不変条件・事前条件・事後条件をランタイムチェック関数として生成する。

**方針:**
- 不変条件 → 型のファクトリ関数またはバリデーション関数
- 事前条件 → 関数の入口でassert / raise
- 事後条件 → 関数の出口でassert / raise（デバッグモード）
- 検証のon/off切替を環境変数 `VDM_CONTRACT_CHECK` で制御

### Step 6: 関数・操作のスキャフォールド生成

**明示的定義がある関数** → 可能な範囲で実装を変換
**暗黙的定義（事前・事後条件のみ）** → `TODO` コメント付きのスタブを生成

```typescript
// VDM-SL: findUser(uid, users) == users(uid) pre uid in set dom users
function findUser(uid: UserId, users: Map<UserId, User>): User {
  // 事前条件チェック
  assert(users.has(uid), `Pre-condition failed: uid ${uid} not in users`);

  // 実装
  const result = users.get(uid)!;

  return result;
}
```

### Step 7: ファイルの出力

生成したコードを仕様ファイルと同じディレクトリの `generated/` サブフォルダに配置する。
既存ファイルがある場合はユーザーに上書き確認する。

## 生成コードの品質指針

- 生成コードは**そのまま動作可能**な状態を目指す（コンパイルエラーなし）
- `TODO` コメントで手動実装が必要な箇所を明示する
- JSDoc / docstringで元のVDM-SL定義を記載する
- 契約違反時のエラーメッセージは具体的に（どの条件が、どの値で失敗したか）

## 変換できない構文の対処

以下はコード生成を断念し、`TODO` コメントで注記する:
- `exists` / `exists1` 量化式 → コメントで意味を記述
- パターンマッチの網羅性保証 → 型ガードの提案のみ
- 写像内包表記 `{k |-> v | ...}` → ループでの構築に変換するか `TODO`
- 状態不変条件の自動挿入 → 状態変更メソッドにフックを推奨

## 詳細リファレンス

- `references/typescript-rules.md` — TypeScript変換ルール一式
- `references/python-rules.md` — Python変換ルール一式
