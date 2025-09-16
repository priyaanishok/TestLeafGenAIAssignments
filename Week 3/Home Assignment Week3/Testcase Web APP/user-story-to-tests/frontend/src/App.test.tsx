import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Mock fetch globally
beforeAll(() => {
  global.fetch = jest.fn();
});
afterAll(() => {
  jest.resetAllMocks();
});

describe('Jira Issue Fetch by ID', () => {
  it('fetches and displays Jira issue SCRUM-1', async () => {
    // Mock response for SCRUM-1
    const mockIssue = {
      key: 'SCRUM-1',
      fields: {
        summary: 'Test summary',
        issuetype: { name: 'Story' },
        status: { name: 'To Do' },
      },
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ issues: [mockIssue] }),
    });

    render(<App />);
    // Enter project key and fetch
    const input = screen.getByPlaceholderText(/project key/i);
    fireEvent.change(input, { target: { value: 'SCRUM' } });
    const button = screen.getByRole('button', { name: /fetch issues/i });
    fireEvent.click(button);

    // Wait for the issue to appear
    await waitFor(() => {
      expect(screen.getByText('SCRUM-1')).toBeInTheDocument();
      expect(screen.getByText('Test summary')).toBeInTheDocument();
      expect(screen.getByText('Story')).toBeInTheDocument();
      expect(screen.getByText('To Do')).toBeInTheDocument();
    });
  });

  it('shows error on fetch failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
    });
    render(<App />);
    const input = screen.getByPlaceholderText(/project key/i);
    fireEvent.change(input, { target: { value: 'SCRUM' } });
    const button = screen.getByRole('button', { name: /fetch issues/i });
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText(/authentication failed/i)).toBeInTheDocument();
    });
  });
});
