/**
 * ============================================================================
 * AI SUPPORT TICKET ROUTER - FRONTEND TEST SUITE
 * ============================================================================
 * Component: HomePage
 * Total Test Cases: 15
 * Author: Testing Team
 * Date: 2026-05-25
 * ============================================================================
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import HomePage from '../HomePage';
import { BrowserRouter } from 'react-router-dom';

// Mock axios and react-router-dom
jest.mock('axios');
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('HomePage Component Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================================================
  // TEST SUITE 1: RENDERING & UI ELEMENTS (3 tests)
  // ========================================================================

  describe('TEST SUITE 1: Rendering & UI Elements', () => {

    test('1.1: Page renders with correct title', () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      const title = screen.getByText('AI Support Ticket Router');
      expect(title).toBeInTheDocument();
      console.log('✓ TEST 1.1 PASSED: Page renders with correct title');
    });

    test('1.2: Form contains textarea with placeholder', () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      const textarea = screen.getByPlaceholderText(/Describe your issue/i);
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe('TEXTAREA');
      console.log('✓ TEST 1.2 PASSED: Form contains textarea with placeholder');
    });

    test('1.3: Submit button is present', () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      const submitButton = screen.getByRole('button', { name: /Analyze Ticket/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton.type).toBe('submit');
      console.log('✓ TEST 1.3 PASSED: Submit button is present');
    });
  });

  // ========================================================================
  // TEST SUITE 2: BUTTON STATE MANAGEMENT (3 tests)
  // ========================================================================

  describe('TEST SUITE 2: Button State Management', () => {

    test('2.1: Submit button is disabled when textarea is empty', () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      const submitButton = screen.getByRole('button', { name: /Analyze Ticket/i });
      expect(submitButton).toBeDisabled();
      console.log('✓ TEST 2.1 PASSED: Submit button disabled when empty');
    });

    test('2.2: Submit button becomes enabled when text is entered', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      const textarea = screen.getByPlaceholderText(/Describe your issue/i);
      await user.type(textarea, 'My payment failed');

      const submitButton = screen.getByRole('button', { name: /Analyze Ticket/i });
      expect(submitButton).not.toBeDisabled();
      console.log('✓ TEST 2.2 PASSED: Submit button enabled when text entered');
    });

    test('2.3: Textarea becomes disabled while submitting', async () => {
      const user = userEvent.setup();
      axios.post.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      const textarea = screen.getByPlaceholderText(/Describe your issue/i);
      await user.type(textarea, 'Test ticket');

      const submitButton = screen.getByRole('button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(textarea).toBeDisabled();
      });
      console.log('✓ TEST 2.3 PASSED: Textarea disabled while submitting');
    });
  });

  // ========================================================================
  // TEST SUITE 3: FORM SUBMISSION (4 tests)
  // ========================================================================

  describe('TEST SUITE 3: Form Submission', () => {

    test('3.1: Form submits with valid ticket text', async () => {
      const user = userEvent.setup();
      axios.post.mockResolvedValueOnce({ data: { category: 'Technical Issue' } });

      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      const textarea = screen.getByPlaceholderText(/Describe your issue/i);
      await user.type(textarea, 'My app is crashing');

      const submitButton = screen.getByRole('button', { name: /Analyze Ticket/i });
      await user.click(submitButton);

      expect(axios.post).toHaveBeenCalled();
      console.log('✓ TEST 3.1 PASSED: Form submits with valid ticket');
    });

    test('3.2: API is called with correct endpoint', async () => {
      const user = userEvent.setup();
      axios.post.mockResolvedValueOnce({ data: { category: 'Technical Issue' } });

      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      const textarea = screen.getByPlaceholderText(/Describe your issue/i);
      await user.type(textarea, 'Test ticket');

      const submitButton = screen.getByRole('button', { name: /Analyze Ticket/i });
      await user.click(submitButton);

      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/analyze',
        { ticket: 'Test ticket' }
      );
      console.log('✓ TEST 3.2 PASSED: API called with correct endpoint');
    });

    test('3.3: Button shows loading state during submission', async () => {
      const user = userEvent.setup();
      axios.post.mockImplementation(() => new Promise(() => {}));

      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      const textarea = screen.getByPlaceholderText(/Describe your issue/i);
      await user.type(textarea, 'Test ticket');

      const submitButton = screen.getByRole('button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Analyzing/i })).toBeInTheDocument();
      });
      console.log('✓ TEST 3.3 PASSED: Button shows loading state');
    });

    test('3.4: Form can be submitted multiple times after success', async () => {
      const user = userEvent.setup();
      axios.post.mockResolvedValue({ data: { category: 'Technical Issue' } });

      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      const textarea = screen.getByPlaceholderText(/Describe your issue/i);
      const submitButton = screen.getByRole('button', { name: /Analyze Ticket/i });

      // First submission
      await user.type(textarea, 'First ticket');
      await user.click(submitButton);

      // Clear and second submission
      await user.clear(textarea);
      await user.type(textarea, 'Second ticket');
      await user.click(submitButton);

      expect(axios.post).toHaveBeenCalledTimes(2);
      console.log('✓ TEST 3.4 PASSED: Form can be submitted multiple times');
    });
  });

  // ========================================================================
  // TEST SUITE 4: ERROR HANDLING (3 tests)
  // ========================================================================

  describe('TEST SUITE 4: Error Handling', () => {

    test('4.1: Error message displays on API failure', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Network connection failed';
      axios.post.mockRejectedValueOnce({
        response: { data: { detail: errorMessage } }
      });

      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      const textarea = screen.getByPlaceholderText(/Describe your issue/i);
      await user.type(textarea, 'Test ticket');

      const submitButton = screen.getByRole('button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Error/i)).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
      console.log('✓ TEST 4.1 PASSED: Error message displays on API failure');
    });

    test('4.2: Generic error message when detail not provided', async () => {
      const user = userEvent.setup();
      axios.post.mockRejectedValueOnce(new Error('Unknown error'));

      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      const textarea = screen.getByPlaceholderText(/Describe your issue/i);
      await user.type(textarea, 'Test ticket');

      const submitButton = screen.getByRole('button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Error/i)).toBeInTheDocument();
        expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
      });
      console.log('✓ TEST 4.2 PASSED: Generic error message displayed');
    });

    test('4.3: Error can be dismissed by clearing and resubmitting', async () => {
      const user = userEvent.setup();
      axios.post
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce({ data: { category: 'Technical Issue' } });

      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      const textarea = screen.getByPlaceholderText(/Describe your issue/i);

      // First submission fails
      await user.type(textarea, 'Test 1');
      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText(/Error/i)).toBeInTheDocument();
      });

      // Second submission succeeds
      await user.clear(textarea);
      await user.type(textarea, 'Test 2');
      await user.click(screen.getByRole('button'));

      // Error message should disappear
      await waitFor(() => {
        expect(screen.queryByText(/Error/i)).not.toBeInTheDocument();
      });
      console.log('✓ TEST 4.3 PASSED: Error dismissed on successful retry');
    });
  });

  // ========================================================================
  // TEST SUITE 5: NAVIGATION & STATE (2 tests)
  // ========================================================================

  describe('TEST SUITE 5: Navigation & State', () => {

    test('5.1: Navigates to results page on successful submission', async () => {
      const user = userEvent.setup();
      const mockAnalysis = { category: 'Technical Issue', urgency: 'High' };
      axios.post.mockResolvedValueOnce({ data: mockAnalysis });

      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      const textarea = screen.getByPlaceholderText(/Describe your issue/i);
      await user.type(textarea, 'Test ticket');

      const submitButton = screen.getByRole('button', { name: /Analyze Ticket/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/results', {
          state: expect.objectContaining({
            analysis: mockAnalysis,
            ticket: 'Test ticket'
          })
        });
      });
      console.log('✓ TEST 5.1 PASSED: Navigates to results page on success');
    });

    test('5.2: Does not navigate on API error', async () => {
      const user = userEvent.setup();
      axios.post.mockRejectedValueOnce(new Error('API Error'));

      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      const textarea = screen.getByPlaceholderText(/Describe your issue/i);
      await user.type(textarea, 'Test ticket');

      const submitButton = screen.getByRole('button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled();
      });
      console.log('✓ TEST 5.2 PASSED: Does not navigate on error');
    });
  });
});
