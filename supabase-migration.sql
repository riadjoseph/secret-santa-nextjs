-- ============================================
-- Secret Santa - Gift Pool Model Migration
-- ============================================
-- This migration transitions from peer-to-peer gifting to sponsor gift pool model

-- ============================================
-- 1. CREATE NEW TABLES
-- ============================================

-- Sponsors table (Tool companies that contribute gifts)
CREATE TABLE IF NOT EXISTS sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  contact_email TEXT NOT NULL,
  tier TEXT CHECK (tier IN ('Gold', 'Silver', 'Bronze')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Gifts table (Pool of gifts from sponsors)
CREATE TABLE IF NOT EXISTS gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID REFERENCES sponsors(id) ON DELETE CASCADE,
  gift_name TEXT NOT NULL,
  gift_description TEXT,
  gift_type TEXT NOT NULL CHECK (gift_type IN ('trial', 'license', 'audit', 'consultation', 'credits', 'other')),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  quantity_claimed INTEGER NOT NULL DEFAULT 0 CHECK (quantity_claimed >= 0),
  value_usd INTEGER CHECK (value_usd >= 0),
  redemption_instructions TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'exhausted', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT quantity_check CHECK (quantity_claimed <= quantity)
);

-- Gift assignments table (Participants assigned to gifts)
CREATE TABLE IF NOT EXISTS gift_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_id UUID REFERENCES gifts(id) ON DELETE CASCADE NOT NULL,
  participant_email TEXT NOT NULL,
  redemption_code TEXT,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'redeemed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 2. MODIFY EXISTING TABLES
-- ============================================

-- Add preferences columns to participants (replace pledge concept with quick presets)
ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS preferences TEXT,
  ADD COLUMN IF NOT EXISTS gift_preference_preset TEXT CHECK (gift_preference_preset IN ('sponsored-tool', 'personal-audit', 'learning-resources', 'surprise-me'));

-- Backfill preferences from existing pledge data (optional)
-- UPDATE participants SET preferences = pledge WHERE preferences IS NULL;

-- Note: We keep the old 'pledge' column for now to avoid breaking existing code
-- It will be removed in a future migration after all code is updated

-- ============================================
-- 3. CREATE INDEXES
-- ============================================

-- Optimize sponsor lookups
CREATE INDEX IF NOT EXISTS idx_sponsors_tier ON sponsors(tier);
CREATE INDEX IF NOT EXISTS idx_sponsors_contact_email ON sponsors(contact_email);

-- Optimize gift queries
CREATE INDEX IF NOT EXISTS idx_gifts_sponsor_id ON gifts(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_gifts_status ON gifts(status);
CREATE INDEX IF NOT EXISTS idx_gifts_type ON gifts(gift_type);

-- Optimize assignment queries
CREATE INDEX IF NOT EXISTS idx_gift_assignments_participant ON gift_assignments(participant_email);
CREATE INDEX IF NOT EXISTS idx_gift_assignments_gift_id ON gift_assignments(gift_id);
CREATE INDEX IF NOT EXISTS idx_gift_assignments_status ON gift_assignments(status);

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on new tables
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_assignments ENABLE ROW LEVEL SECURITY;

-- Sponsors: Public read, admin write
CREATE POLICY "Allow public read sponsors" ON sponsors
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin insert sponsors" ON sponsors
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.email() IN (
      SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
    )
  );

CREATE POLICY "Allow admin update sponsors" ON sponsors
  FOR UPDATE TO authenticated
  USING (
    auth.email() IN (
      SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
    )
  );

CREATE POLICY "Allow admin delete sponsors" ON sponsors
  FOR DELETE TO authenticated
  USING (
    auth.email() IN (
      SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
    )
  );

-- Gifts: Public read active gifts, admin full access
CREATE POLICY "Allow public read active gifts" ON gifts
  FOR SELECT TO authenticated USING (status = 'active' OR auth.email() IN (
    SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
  ));

CREATE POLICY "Allow admin insert gifts" ON gifts
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.email() IN (
      SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
    )
  );

CREATE POLICY "Allow admin update gifts" ON gifts
  FOR UPDATE TO authenticated
  USING (
    auth.email() IN (
      SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
    )
  );

CREATE POLICY "Allow admin delete gifts" ON gifts
  FOR DELETE TO authenticated
  USING (
    auth.email() IN (
      SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
    )
  );

-- Gift assignments: Users can only see their own, admin sees all
CREATE POLICY "Allow user read own assignment" ON gift_assignments
  FOR SELECT TO authenticated
  USING (
    participant_email = auth.email() OR
    auth.email() IN (
      SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
    )
  );

CREATE POLICY "Allow admin insert assignments" ON gift_assignments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.email() IN (
      SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
    )
  );

CREATE POLICY "Allow user update own assignment status" ON gift_assignments
  FOR UPDATE TO authenticated
  USING (participant_email = auth.email())
  WITH CHECK (participant_email = auth.email());

CREATE POLICY "Allow admin update assignments" ON gift_assignments
  FOR UPDATE TO authenticated
  USING (
    auth.email() IN (
      SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
    )
  );

-- ============================================
-- 5. UPDATE EXISTING RLS POLICIES (SECURITY HARDENING)
-- ============================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow authenticated read" ON participants;

-- Participants: Users can read all (for community aspect), but only update own
-- Admin can read all via admin check in application layer
CREATE POLICY "Allow authenticated read all participants" ON participants
  FOR SELECT TO authenticated USING (true);

-- Users can only update their own profile
CREATE POLICY "Allow user update own profile" ON participants
  FOR UPDATE TO authenticated
  USING (auth.email() = email)
  WITH CHECK (auth.email() = email);

-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

-- Function to check if user is admin (useful for application logic)
CREATE OR REPLACE FUNCTION is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_email IN (
    SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get available gifts (not exhausted)
CREATE OR REPLACE FUNCTION get_available_gifts()
RETURNS TABLE (
  id UUID,
  sponsor_id UUID,
  gift_name TEXT,
  gift_description TEXT,
  gift_type TEXT,
  available_quantity INTEGER,
  value_usd INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.sponsor_id,
    g.gift_name,
    g.gift_description,
    g.gift_type,
    (g.quantity - g.quantity_claimed) as available_quantity,
    g.value_usd
  FROM gifts g
  WHERE g.status = 'active'
    AND g.quantity > g.quantity_claimed
  ORDER BY g.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update gift status when fully claimed
CREATE OR REPLACE FUNCTION update_gift_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quantity_claimed >= NEW.quantity THEN
    NEW.status := 'exhausted';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gift_status_trigger
  BEFORE UPDATE ON gifts
  FOR EACH ROW
  EXECUTE FUNCTION update_gift_status();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- To set admin emails in Supabase, run this in your SQL editor:
-- ALTER DATABASE postgres SET app.admin_emails = 'admin@seokringle.com,other@example.com';

COMMENT ON TABLE sponsors IS 'SEO tool companies that contribute gifts to the pool';
COMMENT ON TABLE gifts IS 'Pool of gifts contributed by sponsors';
COMMENT ON TABLE gift_assignments IS 'Assignments of gifts from pool to participants';
