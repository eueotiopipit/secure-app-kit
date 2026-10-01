CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('expense','income')),
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  category text NOT NULL CHECK (char_length(category) BETWEEN 1 AND 60),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 160),
  occurred_on date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text CHECK (payment_method IS NULL OR char_length(payment_method) <= 40),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 500),
  recurring_transaction_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_transactions TO authenticated;
GRANT ALL ON public.financial_transactions TO service_role;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transactions_select_own" ON public.financial_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert_own" ON public.financial_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_update_own" ON public.financial_transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_delete_own" ON public.financial_transactions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX financial_transactions_user_date_idx ON public.financial_transactions(user_id, occurred_on DESC);
CREATE INDEX financial_transactions_user_type_date_idx ON public.financial_transactions(user_id, type, occurred_on DESC);
CREATE TRIGGER financial_transactions_updated_at BEFORE UPDATE ON public.financial_transactions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  creditor text NOT NULL DEFAULT '' CHECK (char_length(creditor) <= 100),
  debt_type text NOT NULL CHECK (debt_type IN ('Cartão','Empréstimo','Financiamento','Conta atrasada','Cheque especial','Familiar/amigo','Outros')),
  original_amount_cents bigint NOT NULL CHECK (original_amount_cents > 0),
  paid_amount_cents bigint NOT NULL DEFAULT 0 CHECK (paid_amount_cents >= 0),
  installment_amount_cents bigint NOT NULL DEFAULT 0 CHECK (installment_amount_cents >= 0),
  total_installments integer NOT NULL DEFAULT 0 CHECK (total_installments >= 0),
  paid_installments integer NOT NULL DEFAULT 0 CHECK (paid_installments >= 0),
  monthly_interest_rate numeric(7,4) NOT NULL DEFAULT 0 CHECK (monthly_interest_rate >= 0),
  next_due_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','overdue','negotiating','paid')),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 500),
  paid_off_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (paid_amount_cents <= original_amount_cents),
  CHECK (paid_installments <= total_installments OR total_installments = 0)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.debts TO authenticated;
GRANT ALL ON public.debts TO service_role;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "debts_select_own" ON public.debts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "debts_insert_own" ON public.debts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "debts_update_own" ON public.debts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "debts_delete_own" ON public.debts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX debts_user_status_idx ON public.debts(user_id, status);
CREATE INDEX debts_user_due_idx ON public.debts(user_id, next_due_date);
CREATE TRIGGER debts_updated_at BEFORE UPDATE ON public.debts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.debt_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  debt_id uuid NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  paid_on date NOT NULL DEFAULT CURRENT_DATE,
  notes text CHECK (notes IS NULL OR char_length(notes) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.debt_payments TO authenticated;
GRANT ALL ON public.debt_payments TO service_role;
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "debt_payments_select_own" ON public.debt_payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "debt_payments_insert_own" ON public.debt_payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.debts d WHERE d.id = debt_id AND d.user_id = auth.uid()));
CREATE POLICY "debt_payments_update_own" ON public.debt_payments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.debts d WHERE d.id = debt_id AND d.user_id = auth.uid()));
CREATE POLICY "debt_payments_delete_own" ON public.debt_payments FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX debt_payments_debt_date_idx ON public.debt_payments(debt_id, paid_on DESC);
CREATE TRIGGER debt_payments_updated_at BEFORE UPDATE ON public.debt_payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.recalculate_debt_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id uuid := COALESCE(NEW.debt_id, OLD.debt_id);
  total_paid bigint;
BEGIN
  SELECT COALESCE(sum(amount_cents), 0) INTO total_paid FROM public.debt_payments WHERE debt_id = target_id;
  UPDATE public.debts
  SET paid_amount_cents = LEAST(original_amount_cents, total_paid),
      paid_installments = CASE WHEN installment_amount_cents > 0 THEN LEAST(CASE WHEN total_installments > 0 THEN total_installments ELSE 2147483647 END, floor(total_paid::numeric / installment_amount_cents)::integer) ELSE paid_installments END,
      status = CASE WHEN total_paid >= original_amount_cents THEN 'paid' WHEN next_due_date < CURRENT_DATE THEN 'overdue' ELSE 'active' END,
      paid_off_at = CASE WHEN total_paid >= original_amount_cents THEN COALESCE(paid_off_at, now()) ELSE NULL END
  WHERE id = target_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;
CREATE TRIGGER recalculate_debt_after_payment AFTER INSERT OR UPDATE OR DELETE ON public.debt_payments FOR EACH ROW EXECUTE FUNCTION public.recalculate_debt_payment();

