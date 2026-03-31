# Formal Agent Contracts

A formal methods toolkit for multi-agent development. Define inter-agent contracts in VDM-SL and verify them automatically.

マルチエージェント開発における形式手法ツールキット。エージェント間の契約をVDM-SLで定義し、自動検証する。

## Overview / 概要

With Claude's assistance, even developers without formal methods expertise can:

- **Define** agent interfaces rigorously using VDM-SL formal specifications
- **Verify** specification consistency via syntax/type checking and proof obligation generation
- **Prove** proof obligations automatically by converting to SMT-LIB and solving with Z3 (v0.2.0)
- **Generate** TypeScript/Python code scaffolds from VDM-SL specs with runtime contract checks (v0.3.0)
- **Integrate** the full pipeline — define, verify, prove, generate, and test — in a single guided session (v1.0.0)

形式手法の知識がない開発者でも、Claudeの支援により、エージェント間インターフェースの厳密な定義、仕様の自動検証、POのSMT自動証明、仕様からのコード自動生成、そして統合ワークフローによる一気通貫開発が可能です。

## Skills / スキル一覧

### define-contract — Contract Definition / 契約定義

Describe an agent's role and I/O in natural language, and Claude converts it into a VDM-SL formal specification.

自然言語でエージェントの役割・入出力を説明すると、VDM-SLの形式仕様に変換します。

**Triggers**: "define an agent contract", "formalize the interface between agents"

### verify-spec — Specification Verification / 仕様検証

Run VDMJ syntax/type checks and proof obligation generation on a VDM-SL spec file, with results explained in plain language.

VDM-SL仕様ファイルに対してVDMJによる構文チェック・型チェック・PO生成を実行し、結果を平易に解説します。

**Triggers**: "verify the spec", "generate proof obligations"

### smt-verify — SMT Automated Proving / SMT自動証明 *(v0.2.0)*

Convert VDMJ-generated POs to SMT-LIB format and prove them with the Z3 solver. Claude generates SMT-LIB code based on type/expression mapping rules and reports results (proved / counterexample found / unknown).

VDMJが生成したPOをSMT-LIB形式に変換し、Z3ソルバーで自動証明します。

**Triggers**: "verify POs with SMT", "prove with Z3", "find counterexamples"

### generate-code — Code Scaffold Generation / コード生成 *(v0.3.0)*

Generate TypeScript or Python implementation scaffolds from VDM-SL specifications (types, functions, operations). Includes runtime verification of pre-conditions, post-conditions, and invariants to detect contract violations at execution time.

VDM-SL仕様からTypeScript/Pythonの実装スキャフォールドを生成します。事前条件・事後条件・不変条件のランタイム検証コード付き。

**Triggers**: "generate code from the spec", "convert to TypeScript", "generate Python code"

### integrated-workflow — End-to-End Workflow / 統合ワークフロー *(v1.0.0)*

Orchestrates the full formal development pipeline in a single session: Define → Verify → Prove → Generate → Test. Handles phase transitions, error recovery (e.g., returning to definition when verification fails), and generates a comprehensive session report.

定義→検証→証明→生成→テストの全パイプラインを1セッションで実行します。フェーズ間の遷移、エラー回復、セッションレポート生成を自動的に行います。

**Triggers**: "run the full workflow", "end-to-end development", 「統合ワークフローで開発したい」「一気通貫で」

### formal-methods-guide — Formal Methods Guide / 形式手法ガイド

Provides background knowledge on VDM-SL syntax, type system, and the meaning of each PO type.

VDM-SLの文法、型システム、PO種別の意味など、形式手法の背景知識を提供します。

**Triggers**: "explain VDM-SL syntax", "what is a pre-condition"

## Setup / セットアップ

### VDMJ (Required / 必須)

VDMJ is required for specification verification. Install via one of:

1. Download from [GitHub Releases](https://github.com/nickbattle/vdmj/releases)
2. Build from source: `git clone https://github.com/nickbattle/vdmj.git && cd vdmj && mvn install`

Place the JAR file at `~/.vdmj/vdmj.jar` or clone into the `vdmj/` directory of your workspace.

### Z3 (Required for SMT verification / SMT検証に必要)

```bash
pip install z3-solver
```

Or download binaries from https://github.com/Z3Prover/z3/releases

### Requirements / 動作環境

- Java 11+ (for VDMJ)
- Python 3.8+ (for Z3 via pip)

## Roadmap / 開発ロードマップ

- [x] v0.1.0 — Contract templates, syntax/type checking, PO generation with natural language explanation
- [x] v0.2.0 — SMT-LIB auto-conversion and Z3 automated proving (VDM-SMT Bridge Phase 1)
- [x] v0.3.0 — Code scaffold generation from specs (TypeScript/Python with runtime contract checks)
- [x] v1.0.0 — Integrated workflow (define → verify → prove → generate → test, end-to-end)

## Author / 作者

IID Systems (https://iid.systems)

## License / ライセンス

MIT
