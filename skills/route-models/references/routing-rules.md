# Model Routing Rules — Scoring Rubric, Schema, and Escalation

This reference defines the default scoring rubric used by the `route-models` skill,
the `model-routing.json` schema consumed by other skills, and the escalation policy.
All weights and thresholds are **tunable defaults** — they encode a starting point,
not a law. If a project consistently escalates, raise the thresholds and record why.

本書は `route-models` スキルの既定スコアリング、他スキルが読む `model-routing.json`
のスキーマ、エスカレーション方針を定める。重みと閾値はすべて調整可能な既定値である。

---

## 1. Scoring Rubric (per module)

Count signals from the module's VDM-SL text. Sum the points.

| # | Signal | Points | Cap | Notes |
|---|--------|--------|-----|-------|
| S1 | Explicit functions/operations, each beyond the 3rd | +1 | +3 | Volume of mechanical work |
| S2 | Implicit definition (pre/post only, no body) | +2 each | — | Real reasoning required |
| S3 | State section with at least one invariant | +2 | +2 | Cross-cutting consistency |
| S4 | Quantifier occurrence (`forall` / `exists` / `exists1` / `iota`) | +1 each | +3 | Resists mechanical translation |
| S5 | Recursive definition (`measure` clause or self-reference) | +1 each | +2 | Termination-sensitive |
| S6 | Cross-module `imports` or `exports` section | +2 | +2 | Inter-agent protocol logic |
| S7 | Proof obligations, per 5 POs (only if a verify-spec report exists) | +1 | +3 | Verifier's difficulty estimate |

### Tier thresholds

| Total score | Tier | Claude Code model |
|-------------|----------|-------------------|
| 0 – 3 | **light** | `haiku` |
| 4 – 8 | **standard** | `sonnet` |
| 9 + | **heavy** | `inherit` |

### Fast paths (override the score)

| Condition | Tier | Why |
|-----------|------|-----|
| Types-only module (types/invariants, zero functions and zero operations) | **light** | Codegen is a mechanical type mapping |
| One or more implicit definitions (S2 > 0) | **never light** | Stub design needs reasoning even when the score is low |
| User override in the confirmation step | as chosen | The user always wins; record the override |

---

## 2. `model-routing.json` Schema

Placed **next to the spec file** it routes — one routing file per spec file; a
routing file applies to a spec iff the spec's filename equals `source`. For a
flat (module-less) spec, the module key is the spec file's basename without
extension. Version field guards future changes.

仕様ファイルごとに1つのルーティングファイルを置く（適用判定は `source` の
ファイル名一致）。module 構文を持たないフラットな仕様では、モジュールキーは
仕様ファイルの拡張子を除いた basename とする。

```json
{
  "version": 1,
  "generatedBy": "route-models",
  "generatedAt": "2026-07-03",
  "source": "TaskManager.vdmsl",
  "tiers": {
    "light": "haiku",
    "standard": "sonnet",
    "heavy": "inherit"
  },
  "defaults": { "tier": "heavy" },
  "modules": {
    "Types": {
      "tier": "light",
      "score": 1,
      "signals": { "explicitOps": 0, "implicitDefs": 0, "stateInv": false,
                   "quantifiers": 1, "recursion": 0, "crossModule": false, "poCount": null },
      "rationale": "Types-only module (fast path): mechanical type mapping.",
      "userOverride": false
    },
    "Scheduler": {
      "tier": "heavy",
      "score": 16,
      "signals": { "explicitOps": 4, "implicitDefs": 3, "stateInv": true,
                   "quantifiers": 2, "recursion": 1, "crossModule": true, "poCount": 14 },
      "rationale": "3 implicit definitions and cross-module protocol logic; 14 POs.",
      "userOverride": false
    }
  },
  "escalation": {
    "onVerificationFailure": "raise-one-tier",
    "failuresBeforeEscalation": 2,
    "history": []
  }
}
```

Field notes:

- `tiers` — the tier → model mapping for this project. Consumers must read the
  mapping from here rather than hard-coding model names, so a project can remap
  (e.g. `"heavy": "opus"`) without touching the skills.
- `defaults.tier` — applied to any module not listed (safe default: `heavy`).
- `modules.<name>.signals` — the raw counts behind the score; `poCount` is `null`
  when no verify-spec report was available.
- `escalation.history` — appended by consumer skills:
  `{ "module": "...", "from": "light", "to": "standard", "reason": "contract tests failed twice", "at": "<ISO date>" }`.

