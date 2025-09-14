# Wine de Louton 🍷

A modern wine catalog application built with Vite + React + TypeScript + Tailwind CSS + Supabase, featuring AI-powered wine enrichment.

## Features

- **Wine Catalog Management**: Add, edit, and organize your wine collection
- **AI Enrichment**: Automatic wine information enrichment using OpenAI
- **Smart Filtering**: Search and filter wines by various criteria
- **Responsive Design**: iOS-inspired UI that works on all devices
- **Real-time Updates**: Live data synchronization with Supabase
- **Wine Tracking**: Track drinking status, ratings, and tasting notes

## Quick Start

### Prerequisites

- Node.js 18+ 
- A Supabase account
- An OpenAI API key

### 1. Database Setup

1. Create a new Supabase project
2. Run the SQL schema from `wines.sql` in your Supabase SQL editor
3. Note your project URL and anon key

### 2. Environment Configuration

1. Copy your Supabase URL and anon key
2. Update `src/lib/supabase.ts`:
   ```typescript
   const SUPABASE_URL = 'your-supabase-url'
   const SUPABASE_ANON_KEY = 'your-supabase-anon-key'
   ```

### 3. Deploy Edge Function

1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link your project: `supabase link --project-ref your-project-ref`
4. Deploy the function: `supabase functions deploy enrich-wine`
5. Set the OpenAI API key: `supabase secrets set OPENAI_API_KEY=your-openai-api-key`

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see your wine catalog!

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI primitives
│   ├── ControlsBar.tsx # Search and filter controls
│   ├── WineCard.tsx    # Individual wine card
│   ├── WineGrid.tsx    # Wine grid layout
│   ├── WineSheet.tsx   # Add/edit wine form
│   └── WineDetailDrawer.tsx # Wine detail view
├── data/               # Data layer
│   ├── wines.ts        # Wine CRUD operations
│   └── enrich.ts       # AI enrichment client
├── lib/                # Utilities
│   ├── supabase.ts     # Supabase client
│   ├── format.ts       # Display formatting
│   └── utils.ts        # General utilities
└── types.ts            # TypeScript definitions
```

## Database Schema

The `wines` table includes:
- Basic wine information (producer, vintage, region, etc.)
- Logistics (bottle size, location, purchase info)
- Ratings and notes (Peyton & Louis ratings)
- Critic scores (Wine Spectator, James Suckling)
- AI enrichment data (JSONB with confidence score)

## AI Enrichment

The app automatically enriches new wines with:
- Tasting notes
- Drink window recommendations
- Critic score suggestions
- Source information
- Confidence scoring

AI suggestions only appear when confidence ≥ 0.75 and can be applied or dismissed.

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Other Platforms

The app is a standard Vite React app and can be deployed to any static hosting service.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- TypeScript for type safety
- Tailwind CSS for styling
- React Hook Form for form management
- Radix UI for accessible components

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details