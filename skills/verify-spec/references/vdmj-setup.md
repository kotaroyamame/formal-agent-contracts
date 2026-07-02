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

### Method 1: Distribution ZIP (Recommended) / 配布版ZIP（推奨）

GitHub Releases ships a `vdmj-suite-<version>-distribution.zip` containing all jars
(vdmj, annotations, stdlib, quickcheck, ...) and a `vdmj.sh` launcher script.
Download it from the releases page, unzip, and add the folder to PATH:

GitHub Releasesには全jar（vdmj、annotations、stdlib、quickcheck等）と起動スクリプト
`vdmj.sh` を含む `vdmj-suite-<version>-distribution.zip` があります。
リリースページからダウンロードして展開し、PATHに追加:

```bash
# https://github.com/nickbattle/vdmj/releases/latest から
# vdmj-suite-*-distribution.zip をダウンロードして展開
unzip vdmj-suite-*-distribution.zip -d ~/
export PATH="$PATH:$HOME/vdmj-suite-4.7.0"
vdmj.sh -help
```

Alternatively, download a standalone executable jar from Maven Central
(sufficient for syntax/type check, PO generation, interpreter; QuickCheck requires the suite):

Maven Centralから単体の実行可能jarも取得可能
（構文/型チェック・PO生成・インタプリタには十分。QuickCheckにはsuiteが必要）:

```bash
mkdir -p ~/.vdmj
curl -L -o ~/.vdmj/vdmj.jar \
  https://repo1.maven.org/maven2/dk/au/ece/vdmj/vdmj/4.7.0/vdmj-4.7.0.jar
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

QuickCheck is a console command (`qc` / `quickcheck`) available when the quickcheck jar
is on the classpath — `vdmj.sh` from the distribution ZIP sets this up automatically.
Note: the `-q` command-line flag is unrelated — it suppresses information messages.

QuickCheckはインタプリタのコンソールコマンド（`qc` / `quickcheck`）。quickcheck jarが
クラスパスにある必要があり、配布版ZIPの `vdmj.sh` なら自動で設定されます。
なおコマンドラインフラグの `-q` は無関係（情報メッセージ抑制）です。

```bash
# 対話モードで起動して qc を実行
vdmj.sh -vdmsl file1.vdmsl -i
> qc

# 一括実行（qcコマンドを実行して終了）
vdmj.sh -vdmsl file1.vdmsl -cmd "qc"
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
