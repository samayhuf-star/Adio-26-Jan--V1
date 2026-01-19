-- ============================================
-- POPULATE FORM TEMPLATES
-- Insert 20 most popular form templates
-- ============================================

-- Lead Capture Form
INSERT INTO form_templates (
  template_id, name, description, category, subcategory,
  thumbnail_url, fields, use_count, is_featured, rating
) VALUES (
  'lead_capture_001',
  'Lead Capture Form',
  'Perfect for B2B companies to collect qualified leads with essential company info',
  'lead_generation',
  'Sales & Marketing',
  NULL,
  '[
    {"id": "field_1", "type": "text", "label": "Full Name", "required": true, "order": 1, "placeholder": "John Doe"},
    {"id": "field_2", "type": "email", "label": "Work Email", "required": true, "order": 2, "placeholder": "john@company.com"},
    {"id": "field_3", "type": "text", "label": "Company Name", "required": true, "order": 3, "placeholder": "Your Company"},
    {"id": "field_4", "type": "phone", "label": "Phone Number", "required": false, "order": 4, "placeholder": "+1 (555) 123-4567"},
    {"id": "field_5", "type": "select", "label": "Company Size", "options": ["1-10", "11-50", "51-200", "201-500", "500+"], "required": false, "order": 5}
  ]'::jsonb,
  15000,
  true,
  4.8
) ON CONFLICT (template_id) DO NOTHING;

-- Newsletter Signup
INSERT INTO form_templates (
  template_id, name, description, category, subcategory,
  thumbnail_url, fields, use_count, is_featured, rating
) VALUES (
  'newsletter_001',
  'Newsletter Signup',
  'Simple and effective form to grow your email list with subscribers',
  'lead_generation',
  'Email Marketing',
  NULL,
  '[
    {"id": "field_1", "type": "text", "label": "First Name", "required": false, "order": 1, "placeholder": "John"},
    {"id": "field_2", "type": "email", "label": "Email Address", "required": true, "order": 2, "placeholder": "john@example.com"},
    {"id": "field_3", "type": "checkbox", "label": "I agree to receive marketing emails", "required": true, "order": 3}
  ]'::jsonb,
  12000,
  true,
  4.9
) ON CONFLICT (template_id) DO NOTHING;

-- Contact Sales
INSERT INTO form_templates (
  template_id, name, description, category, subcategory,
  thumbnail_url, fields, use_count, is_featured, rating
) VALUES (
  'contact_sales_001',
  'Contact Sales Form',
  'High-intent sales inquiry form for B2B companies',
  'lead_generation',
  'Sales & Marketing',
  NULL,
  '[
    {"id": "field_1", "type": "text", "label": "Full Name", "required": true, "order": 1, "placeholder": "John Doe"},
    {"id": "field_2", "type": "email", "label": "Business Email", "required": true, "order": 2, "placeholder": "john@company.com"},
    {"id": "field_3", "type": "phone", "label": "Phone Number", "required": true, "order": 3, "placeholder": "+1 (555) 123-4567"},
    {"id": "field_4", "type": "text", "label": "Company", "required": true, "order": 4, "placeholder": "Your Company"},
    {"id": "field_5", "type": "select", "label": "Budget Range", "options": ["$0-10k", "$10-50k", "$50-100k", "$100k+"], "required": false, "order": 5},
    {"id": "field_6", "type": "textarea", "label": "Tell us about your needs", "required": false, "order": 6, "placeholder": "How can we help you?"}
  ]'::jsonb,
  8500,
  true,
  4.7
) ON CONFLICT (template_id) DO NOTHING;