CREATE TABLE public.piggy_banks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  objective text NOT NULL DEFAULT '' CHECK (char_length(objective) <= 240),
  target_amount_cents bigint NOT NULL CHECK (target_amount_cents > 0),
  current_amount_cents bigint NOT NULL DEFAULT 0 CHECK (current_amount_cents >= 0),
  target_date date,
  category text NOT NULL DEFAULT 'Meta personalizada' CHECK (char_length(category) <= 60),
  icon text NOT NULL DEFAULT 'PiggyBank' CHECK (char_length(icon) <= 40),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.piggy_banks TO authenticated;
GRANT ALL ON public.piggy_banks TO service_role;
ALTER TABLE public.piggy_banks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "piggy_banks_select_own" ON public.piggy_banks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "piggy_banks_insert_own" ON public.piggy_banks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "piggy_banks_update_own" ON public.piggy_banks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "piggy_banks_delete_own" ON public.piggy_banks FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX piggy_banks_user_status_idx ON public.piggy_banks(user_id, status);
CREATE TRIGGER piggy_banks_updated_at BEFORE UPDATE ON public.piggy_banks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.piggy_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  piggy_bank_id uuid NOT NULL REFERENCES public.piggy_banks(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('deposit','withdrawal')),
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  occurred_on date NOT NULL DEFAULT CURRENT_DATE,
  notes text CHECK (notes IS NULL OR char_length(notes) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.piggy_movements TO authenticated;
GRANT ALL ON public.piggy_movements TO service_role;
ALTER TABLE public.piggy_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "piggy_movements_select_own" ON public.piggy_movements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "piggy_movements_insert_own" ON public.piggy_movements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.piggy_banks p WHERE p.id = piggy_bank_id AND p.user_id = auth.uid()));
CREATE POLICY "piggy_movements_update_own" ON public.piggy_movements FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.piggy_banks p WHERE p.id = piggy_bank_id AND p.user_id = auth.uid()));
CREATE POLICY "piggy_movements_delete_own" ON public.piggy_movements FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX piggy_movements_piggy_date_idx ON public.piggy_movements(piggy_bank_id, occurred_on DESC);
CREATE TRIGGER piggy_movements_updated_at BEFORE UPDATE ON public.piggy_movements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.recalculate_piggy_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id uuid := COALESCE(NEW.piggy_bank_id, OLD.piggy_bank_id);
  new_balance bigint;
BEGIN
  SELECT COALESCE(sum(CASE WHEN movement_type = 'deposit' THEN amount_cents ELSE -amount_cents END), 0)
  INTO new_balance FROM public.piggy_movements WHERE piggy_bank_id = target_id;
  IF new_balance < 0 THEN RAISE EXCEPTION 'A retirada não pode ser maior que o saldo do porquinho'; END IF;
  UPDATE public.piggy_banks
  SET current_amount_cents = new_balance,
      status = CASE WHEN new_balance >= target_amount_cents THEN 'completed' WHEN status = 'archived' THEN 'archived' ELSE 'active' END
  WHERE id = target_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;
CREATE TRIGGER recalculate_piggy_after_movement AFTER INSERT OR UPDATE OR DELETE ON public.piggy_movements FOR EACH ROW EXECUTE FUNCTION public.recalculate_piggy_balance();

CREATE TABLE public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (char_length(category) BETWEEN 1 AND 60),
  month date NOT NULL,
  limit_cents bigint NOT NULL CHECK (limit_cents > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, category, month),
  CHECK (date_trunc('month', month)::date = month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO authenticated;
GRANT ALL ON public.budgets TO service_role;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "budgets_select_own" ON public.budgets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "budgets_insert_own" ON public.budgets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budgets_update_own" ON public.budgets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budgets_delete_own" ON public.budgets FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX budgets_user_month_idx ON public.budgets(user_id, month DESC);
CREATE TRIGGER budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.recurring_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('expense','income')),
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  category text NOT NULL CHECK (char_length(category) BETWEEN 1 AND 60),
  description text NOT NULL CHECK (char_length(description) BETWEEN 1 AND 160),
  payment_method text CHECK (payment_method IS NULL OR char_length(payment_method) <= 40),
  frequency text NOT NULL CHECK (frequency IN ('weekly','monthly','yearly')),
  start_date date NOT NULL,
  end_date date,
  next_occurrence date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR end_date >= start_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recurring_transactions TO authenticated;
