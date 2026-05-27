# Frontend Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
cd application/frontend
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 3. Make sure backend is running
```bash
# In another terminal
cd application/backend
python -m uvicorn main:app --reload
```

Backend should be running at `http://localhost:8000`

## Project Structure Overview

### `/src/pages/`
- **HomePage.jsx** - Main ticket submission form with gradient background
- **AnalysisResultsPage.jsx** - Displays initial analysis with validation step
- **TroubleshootingPage.jsx** - Shows troubleshooting steps in card layout
- **EmailResultsPage.jsx** - Email preview with edit/copy/download
- **QualityJudgePage.jsx** - Final quality scores and assessment

### `/src/components/`
Reusable UI components built with Material-UI:
- **LoadingButton** - Button with loading spinner
- **SnackbarAlert** - Toast notifications
- **ProgressTracker** - Stepper progress indicator
- **StepCard** - Individual step card with copy button
- **StatusBadge** - Approved/Rejected indicator
- **ScoreCard** - Score display with progress bar
- **LoadingOverlay** - Full-screen loading indicator
- **SkeletonLoader** - Placeholder loaders
- **EmailPreview** - Email editor and preview
- **FeedbackAccordion** - Expandable feedback sections

### `/src/utils/`
- **markdownCleaner.js** - Utilities for cleaning markdown and parsing content

## Key Features

### ✨ Modern UI/UX
- Material Design 3 aesthetic
- Glassmorphism effects
- Smooth animations with Framer Motion
- Responsive grid layouts
- Professional color scheme

### 🔄 Flow Control
- Strict button sequencing
- No concurrent API calls
- Loading states prevent duplicate submissions
- Clear visual feedback at each step

### 📱 Responsive Design
- Mobile-first approach
- Adapts to all screen sizes
- Touch-friendly buttons
- Flexible layouts

### ♿ Accessibility
- WCAG 2.1 AA compliant
- Keyboard navigation
- Semantic HTML
- High contrast colors
- ARIA labels

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Environment Configuration

The backend API URL is hardcoded as `http://localhost:8000` in the pages.

To change it:
1. Search for `http://localhost:8000` in the codebase
2. Replace with your backend URL
3. For deployment, use environment variables

Example:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
```

## Browser DevTools

### React Developer Tools
- Install React DevTools browser extension
- Inspect component hierarchy
- Check state and props
- Profile performance

### Material-UI DevTools
- Theme Inspector
- Style debugging
- Responsive preview

## Common Issues & Solutions

### Issue: Port 5173 already in use
```bash
npm run dev -- --port 3000
```

### Issue: Backend API not responding
1. Check if backend is running on port 8000
2. Verify CORS is enabled on backend
3. Check network tab in DevTools

### Issue: Styles not loading
1. Clear node_modules: `rm -rf node_modules && npm install`
2. Check CSS imports in App.jsx
3. Verify Vite config

### Issue: Animations not smooth
1. Check GPU acceleration in DevTools
2. Disable hardware acceleration test
3. Check Framer Motion performance

## Performance Tips

### Bundle Size
- Current: ~500KB gzipped
- Material-UI: ~200KB
- Framer Motion: ~50KB
- React: ~150KB

### Optimization Checklist
- [ ] Code splitting enabled
- [ ] Images optimized
- [ ] Unused imports removed
- [ ] Bundle size analyzed

## Testing

Run tests (when configured):
```bash
npm run test
```

Example test files should be in:
```
src/__tests__/
├── HomePage.test.jsx
├── components/
│   ├── LoadingButton.test.jsx
│   └── SnackbarAlert.test.jsx
```

## Deployment

### Build for Production
```bash
npm run build
```

Creates optimized production build in `dist/` folder.

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

## API Endpoints Used

The frontend makes requests to these backend endpoints:

```
POST /api/judge-relevance
  Body: { ticket: string }
  Response: { is_relevant: boolean, feedback: string }

POST /api/analyze
  Body: { ticket: string }
  Response: { category, urgency, sentiment, ... }

POST /api/judge-analysis
  Body: { ticket, analysis }
  Response: { is_correct, confidence, feedback }

POST /api/guidance
  Body: { ticket, analysis }
  Response: { guidance: string }

POST /api/email
  Body: { ticket, analysis, guidance }
  Response: { finalEmail: string }

POST /api/judge
  Body: { ticket, analysis, guidance, finalEmail }
  Response: { 
    is_approved, 
    quality_score, 
    correctness_score, 
    relevance_score, 
    overall_score, 
    feedback 
  }
```

## Git Workflow

### Working on a Feature
```bash
git checkout -b feature/your-feature-name
# Make changes
npm run lint  # Check formatting
npm run build # Test build
git add .
git commit -m "Add feature description"
git push origin feature/your-feature-name
```

### Commit Message Format
```
feat: Add new component
fix: Fix button loading state
docs: Update README
style: Format code
refactor: Simplify component logic
test: Add component tests
```

## Troubleshooting Checklist

- [ ] Node version >= 16
- [ ] npm version >= 8
- [ ] Dependencies installed (`npm install`)
- [ ] Backend running on port 8000
- [ ] No port conflicts
- [ ] Browser cache cleared
- [ ] DevTools network tab checked
- [ ] Console for error messages

## Support

For issues or questions:
1. Check the FRONTEND_REDESIGN.md for feature documentation
2. Review component usage in pages/
3. Check Material-UI docs: https://mui.com/
4. Check Framer Motion docs: https://www.framer.com/motion/

---

**Version:** 2.0
**Last Updated:** 2024
**Maintained By:** AI Support Team