-- Demo Request
INSERT INTO form_templates (
  template_id, name, description, category, subcategory,
  thumbnail_url, fields, use_count, is_featured, rating
) VALUES (
  'demo_001',
  'Demo Request Form',
  'Collect qualified demo requests with specific use case information',
  'lead_generation',
  'Product Demo',
  NULL,
  '[
    {"id": "field_1", "type": "text", "label": "Full Name", "required": true, "order": 1, "placeholder": "John Doe"},
    {"id": "field_2", "type": "email", "label": "Email", "required": true, "order": 2, "placeholder": "john@company.com"},
    {"id": "field_3", "type": "phone", "label": "Phone", "required": true, "order": 3, "placeholder": "+1 (555) 123-4567"},
    {"id": "field_4", "type": "text", "label": "Company", "required": true, "order": 4, "placeholder": "Your Company"},
    {"id": "field_5", "type": "textarea", "label": "What are your main challenges?", "required": false, "order": 5, "placeholder": "Tell us about your needs..."},
    {"id": "field_6", "type": "select", "label": "Preferred Demo Time", "options": ["9 AM - 12 PM", "12 PM - 3 PM", "3 PM - 6 PM"], "required": false, "order": 6}
  ]'::jsonb,
  7200,
  true,
  4.6
) ON CONFLICT (template_id) DO NOTHING;

-- Free Trial Signup
INSERT INTO form_templates (
  template_id, name, description, category, subcategory,
  thumbnail_url, fields, use_count, is_featured, rating
) VALUES (
  'free_trial_001',
  'Free Trial Signup',
  'Quick signup form for free trial conversion',
  'lead_generation',
  'Onboarding',
  NULL,
  '[
    {"id": "field_1", "type": "email", "label": "Email Address", "required": true, "order": 1, "placeholder": "john@company.com"},
    {"id": "field_2", "type": "text", "label": "Company Name", "required": true, "order": 2, "placeholder": "Your Company"},
    {"id": "field_3", "type": "select", "label": "How did you find us?", "options": ["Search Engine", "Social Media", "Referral", "Other"], "required": false, "order": 3}
  ]'::jsonb,
  11000,
  true,
  4.8
) ON CONFLICT (template_id) DO NOTHING;

-- Customer Feedback
INSERT INTO form_templates (
  template_id, name, description, category, subcategory,
  thumbnail_url, fields, use_count, is_featured, rating
) VALUES (
  'feedback_001',
  'Customer Feedback Form',
  'Collect valuable feedback to improve your product or service',
  'feedback',
  'Customer Satisfaction',
  NULL,
  '[
    {"id": "field_1", "type": "radio", "label": "How satisfied are you?", "options": ["Very Satisfied", "Satisfied", "Neutral", "Unsatisfied"], "required": true, "order": 1},
    {"id": "field_2", "type": "radio", "label": "Would you recommend us?", "options": ["Definitely", "Maybe", "Not Sure", "No"], "required": true, "order": 2},
    {"id": "field_3", "type": "textarea", "label": "What can we improve?", "required": false, "order": 3, "placeholder": "Your suggestions..."},
    {"id": "field_4", "type": "email", "label": "Email (optional)", "required": false, "order": 4, "placeholder": "your@email.com"}
  ]'::jsonb,
  9800,
  true,
  4.5
) ON CONFLICT (template_id) DO NOTHING;

-- NPS Survey
INSERT INTO form_templates (
  template_id, name, description, category, subcategory,
  thumbnail_url, fields, use_count, is_featured, rating
) VALUES (
  'nps_001',
  'NPS Survey',
  'Measure customer loyalty with Net Promoter Score survey',
  'feedback',
  'Surveys',
  NULL,
  '[
    {"id": "field_1", "type": "radio", "label": "How likely would you recommend us? (0-10)", "options": ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"], "required": true, "order": 1},
    {"id": "field_2", "type": "textarea", "label": "Please explain your rating", "required": false, "order": 2, "placeholder": "Your feedback..."},
    {"id": "field_3", "type": "email", "label": "Email (optional)", "required": false, "order": 3, "placeholder": "your@email.com"}
  ]'::jsonb,
  6500,
  false,
  4.4
) ON CONFLICT (template_id) DO NOTHING;

