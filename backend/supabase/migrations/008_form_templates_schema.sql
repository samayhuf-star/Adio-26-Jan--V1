-- ============================================
-- FORM TEMPLATES SCHEMA
-- ============================================

-- Form Templates Table
CREATE TABLE IF NOT EXISTS form_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    thumbnail_url VARCHAR(500),
    preview_image_url VARCHAR(500),
    fields JSONB NOT NULL,
    settings JSONB,
    thank_you_message TEXT,
    sample_data JSONB,
    use_count INT DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- User Template Preferences
CREATE TABLE IF NOT EXISTS user_template_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES form_templates(id) ON DELETE CASCADE,
    liked BOOLEAN DEFAULT FALSE,
    used_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, template_id)
);

-- Template Analytics
CREATE TABLE IF NOT EXISTS template_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES form_templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN ('viewed', 'used', 'published', 'submitted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add template_used column to forms table (to track which template was used)
ALTER TABLE forms ADD COLUMN IF NOT EXISTS template_used UUID REFERENCES form_templates(id) ON DELETE SET NULL;

-- Create Indices
CREATE INDEX IF NOT EXISTS idx_form_templates_category ON form_templates(category);
CREATE INDEX IF NOT EXISTS idx_form_templates_featured ON form_templates(is_featured);
CREATE INDEX IF NOT EXISTS idx_form_templates_active ON form_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_form_templates_template_id ON form_templates(template_id);
CREATE INDEX IF NOT EXISTS idx_user_template_preferences_user_id ON user_template_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_template_analytics_template_id ON template_analytics(template_id);
CREATE INDEX IF NOT EXISTS idx_template_analytics_user_id ON template_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_template_analytics_created_at ON template_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forms_template_used ON forms(template_used);

-- Enable Row Level Security
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_template_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for form_templates
-- Everyone can view active templates (public catalog)
CREATE POLICY "Anyone can view active templates"
    ON form_templates FOR SELECT
    USING (is_active = TRUE);

-- RLS Policies for user_template_preferences
CREATE POLICY "Users can manage their own template preferences"
    ON user_template_preferences FOR ALL
    USING (auth.uid() = user_id);

-- RLS Policies for template_analytics
-- Users can insert their own analytics events
CREATE POLICY "Users can insert their own template analytics"
    ON template_analytics FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can view their own analytics
CREATE POLICY "Users can view their own template analytics"
    ON template_analytics FOR SELECT
    USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_form_templates_updated_at
    BEFORE UPDATE ON form_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

