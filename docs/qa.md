# QA Checklist

## Setup & Configuration

- [ ] Supabase project created and configured
- [ ] `wines.sql` schema executed in Supabase
- [ ] Supabase URL and anon key updated in `src/lib/supabase.ts`
- [ ] OpenAI API key set in Supabase secrets
- [ ] `enrich-wine` edge function deployed
- [ ] Dependencies installed (`npm install`)

## Core Functionality

### Wine Management
- [ ] Add new wine with required fields (producer)
- [ ] Edit existing wine
- [ ] Delete wine
- [ ] Mark wine as drunk
- [ ] View wine details

### AI Enrichment
- [ ] Add minimal wine (producer only) triggers AI enrichment
- [ ] AI suggestions appear when confidence ≥ 0.75
- [ ] Apply suggestions works (drink window, scores)
- [ ] Dismiss suggestions works
- [ ] Apply never overwrites filled manual fields

### Search & Filtering
- [ ] Search by producer, wine name, appellation, region
- [ ] Filter by status (All/Cellared/Drunk)
- [ ] Filter by country code
- [ ] Filter by region
- [ ] Filter by bottle size
- [ ] Filter by vintage range (min/max)
- [ ] Clear all filters works

### Sorting
- [ ] Sort by creation date (newest/oldest)
- [ ] Sort by vintage (newest/oldest)
- [ ] Sort by average rating (highest/lowest)

## UI Components

### Wine Cards
- [ ] Country flag displays correctly
- [ ] US state badge shows for US wines
- [ ] Wine name formatting follows rules
- [ ] Average rating displays with star icon
- [ ] Location info shows (row, position)
- [ ] Status badge displays correctly
- [ ] "Mark Drunk" button works for cellared wines

### Forms
- [ ] Producer field is required
- [ ] Ratings clamp to 0-100 with 0.1 step
- [ ] Location position accepts only positive numbers
- [ ] Companions pill input works (Enter/Comma add, Backspace delete)
- [ ] Varietals pill input works
- [ ] Form validation shows appropriate errors

### Responsive Design
- [ ] Mobile layout works (1 column)
- [ ] Tablet layout works (2 columns)
- [ ] Desktop layout works (3-4 columns)
- [ ] All buttons meet 44px minimum tap target
- [ ] Text is readable on all screen sizes

## Data Integrity

### Wine Display Names
- [ ] Bordeaux + appellation: "Producer — Appellation — Vintage"
- [ ] With wine_name: "Producer — Wine Name — Vintage"
- [ ] With vineyard: "Producer — Vineyard — Vintage"
- [ ] Default: "Producer — Vintage"
- [ ] Handles missing vintage (shows "NV")

### Country & State
- [ ] Country flags display for all supported codes
- [ ] US state badges show for US wines
- [ ] Missing country code shows no flag
- [ ] Missing state code shows no badge

### Ratings
- [ ] Average rating calculates correctly (both ratings)
- [ ] Average rating shows single rating when only one present
- [ ] No average rating when both missing
- [ ] Star icons display correctly

## Performance

- [ ] Search debouncing works (300ms delay)
- [ ] Large wine collections load quickly
- [ ] AI enrichment doesn't block UI
- [ ] Optimistic updates work for mark drunk

## Error Handling

- [ ] Network errors show user-friendly messages
- [ ] Invalid form data shows validation errors
- [ ] Missing wine shows appropriate message
- [ ] AI enrichment failures don't break app

## Accessibility

- [ ] All interactive elements have focus rings
- [ ] Form labels are properly associated
- [ ] Screen reader friendly
- [ ] Keyboard navigation works
- [ ] Color contrast meets standards

## Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## Edge Cases

- [ ] Empty wine collection shows appropriate message
- [ ] No search results shows appropriate message
- [ ] Very long wine names wrap correctly
- [ ] Special characters in wine names display correctly
- [ ] Large numbers of companions/varietals display correctly

## Production Readiness

- [ ] Build completes without errors (`npm run build`)
- [ ] No console errors in production
- [ ] Environment variables properly configured
- [ ] Supabase RLS policies working
- [ ] Edge function deployed and accessible
- [ ] Performance acceptable on slow connections