-- Post-Purchase Feedback
INSERT INTO form_templates (
  template_id, name, description, category, subcategory,
  thumbnail_url, fields, use_count, is_featured, rating
) VALUES (
  'post_purchase_001',
  'Post-Purchase Feedback',
  'Get feedback immediately after purchase to improve customer satisfaction',
  'feedback',
  'E-commerce',
  NULL,
  '[
    {"id": "field_1", "type": "radio", "label": "Product Quality", "options": ["Excellent", "Good", "Average", "Poor"], "required": true, "order": 1},
    {"id": "field_2", "type": "radio", "label": "Delivery Speed", "options": ["Very Fast", "Fast", "Normal", "Slow"], "required": true, "order": 2},
    {"id": "field_3", "type": "radio", "label": "Would you buy again?", "options": ["Definitely", "Maybe", "No"], "required": true, "order": 3},
    {"id": "field_4", "type": "textarea", "label": "Additional comments", "required": false, "order": 4, "placeholder": "Your comments..."}
  ]'::jsonb,
  5200,
  false,
  4.3
) ON CONFLICT (template_id) DO NOTHING;

-- Support Ticket
INSERT INTO form_templates (
  template_id, name, description, category, subcategory,
  thumbnail_url, fields, use_count, is_featured, rating
) VALUES (
  'support_ticket_001',
  'Support Ticket Form',
  'Organize and track customer support requests effectively',
  'feedback',
  'Support',
  NULL,
  '[
    {"id": "field_1", "type": "text", "label": "Your Name", "required": true, "order": 1, "placeholder": "John Doe"},
    {"id": "field_2", "type": "email", "label": "Email", "required": true, "order": 2, "placeholder": "john@example.com"},
    {"id": "field_3", "type": "text", "label": "Subject", "required": true, "order": 3, "placeholder": "Brief description of issue"},
    {"id": "field_4", "type": "select", "label": "Issue Category", "options": ["Bug", "Feature Request", "General Question", "Other"], "required": true, "order": 4},
    {"id": "field_5", "type": "textarea", "label": "Describe your issue", "required": true, "order": 5, "placeholder": "Please provide details..."},
    {"id": "field_6", "type": "select", "label": "Priority", "options": ["Low", "Medium", "High", "Urgent"], "required": false, "order": 6}
  ]'::jsonb,
  8100,
  false,
  4.6
) ON CONFLICT (template_id) DO NOTHING;

-- Feature Request
INSERT INTO form_templates (
  template_id, name, description, category, subcategory,
  thumbnail_url, fields, use_count, is_featured, rating
) VALUES (
  'feature_request_001',
  'Feature Request Form',
  'Gather feature ideas from your user community for product roadmap',
  'feedback',
  'Product',
  NULL,
  '[
    {"id": "field_1", "type": "text", "label": "Feature Name", "required": true, "order": 1, "placeholder": "Feature name"},
    {"id": "field_2", "type": "textarea", "label": "Feature Description", "required": true, "order": 2, "placeholder": "Describe the feature..."},
    {"id": "field_3", "type": "textarea", "label": "Use Case", "required": false, "order": 3, "placeholder": "How would you use this feature?"},
    {"id": "field_4", "type": "email", "label": "Email (for updates)", "required": false, "order": 4, "placeholder": "your@email.com"}
  ]'::jsonb,
  3200,
  false,
  4.2
) ON CONFLICT (template_id) DO NOTHING;

