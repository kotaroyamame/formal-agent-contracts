# Formal Agent Contracts

**バージョン 2.1.0** ｜ マルチエージェント開発における形式手法ツールキット。エージェント間の契約をVDM-SLで定義し、自動検証する。

形式手法の知識がない開発者でも、Claudeの支援により：

- エージェント間のインターフェースを厳密に定義できる（VDM-SL）
- Phase 2設計文書（PROTOCOL.md、API-SIGNATURES.md）を生成し、仕様と実装の距離を縮められる
- VDMJによる構文チェック・型チェック・証明責務（PO）生成を実行できる
- Z3によるPOの自動証明・反例探索ができる
- 仕様の型・不変条件からDBスキーマ（DDL）を導出し、乖離（DEVIATIONS）と担保箇所（TRACEABILITY）を記録できる
- 仕様からTypeScript/Pythonのコードスキャフォールドと契約テストを自動生成できる
- 既存コードから仕様を逆抽出し、対話で磨き上げ、コードと照合できる（リバースワークフロー）

## インストール

Claude Code のプラグインとしてインストール：

```
/plugin marketplace add kotaroyamame/formal-agent-contracts
/plugin install formal-agent-contracts@formal-agent-contracts
```

## スキル一覧（全14スキル）

### フォワード開発（仕様 → コード）

| スキル | 説明 |
|---|---|
| **define-contract** | 自然言語での対話からVDM-SL契約と設計文書（PROTOCOL.md、API-SIGNATURES.md）を段階的に生成 |
| **verify-spec** | VDMJによる構文チェック・型チェック・PO生成。設計文書の完全性チェックとVDM-SL仕様との一貫性確認も実行 |
| **smt-verify** | POをSMT-LIBに変換し、Z3で自動証明・反例探索 |
| **generate-db-schema** | VDM-SLの型・不変条件からDBスキーマ（DDL）を規則的に導出。表現しきれない乖離は DEVIATIONS（retrenchment表）、担保箇所は TRACEABILITY に記録 |
| **generate-code** | VDM-SL仕様からTypeScript/Pythonのコードスキャフォールドを生成（事前条件・事後条件・不変式のランタイム検証コード付き） |
| **generate-tests** | VDM-SL仕様と設計文書からJest/Vitest互換の契約テストを自動生成（型不変式・契約遵守・状態遷移・境界値） |
| **integrated-workflow** | 定義→検証→証明→コード生成→テストの5フェーズを一気通貫で実行 |

### リバース開発（既存コード → 仕様）

| スキル | 説明 |
|---|---|
| **extract-spec** | 既存コードから暫定VDM-SL仕様を抽出（対話の足場となる仮仕様） |
| **refine-spec** | 対話を通じて仮仕様を磨き、ユーザーの頭の中にある「真の仕様」を引き出す |
| **reconcile-code** | 確定した仕様と既存コードを項目ごとに照合し、差分レポート・修正・テストを生成 |
| **reverse-workflow** | 抽出→洗練→照合のリバースパイプラインを一気通貫で実行（フォワードパイプラインへの接続も可能） |

### 仕様の入出力

| スキル | 説明 |
|---|---|
| **import-natural-spec** | 自然言語の仕様書（Markdown）を読み込み、曖昧さを対話で解消しながらVDM-SL仕様へ変換 |
| **export-human-spec** | VDM-SL仕様から非エンジニアも読める自然言語仕様書（Markdown）を生成 |

### リファレンス

| スキル | 説明 |
|---|---|
| **formal-methods-guide** | VDM-SLの文法、型システム、PO種別などの背景知識を提供（他スキルからも参照される） |

## セットアップ（外部ツール）

スキルによって必要な外部ツールが異なります。使うスキルに応じてインストールしてください。

