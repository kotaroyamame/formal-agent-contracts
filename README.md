# Formal Agent Contracts

マルチエージェント開発における形式手法ツールキット。エージェント間の契約をVDM-SLで定義し、自動検証する。

## 概要

形式手法の知識がない開発者でも、Claudeの支援により：

- エージェント間のインターフェースを厳密に定義できる
- 仕様の整合性を自動検証できる
- 証明責務（Proof Obligation）の意味を理解できる
- POをSMT-LIBに変換し、Z3ソルバーで自動証明できる（v0.2.0）

## スキル一覧

### define-contract（契約定義）

自然言語でエージェントの役割・入出力を説明すると、VDM-SLの形式仕様に変換する。

**トリガー例**: 「エージェントの契約を定義したい」「エージェント間のインターフェースを仕様化したい」

### verify-spec（仕様検証）

VDM-SL仕様ファイルに対してVDMJによる構文チェック・型チェック・PO生成を実行し、結果を平易な日本語で解説する。

**トリガー例**: 「仕様を検証して」「PO（証明責務）を生成して」

### smt-verify（SMT自動証明） *v0.2.0 NEW*

VDMJが生成したPOをSMT-LIB形式に変換し、Z3ソルバーで自動証明する。変換ルール（型マッピング・式マッピング）に基づいてClaudeがSMT-LIBコードを生成し、Z3の結果（証明成功/反例発見/判定不能）をわかりやすく報告する。

**トリガー例**: 「POをSMTで検証して」「Z3で証明して」「反例を探して」

### formal-methods-guide（形式手法ガイド）

VDM-SLの文法、型システム、PO種別の意味など、形式手法の背景知識を提供する。

**トリガー例**: 「VDM-SLの文法を教えて」「事前条件とは何か」

## セットアップ

### VDMJ（必須）

仕様検証にはVDMJが必要です。以下のいずれかの方法でインストールしてください：

1. GitHub Releasesからダウンロード: https://github.com/nickbattle/vdmj/releases
2. ソースからビルド: `git clone https://github.com/nickbattle/vdmj.git && cd vdmj && mvn install`

JARファイルを `~/.vdmj/vdmj.jar` に配置するか、ワークスペースの `vdmj/` ディレクトリにクローンしてください。

### Z3（SMT検証に必要）

SMT自動証明にはZ3ソルバーが必要です：

```bash
pip install z3-solver
```

または https://github.com/Z3Prover/z3/releases からバイナリをダウンロード。

### 動作環境

- Java 11以上（VDMJ用）
- Python 3.8以上（Z3用、pip install の場合）

## 開発ロードマップ

- [x] v0.1.0 — 契約テンプレート、構文/型チェック、PO生成と自然言語解説
- [x] v0.2.0 — SMT-LIB自動変換とZ3による証明（VDM-SMT Bridge Phase 1対応）
- [ ] v0.3.0 — 仕様からコードスキャフォールドの自動生成
- [ ] v1.0.0 — 統合ワークフロー（定義→検証→生成→テストの一気通貫）

## 作者

IID Systems (https://iid.systems)

## ライセンス

MIT