-- Event Registration
INSERT INTO form_templates (
  template_id, name, description, category, subcategory,
  thumbnail_url, fields, use_count, is_featured, rating
) VALUES (
  'event_registration_001',
  'Event Registration',
  'Manage event signups and collect attendee information',
  'events',
  'Conferences & Events',
  NULL,
  '[
    {"id": "field_1", "type": "text", "label": "Full Name", "required": true, "order": 1, "placeholder": "John Doe"},
    {"id": "field_2", "type": "email", "label": "Email", "required": true, "order": 2, "placeholder": "john@example.com"},
    {"id": "field_3", "type": "phone", "label": "Phone", "required": true, "order": 3, "placeholder": "+1 (555) 123-4567"},
    {"id": "field_4", "type": "text", "label": "Company", "required": true, "order": 4, "placeholder": "Your Company"},
    {"id": "field_5", "type": "number", "label": "Number of Tickets", "required": true, "order": 5, "placeholder": "1"},
    {"id": "field_6", "type": "textarea", "label": "Dietary Restrictions", "required": false, "order": 6, "placeholder": "Any dietary restrictions or special needs?"}
  ]'::jsonb,
  13000,
  true,
  4.9
) ON CONFLICT (template_id) DO NOTHING;

-- Webinar Signup
INSERT INTO form_templates (
  template_id, name, description, category, subcategory,
  thumbnail_url, fields, use_count, is_featured, rating
) VALUES (
  'webinar_001',
  'Webinar Signup',
  'Register attendees for online webinar events',
  'events',
  'Online Events',
  NULL,
  '[
    {"id": "field_1", "type": "text", "label": "First Name", "required": true, "order": 1, "placeholder": "John"},
    {"id": "field_2", "type": "text", "label": "Last Name", "required": true, "order": 2, "placeholder": "Doe"},
    {"id": "field_3", "type": "email", "label": "Email", "required": true, "order": 3, "placeholder": "john@example.com"},
    {"id": "field_4", "type": "phone", "label": "Phone", "required": false, "order": 4, "placeholder": "+1 (555) 123-4567"},
    {"id": "field_5", "type": "text", "label": "Company", "required": false, "order": 5, "placeholder": "Your Company"},
    {"id": "field_6", "type": "text", "label": "Job Title", "required": false, "order": 6, "placeholder": "Your Job Title"}
  ]'::jsonb,
  10500,
  true,
  4.7
) ON CONFLICT (template_id) DO NOTHING;

-- Workshop Registration
INSERT INTO form_templates (
  template_id, name, description, category, subcategory,
  thumbnail_url, fields, use_count, is_featured, rating
) VALUES (
  'workshop_001',
  'Workshop Registration',
  'Collect registrations for training workshops and courses',
  'events',
  'Training',
  NULL,
  '[
    {"id": "field_1", "type": "text", "label": "Full Name", "required": true, "order": 1, "placeholder": "John Doe"},
    {"id": "field_2", "type": "email", "label": "Email", "required": true, "order": 2, "placeholder": "john@example.com"},
    {"id": "field_3", "type": "select", "label": "Experience Level", "options": ["Beginner", "Intermediate", "Advanced"], "required": true, "order": 3},
    {"id": "field_4", "type": "number", "label": "Number of Attendees", "required": true, "order": 4, "placeholder": "1"},
    {"id": "field_5", "type": "textarea", "label": "Special Requirements", "required": false, "order": 5, "placeholder": "Any special requirements?"}
  ]'::jsonb,
  4800,
  false,
  4.5
) ON CONFLICT (template_id) DO NOTHING;

-- Contest/Giveaway
INSERT INTO form_templates (
  template_id, name, description, category, subcategory,
  thumbnail_url, fields, use_count, is_featured, rating
) VALUES (
  'contest_001',
  'Contest/Giveaway Entry',
  'Run viral contests and giveaways with entry forms',
  'events',
  'Marketing',
  NULL,
  '[
    {"id": "field_1", "type": "text", "label": "Full Name", "required": true, "order": 1, "placeholder": "John Doe"},
    {"id": "field_2", "type": "email", "label": "Email", "required": true, "order": 2, "placeholder": "john@example.com"},
    {"id": "field_3", "type": "phone", "label": "Phone", "required": false, "order": 3, "placeholder": "+1 (555) 123-4567"},
    {"id": "field_4", "type": "select", "label": "How did you hear about us?", "options": ["Social Media", "Search", "Friend", "Other"], "required": true, "order": 4},
    {"id": "field_5", "type": "checkbox", "label": "Share on social media for extra entry", "required": false, "order": 5}
  ]'::jsonb,
  7300,
  false,
  4.4
) ON CONFLICT (template_id) DO NOTHING;