| ツール | 必要とするスキル | 入手先 |
|---|---|---|
| Java 11以上 | verify-spec、smt-verify（VDMJの実行に必要） | https://adoptium.net/ |
| VDMJ | verify-spec、smt-verify | https://github.com/nickbattle/vdmj/releases （`vdmj-suite-*-distribution.zip`）。詳細は [vdmj-setup.md](skills/verify-spec/references/vdmj-setup.md) |
| Z3 | smt-verify | `pip install z3-solver` または https://github.com/Z3Prover/z3 |
| Node.js + Vitest/Jest | generate-tests（生成テストの実行） | https://nodejs.org/ |
| sqlite3 または PostgreSQL | generate-db-schema（任意。生成DDLの実行検証用） | macOS は sqlite3 同梱 / https://www.postgresql.org/ |

define-contract、formal-methods-guide、import-natural-spec、export-human-spec などの対話系スキルは外部ツールなしで動作します。

## 使い方

最初のプロンプトの雛形は [prompt-templates.md](prompt-templates.md) を参照してください。単一エージェント定義、マルチエージェント境界契約、統合ワークフロー、既存仕様の形式化、リバースワークフロー、検証・自動証明、契約テスト生成の7テンプレートがあります。

最小の例：

```
在庫管理エージェントを定義して。
- 商品には商品ID・商品名・在庫数がある
- 在庫数は0未満にならない
- 出荷数は現在の在庫数を超えられない
```

→ define-contract が対話的に契約を深掘りし、VDM-SL仕様を生成します。その後「検証して」でverify-spec、「テストを生成して」でgenerate-testsへ続きます。

## リポジトリ構成

| パス | 内容 |
|------|------|
| `skills/` | 14スキルの定義（各スキルは SKILL.md、多くは references/ 付き） |
| `examples/` | 動作例（`task-manager`: VDM-SL仕様 → TypeScript実装 → SMT-LIB証明） |
| `eval/` | 評価フレームワーク（ベンチマーク課題、実行ログ、採点スクリプト、結果） |
| `design/` | 設計文書（`reverse-workflow-design.md` — リバースワークフローの設計時ドキュメント） |
| `prompt-templates.md` | ユーザー向けプロンプトテンプレート集 |

## 評価

本プラグインの有無で同一課題（3課題 × 5試行 × 2条件）の成果物を比較した探索的評価を同梱しています。仕様カバレッジ・テスト有効性などで効果を示唆する結果が得られていますが、単一モデルによる生成・ヒューリスティック採点などの方法論的制約があります。結果と限界の詳細は [eval/results/report.md](eval/results/report.md) を参照してください。

## 変更履歴

- **v2.1.0** — DBスキーマ導出（generate-db-schema）：型・不変条件→DDLの規則的写像（R1〜R18）、retrenchment に基づく乖離記録（DEVIATIONS）、不変条件の担保箇所対照表（TRACEABILITY）
- **v2.0.0** — Phase 2設計文書（PROTOCOL.md、API-SIGNATURES.md）生成支援、契約テスト自動生成（generate-tests）、設計文書の完全性チェック（verify-spec拡張）
- **v1.5.0** — import-natural-spec / export-human-spec（自然言語仕様の入出力）
- **v1.1.0–v1.4.0** — リバースワークフロー（extract-spec、refine-spec、reconcile-code、reverse-workflow）、評価フレームワーク
- **v1.0.0** — 統合ワークフロー（integrated-workflow）、ドキュメントの日英対応
- **v0.3.0** — コードスキャフォールド生成（generate-code、TypeScript/Python）
- **v0.2.0** — SMT-LIB変換とZ3証明（smt-verify）
- **v0.1.0** — 初版（define-contract、verify-spec、formal-methods-guide）

## 今後の予定

- [ ] design-system スキル（ARCHITECTURE.md / TECH-STACK.md / ADR / 制約ファイルによる技術選定支援）
- [ ] UI契約とE2Eテスト生成（define-ui-contract / generate-e2e — VDM-SL traces から Playwright テストを導出）
- [ ] 評価の再実施（独立した採点者・複数モデルでの追試、変異数を増やしたミューテーションテスト）
- [ ] 実プロジェクトでの適用事例の収集

## 作者

IID Systems (https://iid.systems)

## ライセンス

MIT — [LICENSE](LICENSE) を参照
