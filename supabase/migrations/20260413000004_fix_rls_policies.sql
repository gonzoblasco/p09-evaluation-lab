-- Migration: Fix RLS policies for P09 Evaluation Lab
-- This migration enables RLS and adds policies to allow operations for both authenticated and anon users.

-- 1. Enable RLS on all tables
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE eval_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE eval_results ENABLE ROW LEVEL SECURITY;

-- 2. Policies for test_cases
-- Allow full access to authenticated users
CREATE POLICY "Allow all to authenticated" ON test_cases
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Allow read/write access to anon users for the dashboard
CREATE POLICY "Allow select to anon" ON test_cases
  FOR SELECT TO anon USING (true);
CREATE POLICY "Allow insert to anon" ON test_cases
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow update to anon" ON test_cases
  FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete to anon" ON test_cases
  FOR DELETE TO anon USING (true);

-- 3. Policies for prompt_variants
CREATE POLICY "Allow all to authenticated" ON prompt_variants
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow select to anon" ON prompt_variants
  FOR SELECT TO anon USING (true);
CREATE POLICY "Allow insert to anon" ON prompt_variants
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow update to anon" ON prompt_variants
  FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete to anon" ON prompt_variants
  FOR DELETE TO anon USING (true);

-- 4. Policies for eval_runs
CREATE POLICY "Allow all to authenticated" ON eval_runs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow select to anon" ON eval_runs
  FOR SELECT TO anon USING (true);
CREATE POLICY "Allow insert to anon" ON eval_runs
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow update to anon" ON eval_runs
  FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete to anon" ON eval_runs
  FOR DELETE TO anon USING (true);

-- 5. Policies for eval_results
CREATE POLICY "Allow all to authenticated" ON eval_results
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow select to anon" ON eval_results
  FOR SELECT TO anon USING (true);
CREATE POLICY "Allow insert to anon" ON eval_results
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow update to anon" ON eval_results
  FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete to anon" ON eval_results
  FOR DELETE TO anon USING (true);
