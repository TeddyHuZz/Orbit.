-- Create Date Plans Table
CREATE TABLE IF NOT EXISTS date_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    location_name TEXT,
    date_time TIMESTAMPTZ,
    media JSONB DEFAULT '[]'::jsonb, -- Array of {type: 'image'|'video'|'link', url: string}
    is_completed BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE date_plans ENABLE ROW LEVEL SECURITY;

-- Policies for date_plans
-- 1. Users can view plans created by themselves OR by their partner
CREATE POLICY "Users can view own and partner's plans" ON date_plans
    FOR SELECT USING (
        auth.uid() = created_by OR 
        auth.uid() IN (
            SELECT partner_id FROM profiles WHERE id = date_plans.created_by
        ) OR
        auth.uid() IN (
            SELECT id FROM profiles WHERE partner_id = date_plans.created_by
        )
    );

-- 2. Users can insert their own plans
CREATE POLICY "Users can insert own plans" ON date_plans
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- 3. Users can update their own OR partner's plans (for marking completed, etc.)
CREATE POLICY "Users can update own and partner's plans" ON date_plans
    FOR UPDATE USING (
        auth.uid() = created_by OR 
        auth.uid() IN (
            SELECT partner_id FROM profiles WHERE id = date_plans.created_by
        ) OR
        auth.uid() IN (
            SELECT id FROM profiles WHERE partner_id = date_plans.created_by
        )
    );

-- 4. Users can delete their own plans
CREATE POLICY "Users can delete own plans" ON date_plans
    FOR DELETE USING (auth.uid() = created_by);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_date_plans_updated_at
    BEFORE UPDATE ON date_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
