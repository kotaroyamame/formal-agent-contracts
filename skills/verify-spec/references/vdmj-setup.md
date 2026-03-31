# VDMJ Setup Guide / VDMJセットアップガイド

## What is VDMJ? / VDMJとは

VDMJ is an integrated toolchain for VDM-SL/VDM++/VDM-RT. Implemented in Java, it includes
a parser, type checker, interpreter, PO generator, and QuickCheck.

VDMJはVDM-SL/VDM++/VDM-RTの統合ツールチェーン。Javaで実装されており、
パーサー、型チェッカー、インタプリタ、PO生成器、QuickCheckを含む。

- Repository: https://github.com/nickbattle/vdmj
- License: GPL v3
- Requirements: Java 11 or later / 必要環境: Java 11以上

## Installation / インストール方法

### Method 1: Release JAR (Recommended) / リリース版JAR（推奨）

Download the latest JAR from GitHub Releases:

GitHub Releasesから最新のJARをダウンロード:

```bash
mkdir -p ~/.vdmj
curl -L -o ~/.vdmj/vdmj.jar \
  https://github.com/nickbattle/vdmj/releases/latest/download/vdmj-4.7.0.jar
```

### Method 2: Build from Source / ソースからビルド

```bash
git clone https://github.com/nickbattle/vdmj.git
cd vdmj
mvn install -DskipTests
# JAR is generated at vdmj/target/vdmj-*.jar
# JARは vdmj/target/vdmj-*.jar に生成される
```

## Command-Line Usage / コマンドラインの使い方

### Syntax Check + Type Check / 構文チェック + 型チェック
```bash
java -jar vdmj.jar -vdmsl file1.vdmsl file2.vdmsl
```

### PO Generation / PO生成
```bash
java -jar vdmj.jar -vdmsl file1.vdmsl -p
```

### Interpreter Mode / インタプリタモード
```bash
java -jar vdmj.jar -vdmsl file1.vdmsl -i
```

### QuickCheck (Counterexample Search) / QuickCheck（反例探索）
```bash
java -jar vdmj.jar -vdmsl file1.vdmsl -p -q
```

## Output Format / 出力フォーマット

### Syntax/Type Check Output / 構文・型チェック出力
```
Parsed N module(s) in X secs. No syntax errors
Type checked N module(s) in X secs. No type errors
```

When errors are found / エラーがある場合:
```
Error NNNN: Error message in 'ModuleName' (filename) at line L:C
```

### PO Output / PO出力
```
Generated N proof obligations:

Proof Obligation 1: (Unproved)
DefinitionName: POType in 'ModuleName' (filename) at line L:C
PO expression (VDM-SL)
```

PO statuses / POステータス:
- `Unproved` — Not yet proved (default) / 未証明（デフォルト）
- `Provable` — No counterexample found by QuickCheck / QuickCheckで反例なし
- `Maybe` — QuickCheck uncertain / QuickCheckで不明
- `Failed` — Counterexample found by QuickCheck / QuickCheckで反例発見
