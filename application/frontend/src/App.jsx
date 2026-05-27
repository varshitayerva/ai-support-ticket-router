import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import HomePage from './pages/HomePage';
import AnalysisResultsPage from './pages/AnalysisResultsPage';
import TroubleshootingPage from './pages/TroubleshootingPage';
import EmailResultsPage from './pages/EmailResultsPage';
import QualityJudgePage from './pages/QualityJudgePage';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#3B82F6',
      light: '#60A5FA',
      dark: '#1E40AF'
    },
    secondary: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669'
    },
    success: {
      main: '#10B981'
    },
    error: {
      main: '#EF4444'
    },
    warning: {
      main: '#F59E0B'
    },
    info: {
      main: '#3B82F6'
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF'
    },
    text: {
      primary: '#1F2937',
      secondary: '#6B7280'
    }
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem'
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem'
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.5rem'
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.1rem'
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: '8px',
          padding: '10px 20px',
          transition: 'all 0.3s ease'
        },
        contained: {
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 8px 12px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-2px)'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
          }
        }
      }
    }
  }
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/analysis-results" element={<AnalysisResultsPage />} />
        <Route path="/troubleshooting-results" element={<TroubleshootingPage />} />
        <Route path="/email-results" element={<EmailResultsPage />} />
        <Route path="/quality-results" element={<QualityJudgePage />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
