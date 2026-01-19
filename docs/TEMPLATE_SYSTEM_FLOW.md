# Template System Feature Flow Documentation

## Data Model

### Tables

1. **templates** (Canonical templates)
   - `id` (UUID)
   - `slug` (TEXT, unique)
   - `title` (TEXT)
   - `html_template` (TEXT)
   - `assets` (JSONB array)
   - `placeholders` (JSONB array)
   - `category` (TEXT)
   - `thumbnail` (TEXT)

2. **saved_sites** (User's customized sites)
   - `id` (UUID)
   - `user_id` (UUID, FK to auth.users)
   - `template_id` (UUID, FK to templates)
   - `slug` (TEXT, unique per user)
   - `title` (TEXT)
   - `html` (TEXT)
   - `assets` (JSONB array)
   - `metadata` (JSONB: {theme, accent, etc})
   - `status` (TEXT: 'draft' | 'published')
   - `vercel` (JSONB: {projectId, deploymentId, url})
   - `created_at`, `updated_at`

3. **activity_log** (User actions)
   - `id` (UUID)
   - `user_id` (UUID, FK to auth.users)
   - `saved_site_id` (UUID, FK to saved_sites)
   - `action` (TEXT: 'edit' | 'download' | 'publish' | 'duplicate' | 'delete' | 'domain_connect')
   - `metadata` (JSONB)
   - `created_at`

## Feature Flows

### 1. View Template (No DB Change)

**When user clicks "View" on a template:**
- Render live preview from `templates.html_template`
- Use template placeholders to show preview
- No database changes

### 2. Edit Template

**When user clicks "Edit":**
1. Clone canonical template → create new `saved_sites` row
   - `status = 'draft'`
   - Copy `html_template` → `html`
   - Copy `assets` → `assets`
   - Generate unique `slug` for user
2. Open saved site in editor
   - Allow edits to HTML, images, SEO, colors
3. Record `ActivityLog(action='edit')`

### 3. Download Template

**When user clicks "Download":**
1. Create (if not already) a `SavedSite` clone (same as Edit step)
2. Package `SavedSite` into ZIP:
   - `index.html`
   - `assets/` folder
   - `policies/` folder (privacy.html, terms.html)
3. Return download link
4. Record `ActivityLog(action='download')`

### 4. Saved Sites Page

**Query:**
- `SELECT * FROM saved_sites WHERE user_id = ? ORDER BY updated_at DESC`
- Group by status and activity

**Display:**
- Preview thumbnail
- Last edited timestamp
- Actions: Edit, Duplicate, Download, Publish, Connect Domain, Remove

**Clicking item:**
- Opens editor (if edited/downloaded)
- Opens preview (if published)

### 5. Publish to Vercel

**Preconditions:**
- `SavedSite` must have valid `html` and `assets`

**Flow (Direct Upload - Option A):**

1. **Create or find Vercel Project**
   ```javascript
   POST /v11/projects
   {
     name: `site-${savedSite.slug}`,
     framework: null
   }
   ```

2. **Create Deployment**
   ```javascript
   POST /v13/deployments
   {
     name: projectId,
     files: {
       'index.html': { data: html, encoding: 'utf-8' },
       'assets/...': { data: ..., encoding: 'base64' }
     },
     meta: { savedSiteId, userId }
   }
   ```

3. **Poll Deployment Status**
   ```javascript
   GET /v13/deployments/{deploymentId}
   // Wait until readyState === 'READY'
   ```

4. **Update SavedSite**
   ```javascript
   UPDATE saved_sites SET
     status = 'published',
     vercel = {
       projectId: project.id,
       deploymentId: deployment.id,
       url: deployment.url
     }
   WHERE id = savedSiteId
   ```

5. **Record Activity**
   ```javascript
   INSERT INTO activity_log (action='publish', metadata={...})
   ```

**Security:**
- Use server-side Vercel token (never expose to client)
- Store tokens in environment variables / secrets manager
- Rate-limit deployments per user

### 6. Connect Domain

**When user clicks "Connect Domain":**

1. **Add Domain to Project**
   ```javascript
   POST /v11/projects/{projectId}/domains
   { name: 'example.com' }
   ```

2. **Get DNS Records**
   ```javascript
   GET /v11/projects/{projectId}/domains
   // Returns DNS configuration
   ```

3. **Show DNS Records to User**
   - Apex domain: A records (use IPs from Vercel API response)
   - WWW subdomain: CNAME to `cname.vercel-dns.com`
   - Display in copyable format

4. **Verify Domain**
   ```javascript
   POST /v11/projects/{projectId}/domains/{domain}/verify
   // Poll until verified
   ```

5. **Record Activity**
   ```javascript
   INSERT INTO activity_log (action='domain_connect', metadata={...})
   ```

**Edge Cases:**
- Domain already owned by another Vercel account → show error
- DNS not configured → show pending status
- Verification timeout → allow manual retry

## Implementation Files

### Frontend
- `src/components/WebsiteTemplates.tsx` - Main template browser
- `src/components/SavedSites.tsx` - Saved sites list page
- `src/components/SiteEditor.tsx` - HTML/content editor
- `src/components/DomainConnectDialog.tsx` - Domain connection UI

### Backend
- `backend/api/publish-site.js` - Vercel deployment endpoint
- `backend/api/domain-connect.js` - Domain management endpoint

### Utilities
- `src/utils/vercelApi.ts` - Vercel API client
- `src/utils/savedSites.ts` - Saved sites service
- `src/utils/siteDownload.ts` - ZIP creation/download

### Database
- `supabase/migrations/create_template_system.sql` - Schema migration

## Environment Variables

```bash
# Server-side only (never expose to client!)
VERCEL_TOKEN=your_vercel_token
VERCEL_TEAM_ID=optional_team_id
```

## API Endpoints

### Publish Site
```
POST /api/publish-site
Body: { savedSiteId: string }
Response: { url: string, deploymentId: string, projectId: string }
```

### Connect Domain
```
POST /api/domain-connect
Body: { savedSiteId: string, domain: string }
Response: { domain: string, dnsRecords: Array, verified: boolean }
```

### Check Domain Status
```
POST /api/domain-connect
Body: { savedSiteId: string, domain: string, action: 'check' }
Response: { verified: boolean, verification: {...} }
```

## Testing Checklist

- [ ] View template (preview without saving)
- [ ] Edit template (creates draft)
- [ ] Download template (creates ZIP)
- [ ] Saved sites list (grouped by status)
- [ ] Publish to Vercel (creates deployment)
- [ ] Connect domain (shows DNS records)
- [ ] Domain verification (polling)
- [ ] Activity logging (all actions)
- [ ] Duplicate site
- [ ] Delete site

