# エージェント間契約テンプレート集

マルチエージェント開発で頻出するパターンをVDM-SL仕様のテンプレートとして提供する。

## パターン1: データ変換エージェント

入力データを別の形式に変換して返すエージェント。副作用なし。

```vdm-sl
module TransformAgent
definitions
types
  InputData :: -- 入力の型定義
    field1 : seq1 of char
    field2 : nat;

  OutputData :: -- 出力の型定義
    result : seq1 of char
    score  : real
  inv o == o.score >= 0.0 and o.score <= 1.0;

functions
  transform: InputData -> OutputData
  transform(input) == -- 実装（暗黙的定義も可）
    mk_OutputData(input.field1, 0.5)
  pre len input.field1 > 0
  post RESULT.score >= 0.0 and RESULT.score <= 1.0;

end TransformAgent
```

**適用例**: テキスト分析エージェント、データ整形エージェント、スコアリングエージェント

## パターン2: CRUD操作エージェント

内部状態を持ち、作成・読取・更新・削除の操作を提供するエージェント。

```vdm-sl
module CrudAgent
definitions
types
  EntityId = nat1;
  Entity :: name : seq1 of char
            data : seq of char;

state EntityStore of
  entities : map EntityId to Entity
  nextId   : EntityId
inv mk_EntityStore(entities, nextId) ==
  nextId not in set dom entities
init s == s = mk_EntityStore({|->}, 1)
end

operations
  Create: seq1 of char * seq of char ==> EntityId
  Create(name, data) == (
    dcl id : EntityId := nextId;
    entities := entities munion {id |-> mk_Entity(name, data)};
    nextId := nextId + 1;
    return id
  )
  pre true  -- 常に作成可能
  post RESULT in set dom entities;

  Read: EntityId ==> Entity
  Read(id) ==
    return entities(id)
  pre id in set dom entities;

  Update: EntityId * Entity ==> ()
  Update(id, entity) ==
    entities := entities ++ {id |-> entity}
  pre id in set dom entities
  post entities(id) = entity;

  Delete: EntityId ==> ()
  Delete(id) ==
    entities := {id} <-: entities
  pre id in set dom entities
  post id not in set dom entities;

end CrudAgent
```

**適用例**: ユーザー管理エージェント、タスク管理エージェント、設定管理エージェント

## パターン3: パイプラインエージェント

複数の処理ステップを順序付きで実行するエージェント。

```vdm-sl
module PipelineAgent
definitions
types
  StepId = nat1;

  StepResult = <Success> | <Failure> | <Skipped>;

  PipelineResult :: steps   : seq of StepResult
                    success : bool
  inv r == r.success = (forall i in set inds r.steps & r.steps(i) <> <Failure>);

functions
  allSucceeded: seq of StepResult -> bool
  allSucceeded(results) ==
    forall i in set inds results & results(i) = <Success>
  pre len results > 0;

  canProceed: seq of StepResult * nat1 -> bool
  canProceed(results, step) ==
    step = 1 or results(step - 1) = <Success>
  pre step >= 1 and step <= len results + 1;

end PipelineAgent
```

**適用例**: CI/CDエージェント、データ処理パイプライン、ワークフローエンジン

## パターン4: 仲介エージェント（Mediator）

複数のエージェント間のメッセージを仲介し、ルーティングするエージェント。

```vdm-sl
module MediatorAgent
definitions
types
  AgentId = token;

  Message :: sender    : AgentId
             receiver  : AgentId
             payload   : seq of char
             timestamp : nat;

  RoutingRule :: from    : AgentId
                 to      : AgentId
                 filter  : seq of char;  -- メッセージフィルタ条件

state MessageBroker of
  queue : seq of Message
  rules : set of RoutingRule
  agents : set of AgentId
inv mk_MessageBroker(queue, rules, agents) ==
  forall r in set rules &
    r.from in set agents and r.to in set agents
init s == s = mk_MessageBroker([], {}, {})
end

operations
  RegisterAgent: AgentId ==> ()
  RegisterAgent(id) ==
    agents := agents union {id}
  pre id not in set agents
  post id in set agents;

  Send: Message ==> ()
  Send(msg) ==
    queue := queue ^ [msg]
  pre msg.sender in set agents and msg.receiver in set agents
  post len queue = len queue~ + 1;

  Receive: AgentId ==> [Message]
  Receive(id) == (
    -- 先頭からidへのメッセージを探す
    if exists i in set inds queue & queue(i).receiver = id
    then (
      dcl idx : nat1 := 1;
      -- 最初のマッチを見つける
      while queue(idx).receiver <> id do
        idx := idx + 1;
      dcl msg : Message := queue(idx);
      queue := queue(1,...,idx-1) ^ queue(idx+1,...,len queue);
      return msg
    )
    else
      return nil
  )
  pre id in set agents;

end MediatorAgent
```

**適用例**: イベントバス、メッセージキュー、オーケストレーター

## パターン5: バリデーションエージェント

データの妥当性を検証し、結果を返すエージェント。

```vdm-sl
module ValidationAgent
definitions
types
  Severity = <Error> | <Warning> | <Info>;

  ValidationIssue :: field    : seq1 of char
                     message  : seq1 of char
                     severity : Severity;

  ValidationResult :: valid  : bool
                      issues : seq of ValidationIssue
  inv r == r.valid = (not exists i in set inds r.issues &
                        r.issues(i).severity = <Error>);

functions
  validate: map seq1 of char to seq of char -> ValidationResult
  validate(data) ==
    -- 暗黙的定義: 具体的なルールは実装で定義
    mk_ValidationResult(true, [])
  post RESULT.valid = (not exists i in set inds RESULT.issues &
                         RESULT.issues(i).severity = <Error>);

  hasErrors: ValidationResult -> bool
  hasErrors(result) ==
    exists i in set inds result.issues &
      result.issues(i).severity = <Error>;

  errorCount: ValidationResult -> nat
  errorCount(result) ==
    card {i | i in set inds result.issues &
              result.issues(i).severity = <Error>};

end ValidationAgent
```

**適用例**: 入力バリデーション、スキーマ検証、ポリシーチェック