- `tiers` はこのプロジェクトでの層→モデル対応。消費側はモデル名をハードコード
  せず必ずここから読む。`defaults.tier` は未記載モジュールへの安全側の既定。
  `escalation.history` は消費側スキルが追記する。

---

## 3. Consumer Contract (generate-code / generate-tests / integrated-workflow)

When `model-routing.json` exists next to the spec being processed:

1. Read the routing file; validate `version === 1` (ignore the file and warn if not).
2. For each module, spawn the bulk work as a **subagent with the mapped model**
   (Claude Code Task tool, `model` parameter). One module per subagent is what
   makes per-module model selection possible and keeps each context bounded;
   the cost saving comes from bulk tokens being billed at the lighter tier's
   rate. Each subagent re-reads its instructions, so for many small same-tier
   modules, batch them into one subagent per tier.
3. Modules absent from the file get `defaults.tier`.
4. Verify results exactly as without routing (see §4 for the per-artifact
   gates). On the second failure for the same module, escalate one tier,
   regenerate, append to `escalation.history`, and add the same row to the
   "Escalations" section of `MODEL-ROUTING.md`.
5. If the runtime cannot set a subagent model, fall back to normal processing and
   surface the table as a recommendation. Never fail the phase because routing
   is unavailable.

ルーティングファイルがあるときの消費側の約束：層→モデル対応はファイルから読む、
モジュールごとにサブエージェント化する（モデル選択を可能にし文脈を抑える手段。
削減の実体は「一括処理のトークンが軽い層の単価で課金される」こと。同層の小さな
モジュールが多いときは層ごとに1サブエージェントへまとめる）、検証はルーティング
無しのときと完全に同一、2回失敗で1層上げて両方の記録に追記、モデル指定不可の
環境では推奨表の提示に落とす。

---

## 4. Escalation Policy — Details

- **Trigger**: the same module fails its verification gate twice under the
  assigned tier. Gates per artifact type:
  - **Spec-side artifacts** — VDMJ checks.
  - **Code-side artifacts** — the generated contract tests (plus type-check).
  - **Test-side artifacts** (generated test suites) — running the suite is NOT
    a sufficient gate: an under-specified suite passes trivially. The gate is a
    **clause-to-test coverage check** derived mechanically from the contract:
    every `inv` / `pre` / `post` / state-transition clause in the module must
    map to at least one test case (a cross-reference check, not model judgment).
    A missing clause counts as a verification failure for escalation purposes.

  テスト成果物のゲートは「実行して緑」では不十分（薄いテストは自明に通る）。
  契約から機械的に導いた「条項→テスト対照表」で判定し、対応するテストが無い
  条項があれば検証失敗として数える。
- **Action**: raise exactly one tier and regenerate the module from the spec
  (do not patch the failed artifact — regeneration keeps provenance clean).
- **Ceiling**: `heavy` is the ceiling; a failure at heavy is a genuine
  implementation problem, not a routing problem — report it to the user.
- **De-escalation**: only with explicit user confirmation, recorded as
  `userOverride: true`.
- **Reporting**: every escalation appears in `MODEL-ROUTING.md` under an
  "Escalations" section with module, from → to, and reason.

エスカレーションの上限は heavy。heavy で落ちるのはルーティングではなく実装の問題
なのでユーザーに報告する。層下げは明示的なユーザー確認がある場合のみ。

---

## 5. Worked Example

Spec with three modules:

```vdmsl
module Types
  -- 型と不変条件のみ（操作なし）
  ...
end Types

module TaskStore
  -- state + inv、明示的操作5つ、forall が2箇所
  ...
end TaskStore

module Scheduler
  -- 暗黙的定義3つ、imports Types/TaskStore、measure 1つ、PO 14件
  ...
end Scheduler
```

Scoring:

| Module | S1 | S2 | S3 | S4 | S5 | S6 | S7 | Total | Tier |
|--------|----|----|----|----|----|----|----|-------|------|
| Types | 0 | 0 | 0 | +1 | 0 | 0 | — | 1 | **light** (fast path: types-only) |
| TaskStore | +2 | 0 | +2 | +2 | 0 | 0 | — | 6 | **standard** |
| Scheduler | +1 | +6 | +2 | +2 | +1 | +2 | +2 | 16 | **heavy** |

Honest cost line for `MODEL-ROUTING.md`:

> 3モジュール中2つ（Types, TaskStore）をメインモデルより軽い層で処理します。
> 一括生成フェーズの大部分が light / standard で走るため、トークンあたりの
> コストとレイテンシが下がります（正確な削減率は実行環境の価格に依存します）。
