# Quick Start Guide - Template Generation

## Step 1: Install Dependencies

```bash
npm install
```

This installs:
- `handlebars` - Templating engine
- `fs-extra` - File system utilities

## Step 2: Create a Manifest

Create a JSON file in `templates/manifests/` for your vertical:

```bash
# Example: templates/manifests/plumbing.json
```

Use `templates/manifests/lawn-care.json` as a reference.

## Step 3: Generate Templates

```bash
npm run generate:templates
```

Output will be in `dist/<slug>/index.html`

## Step 4: Preview

```bash
npm run preview:templates
```

Opens a local server at `http://localhost:3000`

## Creating Multiple Templates

1. Create multiple JSON files in `templates/manifests/`
2. Run `npm run generate:templates`
3. All templates will be generated in `dist/`

## Customizing Themes

Edit `templates/themes.json` to add/modify color palettes.

## Template Structure

Each generated template includes:
- Main landing page (`index.html`)
- Privacy Policy (`policies/privacy.html`)
- Terms of Service (`policies/terms.html`)

## Deployment

Upload the `dist/` folder to your static host:
- Netlify: Drag & drop `dist/` folder
- Vercel: Deploy `dist/` directory
- S3: Upload `dist/` contents to bucket

## Troubleshooting

**Error: "No manifest files found"**
- Ensure JSON files are in `templates/manifests/`
- Check file extensions are `.json`

**Templates not generating**
- Check JSON syntax is valid
- Ensure all required fields are present
- See manifest structure in `templates/manifests/README.md`

**Theme not applying**
- Verify `themeId` matches a theme in `themes.json`
- Default theme is `green-edge` if not specified