-- Appointment Booking
INSERT INTO form_templates (
  template_id, name, description, category, subcategory,
  thumbnail_url, fields, use_count, is_featured, rating
) VALUES (
  'appointment_001',
  'Appointment Booking',
  'Schedule appointments for consultations, haircuts, medical, etc',
  'events',
  'Scheduling',
  NULL,
  '[
    {"id": "field_1", "type": "text", "label": "Your Name", "required": true, "order": 1, "placeholder": "John Doe"},
    {"id": "field_2", "type": "email", "label": "Email", "required": true, "order": 2, "placeholder": "john@example.com"},
    {"id": "field_3", "type": "phone", "label": "Phone", "required": true, "order": 3, "placeholder": "+1 (555) 123-4567"},
    {"id": "field_4", "type": "select", "label": "Service Type", "options": ["Consultation", "Haircut", "Massage", "Other"], "required": true, "order": 4},
    {"id": "field_5", "type": "text", "label": "Preferred Date", "required": true, "order": 5, "placeholder": "YYYY-MM-DD"},
    {"id": "field_6", "type": "text", "label": "Preferred Time", "required": true, "order": 6, "placeholder": "HH:MM"},
    {"id": "field_7", "type": "textarea", "label": "Notes", "required": false, "order": 7, "placeholder": "Any additional notes..."}
  ]'::jsonb,
  11200,
  true,
  4.8
) ON CONFLICT (template_id) DO NOTHING;

-- Employee Survey
INSERT INTO form_templates (
  template_id, name, description, category, subcategory,
  thumbnail_url, fields, use_count, is_featured, rating
) VALUES (
  'employee_survey_001',
  'Employee Survey',
  'Measure employee satisfaction and engagement',
  'surveys',
  'HR & Management',
  NULL,
  '[
    {"id": "field_1", "type": "radio", "label": "Overall job satisfaction", "options": ["Very Satisfied", "Satisfied", "Neutral", "Unsatisfied"], "required": true, "order": 1},
    {"id": "field_2", "type": "radio", "label": "Work environment", "options": ["Excellent", "Good", "Average", "Poor"], "required": true, "order": 2},
    {"id": "field_3", "type": "radio", "label": "Career growth opportunities", "options": ["Excellent", "Good", "Average", "Poor"], "required": true, "order": 3},
    {"id": "field_4", "type": "textarea", "label": "Suggestions for improvement", "required": false, "order": 4, "placeholder": "Your suggestions..."}
  ]'::jsonb,
  3900,
  false,
  4.3
) ON CONFLICT (template_id) DO NOTHING;

-- Product Survey
INSERT INTO form_templates (
  template_id, name, description, category, subcategory,
  thumbnail_url, fields, use_count, is_featured, rating
) VALUES (
  'product_survey_001',
  'Product Survey',
  'Get detailed product feedback and feature priorities from users',
  'surveys',
  'Product Development',
  NULL,
  '[
    {"id": "field_1", "type": "select", "label": "Primary use case", "options": ["Personal", "Business", "Both"], "required": true, "order": 1},
    {"id": "field_2", "type": "radio", "label": "Frequency of use", "options": ["Daily", "Weekly", "Monthly", "Rarely"], "required": true, "order": 2},
    {"id": "field_3", "type": "checkbox", "label": "Most valuable features", "required": true, "order": 3},
    {"id": "field_4", "type": "textarea", "label": "Missing features", "required": false, "order": 4, "placeholder": "What features would you like to see?"},
    {"id": "field_5", "type": "radio", "label": "Overall rating", "options": ["⭐⭐⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐", "⭐⭐", "⭐"], "required": true, "order": 5}
  ]'::jsonb,
  4600,
  false,
  4.4
) ON CONFLICT (template_id) DO NOTHING;