GRANT ALL ON public.recurring_transactions TO service_role;
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recurring_select_own" ON public.recurring_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "recurring_insert_own" ON public.recurring_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recurring_update_own" ON public.recurring_transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recurring_delete_own" ON public.recurring_transactions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX recurring_user_next_idx ON public.recurring_transactions(user_id, next_occurrence) WHERE is_active;
CREATE TRIGGER recurring_transactions_updated_at BEFORE UPDATE ON public.recurring_transactions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.financial_transactions ADD CONSTRAINT financial_transactions_recurring_fkey FOREIGN KEY (recurring_transaction_id) REFERENCES public.recurring_transactions(id) ON DELETE SET NULL;

CREATE TABLE public.challenge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number integer NOT NULL CHECK (day_number BETWEEN 1 AND 30),
  completed boolean NOT NULL DEFAULT false,
  completed_on date,
  notes text CHECK (notes IS NULL OR char_length(notes) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, day_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenge_progress TO authenticated;
GRANT ALL ON public.challenge_progress TO service_role;
ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "challenge_select_own" ON public.challenge_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "challenge_insert_own" ON public.challenge_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "challenge_update_own" ON public.challenge_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "challenge_delete_own" ON public.challenge_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER challenge_progress_updated_at BEFORE UPDATE ON public.challenge_progress FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type text NOT NULL CHECK (alert_type IN ('budget','debt_due','debt_overdue','goal','general')),
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical','success')),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 300),
  reference_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alerts_select_own" ON public.alerts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "alerts_insert_own" ON public.alerts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "alerts_update_own" ON public.alerts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "alerts_delete_own" ON public.alerts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX alerts_user_unread_idx ON public.alerts(user_id, is_read, created_at DESC);
CREATE TRIGGER alerts_updated_at BEFORE UPDATE ON public.alerts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.debt_diagnostics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  debt_id uuid REFERENCES public.debts(id) ON DELETE CASCADE,
  can_pay_essentials boolean NOT NULL,
  high_interest text NOT NULL CHECK (high_interest IN ('yes','no','unknown')),
  is_overdue boolean NOT NULL,
  strains_budget boolean NOT NULL,
  has_offer boolean NOT NULL,
  has_savings boolean NOT NULL,
  suggested_strategy text NOT NULL CHECK (suggested_strategy IN ('organize','prioritize_costs','evaluate_renegotiation','reorganize_budget')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.debt_diagnostics TO authenticated;
GRANT ALL ON public.debt_diagnostics TO service_role;
ALTER TABLE public.debt_diagnostics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "diagnostics_select_own" ON public.debt_diagnostics FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "diagnostics_insert_own" ON public.debt_diagnostics FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND (debt_id IS NULL OR EXISTS (SELECT 1 FROM public.debts d WHERE d.id = debt_id AND d.user_id = auth.uid())));
CREATE POLICY "diagnostics_update_own" ON public.debt_diagnostics FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND (debt_id IS NULL OR EXISTS (SELECT 1 FROM public.debts d WHERE d.id = debt_id AND d.user_id = auth.uid())));
CREATE POLICY "diagnostics_delete_own" ON public.debt_diagnostics FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER debt_diagnostics_updated_at BEFORE UPDATE ON public.debt_diagnostics FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.renegotiation_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  debt_id uuid NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  down_payment_cents bigint NOT NULL DEFAULT 0 CHECK (down_payment_cents >= 0),
  installment_count integer NOT NULL CHECK (installment_count > 0),
  installment_amount_cents bigint NOT NULL CHECK (installment_amount_cents > 0),
  interest_rate numeric(7,4) NOT NULL DEFAULT 0 CHECK (interest_rate >= 0),
  discount_cents bigint NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.renegotiation_proposals TO authenticated;
GRANT ALL ON public.renegotiation_proposals TO service_role;
ALTER TABLE public.renegotiation_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proposals_select_own" ON public.renegotiation_proposals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "proposals_insert_own" ON public.renegotiation_proposals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.debts d WHERE d.id = debt_id AND d.user_id = auth.uid()));
CREATE POLICY "proposals_update_own" ON public.renegotiation_proposals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.debts d WHERE d.id = debt_id AND d.user_id = auth.uid()));
CREATE POLICY "proposals_delete_own" ON public.renegotiation_proposals FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX proposals_debt_idx ON public.renegotiation_proposals(debt_id, created_at DESC);
CREATE TRIGGER renegotiation_proposals_updated_at BEFORE UPDATE ON public.renegotiation_proposals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();