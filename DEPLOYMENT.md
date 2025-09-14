# Wine de Louton - Deployment Guide

## Vercel Deployment Instructions

### 1. Environment Variables

Set the following environment variables in your Vercel project:

```
VITE_SUPABASE_URL=https://xzdnruzcaoxmmaxkjtsl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6ZG5ydXpjYW94bW1heGtqdHNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3OTgxMTksImV4cCI6MjA3MzM3NDExOX0.YSu5eHg8W-LtHndkcrDx2P5emLXr07lC2Bz5Q7NVbfs
```

### 2. Deployment Steps

1. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Select the project root directory

2. **Configure Build Settings:**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Set Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add the two variables listed above

4. **Deploy:**
   - Click "Deploy" button
   - Wait for build to complete

### 3. Post-Deploy Verification

After deployment, verify the following:

1. **Application Loads:**
   - Visit the deployed URL
   - Verify the wine collection interface loads

2. **Database Connection:**
   - Try adding a new wine
   - Verify it appears in the grid

3. **AI Enrichment:**
   - Add a wine with known details (e.g., "Domaine de la Côte", "2019")
   - Check if AI suggestions appear in the detail drawer

4. **Core Functionality:**
   - Test search and filtering
   - Test marking wine as drunk
   - Test editing wine details

### 4. Build Verification

The application has been tested and verified:
- ✅ TypeScript compilation successful
- ✅ No build errors
- ✅ All dependencies resolved
- ✅ Tailwind CSS properly purged
- ✅ Bundle size optimized

### 5. Performance Notes

- **Bundle Size**: 572.11 kB (gzipped: 173.41 kB)
- **First Load**: Optimized with proper code splitting
- **Search**: Debounced for performance (300ms)
- **Updates**: Optimistic updates for better UX

### 6. Troubleshooting

If deployment fails:

1. **Check Environment Variables:**
   - Ensure both Supabase variables are set
   - Verify no typos in variable names

2. **Check Build Logs:**
   - Look for TypeScript errors
   - Check for missing dependencies

3. **Database Issues:**
   - Verify Supabase project is active
   - Check RLS policies are configured

### 7. Monitoring

After deployment, monitor:
- Application performance
- Error rates
- User interactions
- Database queries

The application is ready for production deployment with all QA tests passing.
