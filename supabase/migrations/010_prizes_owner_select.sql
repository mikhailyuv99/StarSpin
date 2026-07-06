-- Merchants must read all their prizes (including inactive) in the dashboard.
DROP POLICY IF EXISTS prizes_owner_select ON prizes;
CREATE POLICY prizes_owner_select ON prizes
  FOR SELECT TO authenticated
  USING (owns_merchant(merchant_id) OR is_admin());
