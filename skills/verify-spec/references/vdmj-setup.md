# VDMJ セットアップガイド

## VDMJとは

VDMJはVDM-SL/VDM++/VDM-RTの統合ツールチェーン。Javaで実装されており、
パーサー、型チェッカー、インタプリタ、PO生成器、QuickCheckを含む。

- リポジトリ: https://github.com/nickbattle/vdmj
- ライセンス: GPL v3
- 必要環境: Java 11以上

## インストール方法

### 方法1: リリース版JAR（推奨）

GitHub Releasesから最新のJARをダウンロード:
```bash
mkdir -p ~/.vdmj
curl -L -o ~/.vdmj/vdmj.jar \
  https://github.com/nickbattle/vdmj/releases/latest/download/vdmj-4.7.0.jar
```

### 方法2: ソースからビルド

```bash
git clone https://github.com/nickbattle/vdmj.git
cd vdmj
mvn install -DskipTests
# JARは vdmj/target/vdmj-*.jar に生成される
```

## コマンドラインの使い方

### 構文チェック + 型チェック
```bash
java -jar vdmj.jar -vdmsl file1.vdmsl file2.vdmsl
```

### PO生成
```bash
java -jar vdmj.jar -vdmsl file1.vdmsl -p
```

### インタプリタモード
```bash
java -jar vdmj.jar -vdmsl file1.vdmsl -i
```

### QuickCheck（反例探索）
```bash
java -jar vdmj.jar -vdmsl file1.vdmsl -p -q
```

## 出力フォーマット

### 構文/型チェック出力
```
Parsed N module(s) in X secs. No syntax errors
Type checked N module(s) in X secs. No type errors
```

エラーがある場合:
```
Error NNNN: エラーメッセージ in 'ModuleName' (filename) at line L:C
```

### PO出力
```
Generated N proof obligations:

Proof Obligation 1: (Unproved)
定義名: PO種別 in 'ModuleName' (filename) at line L:C
PO式（VDM-SL）
```

POステータス:
- `Unproved` — 未証明（デフォルト）
- `Provable` — QuickCheckで反例が見つからなかった
- `Maybe` — QuickCheckで不明
- `Failed` — QuickCheckで反例が見つかった
