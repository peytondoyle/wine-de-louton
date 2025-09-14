📄 Product Requirements Document — "Wines de Louton" v0

1. Goals
	•	Simple: One-page app, no login, public URL for household use.
	•	Trackable: Full wine inventory with search, sort, filter.
	•	Delightful: Minimal, native-feeling UI (iOS 26 inspired), single accent color, SF Pro fonts, pill chips, no gradients.
	•	Extendable: Supabase schema structured enough to add features later (e.g., export, notifications).

⸻

2. Scope

In Scope (v0)
	•	Add, edit, delete wine records.
	•	Mark wine as Drunk (with drank date).
	•	Ratings from Peyton + Louis, with auto-averaging.
	•	Notes (separate fields for Peyton + Louis).
	•	Companions list (pills).
	•	Bottle logistics (purchase date/place, EuroCave row/slot, bottle size).
	•	Country flag + US state badge.
	•	Display naming rules (region-led vs vineyard/cuvée).
	•	AI enrichment (tasting notes, drink window, possible critic scores, sources, confidence).
	•	Manual critic scores (Wine Spectator, James Suckling).
	•	Filters & sorting.
	•	Responsive design for mobile + desktop.

Out of Scope (v0)
	•	User authentication / roles.
	•	Export/Import (other than optional CSV import).
	•	Notifications (email, SMS, push).
	•	Complex cellar layout visualization (grid mapping).
	•	Multi-household support.

⸻

3. User Stories
	1.	As Peyton or Louis, I want to add a new bottle with just “Producer” and “Vintage,” so I can quickly track a new wine even if I don’t know all details.
	•	Acceptance: Save works with just Producer; AI enrichment can still run.
	2.	As Peyton, I want to see a clean list of my wines with sort & filter controls, so I can easily find what I’m looking for.
	•	Acceptance: I can filter by status (Cellared/Drunk), country, region, size, vintage range.
	3.	As Louis, I want to mark a bottle as Drunk, so our inventory stays up to date.
	•	Acceptance: Status flips instantly, drank date auto-fills with today.
	4.	As Peyton, I want to rate a wine 0–100 and add tasting notes, so I remember how I felt about it.
	•	Acceptance: Peyton and Louis ratings stored separately, average rating auto-calculated.
	5.	As both, I want to list who we drank a wine with, displayed as pills, so we can remember the occasion.
	•	Acceptance: Pills editable inline, deduplicated, saved as array.
	6.	As Peyton, I want AI enrichment to suggest tasting notes and drinking window after adding, so I don’t have to look them up manually.
	•	Acceptance: Enrichment runs in background, suggestions displayed only if confidence ≥ 0.75.
	7.	As both, I want the app to look polished but uncluttered, so it feels like a real native app.
	•	Acceptance: Cards have flag, state badge, display name, ratings, Mark Drunk button.

⸻

4. Detailed Requirements & Acceptance Criteria

Add/Edit Flow
	•	✅ Required: Producer.
	•	✅ Optional: Vintage, Wine Name, Vineyard, Appellation, Region, Country, US State, Varietals, Bottle Size, Purchase Date, Purchase Place, Location Row, Slot.
	•	✅ Ratings: Peyton & Louis (0–100).
	•	✅ Companions: free-text pills.
	•	✅ Notes: separate fields.
	•	✅ Manual critic scores: integers (WS, JS).
	•	✅ On Save: record created immediately, enrichment runs async.

Acceptance: Form closes smoothly, record appears instantly in list, enrichment results appear later if available.

⸻

Inventory List
	•	✅ Shows all wines (default: status=Cellared).
	•	✅ Card fields: Flag, state badge, display name, vintage, bottle size, location, avg rating, status, “Mark Drunk” if eligible.
	•	✅ Sorting: by Added Date (default), Vintage (asc/desc), Avg Rating.
	•	✅ Filtering: by Status, Country, Region, Bottle Size, Vintage range.

Acceptance: Filters and sort update URL params; list refreshes consistently.

⸻

AI Enrichment
	•	✅ Trigger: after insert.
	•	✅ Edge function returns: tasting notes, drink window, possible critic scores, sources, confidence.
	•	✅ Stored in JSONB.
	•	✅ If confidence >= 0.75, show “AI Suggestions” panel in detail drawer.
	•	✅ Panel allows “Apply” (copies into manual fields if blank) or “Dismiss.”

Acceptance: AI suggestions never overwrite without user action. If AI fails, no crash.

⸻

Flags & Naming
	•	✅ Country → emoji flag.
	•	✅ If US → state badge (CA, OR, etc.).
	•	✅ Display name logic:
	•	Bordeaux/region-led → Producer + Appellation + Vintage.
	•	Else → Producer + Wine Name (or Vineyard) + Vintage.

Acceptance: Cards show consistent naming, correct flags, badges only for US.

⸻

Edge Cases
	•	Add with only Producer → allowed, AI still runs.
	•	No vintage → card shows “NV.”
	•	Change status Drunk → drank date auto-fills. Undo → clears drank date.
	•	Ratings one missing → average = other rating. Both missing → average null.
	•	Duplicate companions → dedupe.
	•	AI returns low confidence → do not display suggestions.
	•	AI parse error → suppress suggestions silently.

⸻

5. Data Model

See full SQL schema (already drafted). Key points:
	•	Enums: bottle_size, wine_status.
	•	JSONB field ai_enrichment.
	•	Auto-generated column average_rating.
	•	RLS: full public read/write on wines only.

⸻

6. UI/UX Principles
	•	Neutral palette with one accent color.
	•	SF Pro / Inter font stack.
	•	Responsive grid, cards on mobile → 1 col, desktop → 2–4 cols.
	•	Chips for pills, rounded buttons.
	•	Consistent spacing (8px base scale).
