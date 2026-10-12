-- Ordre de chaînage du journal d'audit.
-- L'identifiant vient de la séquence par défaut (attribuée avant le verrou) ;
-- le rang `seq` est attribué sous verrou, dans l'ordre exact du chaînage.

CREATE SEQUENCE audit_log_chain_seq;

ALTER TABLE "audit_log" ADD COLUMN "seq" BIGINT;

-- Rattrapage des entrées existantes (opération de schéma, triggers suspendus le temps de la migration).
ALTER TABLE audit_log DISABLE TRIGGER audit_log_append_only_rows;
UPDATE audit_log SET seq = id;
ALTER TABLE audit_log ENABLE TRIGGER audit_log_append_only_rows;
SELECT setval('audit_log_chain_seq', coalesce((SELECT max(seq) FROM audit_log), 0) + 1, false);

CREATE UNIQUE INDEX "audit_log_seq_key" ON "audit_log"("seq");

CREATE OR REPLACE FUNCTION audit_log_chain() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  last_hash text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('vault.audit_log_chain'));
  NEW.seq := nextval('audit_log_chain_seq');
  NEW.at := clock_timestamp();
  SELECT hash INTO last_hash FROM audit_log ORDER BY seq DESC LIMIT 1;
  NEW.prev_hash := coalesce(last_hash, repeat('0', 64));
  NEW.hash := encode(digest(audit_log_canonical(NEW), 'sha256'), 'hex');
  RETURN NEW;
END
$$;
