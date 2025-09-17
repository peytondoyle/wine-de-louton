# Wine de Louton 🍷

A modern wine catalog application built with Vite + React + TypeScript + Tailwind CSS + Supabase, featuring AI-powered wine enrichment.

## Features

- **Wine Catalog Management**: Add, edit, and organize your wine collection
- **Cellar Visualization**: Visual grid interface for wine storage management
- **AI Enrichment**: Automatic wine information enrichment using OpenAI
- **Smart Filtering**: Search and filter wines by various criteria
- **Responsive Design**: iOS-inspired UI that works on all devices
- **Real-time Updates**: Live data synchronization with Supabase
- **Wine Tracking**: Track drinking status, ratings, and tasting notes
- **Occupancy Management**: Prevent double-booking with collision detection

## Quick Start

### Prerequisites

- Node.js 18+ 
- A Supabase account
- An OpenAI API key

### 1. Environment Setup

1. Update `.env` with your Supabase project values:
   ```bash
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### 2. Database Setup

1. Run the SQL schema from `wines.sql` in your Supabase SQL editor
2. Or use the Supabase CLI: `supabase db push` (after linking your project)

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
├── components/                    # React components
│   ├── ui/                       # Reusable UI primitives
│   ├── ControlsBar.tsx           # Search and filter controls
│   ├── CellarManagement.tsx      # Cellar visualization interface
│   ├── CellarVisualization.tsx   # Interactive cellar grid
│   ├── LocationChip.tsx          # Location display component
│   └── Navigation.tsx            # View switcher
├── features/                     # Feature-based organization
│   ├── cellar/                   # Cellar management
│   │   ├── components/           # Cellar-specific components
│   │   └── data/                 # Cellar data operations
│   ├── wines/                    # Wine collection
│   │   ├── components/           # Wine-specific components
│   │   └── data/                 # Wine data operations
│   └── enrichment/               # AI enrichment
│       ├── components/           # Enrichment UI
│       └── data/                 # Enrichment logic
├── hooks/                        # Custom React hooks
│   ├── useCellar.ts              # Cellar state management
│   └── useWineActions.ts         # Wine operations
├── lib/                          # Utilities
│   ├── supabase.ts               # Supabase client
│   ├── format.ts                 # Display formatting
│   └── utils.ts                  # General utilities
└── types.ts                      # TypeScript definitions
```

## Database Schema

### Wine Collection
The `wines` table includes:
- Basic wine information (producer, vintage, region, etc.)
- Logistics (bottle size, location, purchase info)
- Ratings and notes (Peyton & Louis ratings)
- Critic scores (Wine Spectator, James Suckling)
- AI enrichment data (JSONB with confidence score)

### Cellar Management
The cellar system includes:
- **`fridge_layout`**: Configurable fridge dimensions (shelves × columns)
- **`cellar_slots`**: Wine assignments with shelf/column/depth positioning
- **`depth_position`**: Front/Back positioning enum
- **Collision detection**: Prevents double-booking of slots
- **Occupancy queries**: Real-time availability tracking

## AI Enrichment

The app automatically enriches new wines with:
- Tasting notes
- Drink window recommendations
- Critic score suggestions
- Source information
- Confidence scoring

AI suggestions only appear when confidence ≥ 0.75 and can be applied or dismissed.

## Deployment

### ✅ Production Deployment

**Live App**: https://wine-de-louton-qyk4pjyjk-peyton-doyle.vercel.app

The app is successfully deployed to Vercel with:
- ✅ Environment variables configured
- ✅ Production build optimized
- ✅ Authentication protection enabled
- ✅ All features working

### Vercel Configuration

**Environment Variables Set:**
- `VITE_SUPABASE_URL`: Configured
- `VITE_SUPABASE_ANON_KEY`: Configured

**Build Settings:**
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Node.js Version: 18.x

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