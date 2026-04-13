-- Migration: Create evaluation lab schema
-- P09 Evaluation Lab

-- test_cases: representa interacciones reales de SoporteML
create table if not exists test_cases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  buyer_question text not null,
  seller_context text not null,
  expected_response text not null,
  category text not null,
  created_at timestamptz not null default now()
);

-- prompt_variants: variantes del system prompt a comparar
create table if not exists prompt_variants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  system_prompt text not null,
  version integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- eval_runs: agrupador de una corrida de evaluación
create table if not exists eval_runs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

-- eval_results: resultado individual por (run, test_case, prompt_variant)
create table if not exists eval_results (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references eval_runs(id) on delete cascade,
  test_case_id uuid not null references test_cases(id) on delete cascade,
  prompt_variant_id uuid not null references prompt_variants(id) on delete cascade,
  actual_response text,
  judge_score numeric(4,3) check (judge_score >= 0 and judge_score <= 1),
  judge_reasoning text,
  latency_ms integer,
  tokens_used integer,
  created_at timestamptz not null default now()
);

-- índices para queries frecuentes
create index if not exists idx_eval_results_run_id on eval_results(run_id);
create index if not exists idx_eval_results_test_case_id on eval_results(test_case_id);
create index if not exists idx_eval_results_prompt_variant_id on eval_results(prompt_variant_id);
create index if not exists idx_test_cases_category on test_cases(category);
create index if not exists idx_eval_runs_status on eval_runs(status);
