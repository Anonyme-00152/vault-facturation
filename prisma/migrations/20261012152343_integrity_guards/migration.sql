-- ─────────────────────────────────────────────────────────────
--  Garde-fous d'intégrité appliqués par la base elle-même :
--  ils s'appliquent même si l'application est contournée.
-- ─────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── 1. Journal d'audit : chaînage SHA-256 ────────────────────
-- Chaque entrée contient l'empreinte de la précédente : modifier ou retirer
-- une ligne casse la chaîne, ce que détecte la vérification d'intégrité.

CREATE OR REPLACE FUNCTION audit_log_canonical(r audit_log) RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT concat_ws('|',
    r.prev_hash,
    r.id::text,
    to_char(r.at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    coalesce(r.actor_id::text, ''),
    coalesce(r.actor_label, ''),
    r.action::text,
    coalesce(r.entity_type, ''),
    coalesce(r.entity_id, ''),
    coalesce(r.ip, ''),
    coalesce(r.user_agent, ''),
    coalesce(r.metadata::text, '')
  )
$$;

CREATE OR REPLACE FUNCTION audit_log_chain() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  last_hash text;
BEGIN
  -- Sérialise les insertions : l'identifiant, l'horodatage et le maillon
  -- précédent sont attribués dans le même ordre, sans fourche possible.
  PERFORM pg_advisory_xact_lock(hashtext('vault.audit_log_chain'));
  NEW.id := nextval(pg_get_serial_sequence('audit_log', 'id'));
  NEW.at := clock_timestamp();
  SELECT hash INTO last_hash FROM audit_log ORDER BY id DESC LIMIT 1;
  NEW.prev_hash := coalesce(last_hash, repeat('0', 64));
  NEW.hash := encode(digest(audit_log_canonical(NEW), 'sha256'), 'hex');
  RETURN NEW;
END
$$;

CREATE TRIGGER audit_log_chain
  BEFORE INSERT ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_chain();

-- ── 2. Journal d'audit : ajout seul ──────────────────────────
-- Aucune modification ni suppression. Seule exception : la purge de
-- maintenance des entrées de plus d'un an, hors application (voir SECURITY.md).

CREATE OR REPLACE FUNCTION audit_log_append_only() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE'
     AND current_setting('vault.audit_maintenance', true) = 'on'
     AND OLD.at < now() - interval '1 year' THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'Le journal d''audit est en ajout seul (% refusé)', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END
$$;

CREATE TRIGGER audit_log_append_only_rows
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_append_only();

CREATE TRIGGER audit_log_append_only_truncate
  BEFORE TRUNCATE ON audit_log
  FOR EACH STATEMENT EXECUTE FUNCTION audit_log_append_only();

-- ── 3. Factures émises : inaltérables ────────────────────────
-- Une facture numérotée ne peut plus changer (seuls son statut et ses dates
-- d'envoi et de paiement évoluent). Suppression possible seulement après
-- la durée légale de conservation de 10 ans.

CREATE OR REPLACE FUNCTION invoices_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.number IS NOT NULL AND OLD.issue_date >= current_date - interval '10 years' THEN
      RAISE EXCEPTION 'Une facture émise doit être conservée 10 ans (%)', OLD.number
        USING ERRCODE = 'integrity_constraint_violation';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.number IS NOT NULL AND (
       NEW.number IS DISTINCT FROM OLD.number
    OR NEW.year IS DISTINCT FROM OLD.year
    OR NEW.sequence IS DISTINCT FROM OLD.sequence
    OR NEW.client_id IS DISTINCT FROM OLD.client_id
    OR NEW.issue_date IS DISTINCT FROM OLD.issue_date
    OR NEW.service_date IS DISTINCT FROM OLD.service_date
    OR NEW.due_date IS DISTINCT FROM OLD.due_date
    OR NEW.total_ht_cents IS DISTINCT FROM OLD.total_ht_cents
    OR NEW.total_vat_cents IS DISTINCT FROM OLD.total_vat_cents
    OR NEW.total_ttc_cents IS DISTINCT FROM OLD.total_ttc_cents
    OR NEW.client_snapshot_enc IS DISTINCT FROM OLD.client_snapshot_enc
    OR NEW.seller_snapshot IS DISTINCT FROM OLD.seller_snapshot
    OR NEW.notes IS DISTINCT FROM OLD.notes
  ) THEN
    RAISE EXCEPTION 'La facture % est émise : elle ne peut plus être modifiée', OLD.number
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;

  IF OLD.number IS NOT NULL AND NEW.status = 'DRAFT' THEN
    RAISE EXCEPTION 'La facture % est émise : elle ne peut pas redevenir un brouillon', OLD.number
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;

  RETURN NEW;
END
$$;

CREATE TRIGGER invoices_guard
  BEFORE UPDATE OR DELETE ON invoices
  FOR EACH ROW EXECUTE FUNCTION invoices_guard();

CREATE OR REPLACE FUNCTION invoice_lines_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  parent_number text;
BEGIN
  SELECT number INTO parent_number FROM invoices
   WHERE id = CASE WHEN TG_OP = 'DELETE' THEN OLD.invoice_id ELSE NEW.invoice_id END;
  IF parent_number IS NOT NULL THEN
    RAISE EXCEPTION 'La facture % est émise : ses lignes ne peuvent plus changer', parent_number
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

CREATE TRIGGER invoice_lines_guard
  BEFORE INSERT OR UPDATE OR DELETE ON invoice_lines
  FOR EACH ROW EXECUTE FUNCTION invoice_lines_guard();

-- ── 4. Cohérence des montants et des formats ─────────────────

ALTER TABLE invoices
  ADD CONSTRAINT invoices_totals_check
    CHECK (total_ttc_cents = total_ht_cents + total_vat_cents AND total_ht_cents >= 0 AND total_vat_cents >= 0),
  ADD CONSTRAINT invoices_number_format
    CHECK (number IS NULL OR number ~ '^FAC-[0-9]{4}-[0-9]{6}$'),
  ADD CONSTRAINT invoices_issued_fields
    CHECK ((number IS NULL) = (status = 'DRAFT')
       AND (number IS NULL OR (issue_date IS NOT NULL AND year IS NOT NULL AND sequence IS NOT NULL)));

ALTER TABLE invoice_lines
  ADD CONSTRAINT invoice_lines_values_check
    CHECK (quantity_milli > 0 AND unit_price_cents >= 0 AND vat_rate_bp IN (0, 210, 550, 1000, 2000));

ALTER TABLE clients
  ADD CONSTRAINT clients_siret_format CHECK (siret IS NULL OR siret ~ '^[0-9]{14}$'),
  ADD CONSTRAINT clients_payment_terms CHECK (payment_terms_days BETWEEN 0 AND 60);

ALTER TABLE settings
  ADD CONSTRAINT settings_single_row CHECK (id = 1),
  ADD CONSTRAINT settings_invoice_retention CHECK (invoice_retention_years >= 10);
