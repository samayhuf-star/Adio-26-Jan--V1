-- ============================================
-- FORMS MODULE SCHEMA
-- ============================================

-- Forms Table
CREATE TABLE IF NOT EXISTS forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Form Fields Table
CREATE TABLE IF NOT EXISTS form_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'email', 'phone', 'number', 'textarea', 'select', 'radio', 'checkbox')),
    label VARCHAR(255) NOT NULL,
    placeholder VARCHAR(255),
    required BOOLEAN DEFAULT FALSE,
    options JSONB,
    position INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Form Submissions Table
CREATE TABLE IF NOT EXISTS form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    submission_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indices
CREATE INDEX IF NOT EXISTS idx_forms_user ON forms(user_id);
CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);
CREATE INDEX IF NOT EXISTS idx_form_fields_form ON form_fields(form_id);
CREATE INDEX IF NOT EXISTS idx_form_fields_position ON form_fields(form_id, position);
CREATE INDEX IF NOT EXISTS idx_submissions_form ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created ON form_submissions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forms
CREATE POLICY "Users can view their own forms"
    ON forms FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own forms"
    ON forms FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own forms"
    ON forms FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own forms"
    ON forms FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for form_fields
CREATE POLICY "Users can view fields of their own forms"
    ON form_fields FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM forms
            WHERE forms.id = form_fields.form_id
            AND forms.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create fields for their own forms"
    ON form_fields FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM forms
            WHERE forms.id = form_fields.form_id
            AND forms.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update fields of their own forms"
    ON form_fields FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM forms
            WHERE forms.id = form_fields.form_id
            AND forms.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete fields of their own forms"
    ON form_fields FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM forms
            WHERE forms.id = form_fields.form_id
            AND forms.user_id = auth.uid()
        )
    );

-- RLS Policies for form_submissions
-- Allow public read for published forms (for embedding)
CREATE POLICY "Anyone can submit to published forms"
    ON form_submissions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM forms
            WHERE forms.id = form_submissions.form_id
            AND forms.status = 'published'
        )
    );

-- Users can view submissions for their own forms
CREATE POLICY "Users can view submissions of their own forms"
    ON form_submissions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM forms
            WHERE forms.id = form_submissions.form_id
            AND forms.user_id = auth.uid()
        )
    );

-- Users can delete submissions of their own forms
CREATE POLICY "Users can delete submissions of their own forms"
    ON form_submissions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM forms
            WHERE forms.id = form_submissions.form_id
            AND forms.user_id = auth.uid()
        )
    );

