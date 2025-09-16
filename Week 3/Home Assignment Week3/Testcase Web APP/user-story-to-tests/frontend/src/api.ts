
export async function fetchJiraIssueByIdOrKey(issueIdOrKey: string) {
  const url = `${API_BASE_URL}/jira/issue/${encodeURIComponent(issueIdOrKey.trim())}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    let msg = errorData.error || `Jira fetch failed (${res.status})`;
    throw new Error(msg);
  }
  return res.json();
}
import { GenerateRequest, GenerateResponse } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api'

export async function generateTests(request: GenerateRequest): Promise<GenerateResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data: GenerateResponse = await response.json();
    // Ensure count is present for compatibility
    if (typeof data.count !== 'number' && Array.isArray(data.cases)) {
      data.count = data.cases.length;
    }
    return data;
  } catch (error) {
    console.error('Error generating tests:', error);
    throw error instanceof Error ? error : new Error('Unknown error occurred');
  }
}