-- Market Research
INSERT INTO form_templates (
  template_id, name, description, category, subcategory,
  thumbnail_url, fields, use_count, is_featured, rating
) VALUES (
  'market_research_001',
  'Market Research Survey',
  'Collect consumer insights and market data from your target audience',
  'surveys',
  'Research',
  NULL,
  '[
    {"id": "field_1", "type": "select", "label": "Age Group", "options": ["18-25", "26-35", "36-45", "46-55", "56+"], "required": true, "order": 1},
    {"id": "field_2", "type": "select", "label": "Annual Income", "options": ["<$50k", "$50-100k", "$100-150k", "$150k+"], "required": false, "order": 2},
    {"id": "field_3", "type": "checkbox", "label": "Product Interest", "required": true, "order": 3},
    {"id": "field_4", "type": "select", "label": "Purchase Intention", "options": ["Very Likely", "Somewhat Likely", "Neutral", "Unlikely"], "required": true, "order": 4},
    {"id": "field_5", "type": "textarea", "label": "Additional comments", "required": false, "order": 5, "placeholder": "Your thoughts..."}
  ]'::jsonb,
  2800,
  false,
  4.1
) ON CONFLICT (template_id) DO NOTHING;

-- Job Application
INSERT INTO form_templates (
  template_id, name, description, category, subcategory,
  thumbnail_url, fields, use_count, is_featured, rating
) VALUES (
  'job_application_001',
  'Job Application',
  'Streamline hiring with structured job application forms',
  'surveys',
  'Recruiting',
  NULL,
  '[
    {"id": "field_1", "type": "text", "label": "Full Name", "required": true, "order": 1, "placeholder": "John Doe"},
    {"id": "field_2", "type": "email", "label": "Email", "required": true, "order": 2, "placeholder": "john@example.com"},
    {"id": "field_3", "type": "phone", "label": "Phone", "required": true, "order": 3, "placeholder": "+1 (555) 123-4567"},
    {"id": "field_4", "type": "text", "label": "Position Applied For", "required": true, "order": 4, "placeholder": "Job Title"},
    {"id": "field_5", "type": "number", "label": "Years of Experience", "required": true, "order": 5, "placeholder": "5"},
    {"id": "field_6", "type": "textarea", "label": "Tell us about yourself", "required": true, "order": 6, "placeholder": "Your background and experience..."},
    {"id": "field_7", "type": "text", "label": "Available to Start", "required": true, "order": 7, "placeholder": "YYYY-MM-DD"}
  ]'::jsonb,
  6200,
  false,
  4.5
) ON CONFLICT (template_id) DO NOTHING;

-- Complaint/Issue Report
INSERT INTO form_templates (
  template_id, name, description, category, subcategory,
  thumbnail_url, fields, use_count, is_featured, rating
) VALUES (
  'complaint_001',
  'Complaint/Issue Report',
  'Collect and track customer complaints and issues systematically',
  'surveys',
  'Support',
  NULL,
  '[
    {"id": "field_1", "type": "text", "label": "Your Name", "required": true, "order": 1, "placeholder": "John Doe"},
    {"id": "field_2", "type": "email", "label": "Email", "required": true, "order": 2, "placeholder": "john@example.com"},
    {"id": "field_3", "type": "select", "label": "Issue Type", "options": ["Product Quality", "Delivery", "Service", "Other"], "required": true, "order": 3},
    {"id": "field_4", "type": "select", "label": "Severity", "options": ["Critical", "High", "Medium", "Low"], "required": true, "order": 4},
    {"id": "field_5", "type": "textarea", "label": "Describe the issue", "required": true, "order": 5, "placeholder": "Please describe the issue in detail..."},
    {"id": "field_6", "type": "textarea", "label": "Suggested resolution", "required": false, "order": 6, "placeholder": "How do you think we can resolve this?"}
  ]'::jsonb,
  3500,
  false,
  4.2
) ON CONFLICT (template_id) DO NOTHING;

