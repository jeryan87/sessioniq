-- Session Templates table.
--
-- WHY: Session Templates are reusable definitions for types of sessions an
-- organization runs (e.g. "Executive Briefing", "Product Demo"). They store
-- default duration, feedback settings, scheduling preferences, and email
-- templates that get used when sessions of that type are booked.

CREATE TABLE public.session_templates (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id           UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Basic info
  name                      TEXT        NOT NULL,
  description               TEXT,

  -- Timing
  duration_minutes          INTEGER     NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
  feedback_window_hours     INTEGER     NOT NULL DEFAULT 24 CHECK (feedback_window_hours >= 0),

  -- Scheduling automations (NULL = "Don't send")
  reminder_minutes_before   INTEGER     CHECK (reminder_minutes_before > 0),
  followup_minutes_after    INTEGER     CHECK (followup_minutes_after >= 0),

  -- Feedback options
  require_self_identification BOOLEAN   NOT NULL DEFAULT false,

  -- Email templates (NULL = no template set)
  invitation_subject        TEXT,
  invitation_body           TEXT,
  reminder_subject          TEXT,
  reminder_body             TEXT,
  followup_subject          TEXT,
  followup_body             TEXT,

  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Keep updated_at current
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER session_templates_updated_at
  BEFORE UPDATE ON public.session_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS (policies in next migration)
ALTER TABLE public.session_templates ENABLE ROW LEVEL SECURITY;
