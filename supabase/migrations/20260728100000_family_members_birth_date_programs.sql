-- Family members: store date of birth and selected program IDs from membership registration.

ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS selected_programs text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN family_members.birth_date IS 'Family member date of birth (membership registration).';
COMMENT ON COLUMN family_members.selected_programs IS 'UID program IDs the family member is registered for (eligibility by age).';
