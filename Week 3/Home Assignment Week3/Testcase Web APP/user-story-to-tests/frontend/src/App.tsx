

import { useState } from 'react';

function Notification({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 1000,
      background: type === 'success' ? '#e6f4ea' : '#fdecea',
      color: type === 'success' ? '#388e3c' : '#d32f2f',
      border: `1px solid ${type === 'success' ? '#b7ebc6' : '#f5c6cb'}`,
      borderRadius: 8, padding: '16px 24px', minWidth: 220, boxShadow: '0 2px 8px rgba(60,72,100,0.10)'
    }}>
      <span>{message}</span>
      <button onClick={onClose} style={{ marginLeft: 16, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 600 }}>×</button>
    </div>
  );
}


import { fetchJiraIssueByIdOrKey } from './api';

import { generateTests } from './api';
import { GenerateRequest, GenerateResponse, TestCase, TestCategory } from './types';

const TEST_CATEGORIES: TestCategory[] = [
  "Positive",
  "Negative",
  "Functional",
  "Non functional",
  "Edge",
  "Smoke",
];


function App() {
  // State for download menu
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  // Notification state
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Utility to convert test cases to CSV
  function testCasesToCSV(testCases: any[], jiraId: string) {
    if (!testCases || !Array.isArray(testCases)) return '';
    const headers = ['Test Case ID', 'Title', 'Description', 'Category', 'Steps', 'Expected Result'];
    const rows = testCases.map(tc => {
      // Steps as a single cell, each step on a new line
      let stepsCell = '';
      if (tc.steps && Array.isArray(tc.steps)) {
        stepsCell = tc.steps.map((step: any, idx: number) => {
          // If step is a string, just use it; if object, use .action or .description
          if (typeof step === 'string') return `Step ${idx + 1}: ${step}`;
          if (step.action) return `Step ${idx + 1}: ${step.action}`;
          if (step.description) return `Step ${idx + 1}: ${step.description}`;
          return `Step ${idx + 1}: [Unknown Step]`;
        }).join('\n');
      }
      return [
        tc.id || '',
        tc.title || '',
        tc.description || '',
        tc.category || '',
        stepsCell,
        tc.expectedResult || tc.expected || '',
      ];
    });
    const csv = [headers, ...rows].map(row => row.map(field => '"' + String(field).replace(/"/g, '""') + '"').join(',')).join('\n');
    return csv;
  }

  // Export to Jira handler
  async function handleExportToJira() {
    if (!results || !results.cases || !jiraIssue?.key) {
      setNotification({ message: 'Jira issue and test cases required.', type: 'error' });
      return;
    }
    const jiraId = jiraIssue.key;
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `${jiraId}_Testcases_${dateStr}.csv`;
    const csv = testCasesToCSV(results.cases, jiraId);
    const formData = new FormData();
    formData.append('file', new Blob([csv], { type: 'text/csv' }), filename);
    try {
      const res = await fetch(`/api/jira-export/attach-csv/${jiraId}`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setNotification({ message: err.error || 'Failed to export to Jira.', type: 'error' });
        return;
      }
      setNotification({ message: 'Test cases exported to Jira successfully!', type: 'success' });
    } catch (e) {
      setNotification({ message: 'Network error exporting to Jira.', type: 'error' });
    }
  }

  // Download handler
  function handleDownload(type: 'csv' | 'json') {
    setShowDownloadMenu(false);
    if (!results || !results.cases) return;
    const jiraId = jiraIssue?.key || 'Testcases';
    const dateStr = new Date().toISOString().slice(0, 10);
    let filename = `${jiraId}_Testcases_${dateStr}`;
    if (type === 'csv') {
      const csv = testCasesToCSV(results.cases, jiraId);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (type === 'json') {
      const json = JSON.stringify(results.cases, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }
  // State for Jira Project input

  // State for Jira Issue fetch by ID/key or URL
  const [jiraIssueInput, setJiraIssueInput] = useState('');
  const [jiraIssue, setJiraIssue] = useState<any | null>(null);
  // Fetch a single Jira issue by ID or key
  // Helper to extract Jira ID/key from input (ID, key, or URL)
  function extractJiraIdOrKey(input: string): string {
    const trimmed = input.trim();
    // If input is a URL, extract the last segment
    try {
      const url = new URL(trimmed);
      const parts = url.pathname.split('/');
      return parts[parts.length - 1] || '';
    } catch {
      // Not a URL, return as is
      return trimmed;
    }
  }

  // When a Jira issue is fetched, auto-fill the form fields with its details
  const handleFetchJiraIssue = async () => {
    setJiraLoading(true);
    setJiraError(null);
    setJiraIssue(null);
    const idOrKey = extractJiraIdOrKey(jiraIssueInput);
    if (!idOrKey) {
      setJiraError('Please enter a Jira Issue ID, Key, or URL.');
      setJiraLoading(false);
      return;
    }
    try {
      const data = await fetchJiraIssueByIdOrKey(idOrKey);
      setJiraIssue(data);
      setJiraError(null);

      // --- Auto-fill logic starts here ---
      // Extract summary for the title
      const title = data.fields?.summary || '';

      // Extract description and acceptance criteria from Jira description field
      let descriptionText = '';
      let acceptanceCriteria = '';
      // Jira Cloud description is often Atlassian Document Format (ADF)
      // We'll try to extract plain text and split acceptance criteria if present
      const descField = data.fields?.description;
      if (descField && typeof descField === 'object' && Array.isArray(descField.content)) {
        // Flatten ADF content to plain text
        // Recursively flatten Atlassian Document Format (ADF) to plain text
        const flattenADF = (adf: any): string => {
          if (!adf) return '';
          if (typeof adf === 'string') return adf;
          if (Array.isArray(adf)) return adf.map(flattenADF).join(' ');
          if (typeof adf === 'object' && adf.type === 'text') return adf.text || '';
          if (typeof adf === 'object' && adf.content) return flattenADF(adf.content);
          return '';
        };
        const fullText = flattenADF(descField.content).replace(/\s+/g, ' ').trim();
        // Try to split acceptance criteria
        const acMatch = fullText.match(/Acceptance Criteria:?(.+)/i);
        if (acMatch) {
          // Everything before "Acceptance Criteria" is description
          descriptionText = fullText.split(/Acceptance Criteria:?/i)[0].trim();
          // Everything after is acceptance criteria
          acceptanceCriteria = acMatch[1].trim();
        } else {
          descriptionText = fullText;
        }
      } else if (typeof descField === 'string') {
        // If plain string, try to split
        const acMatch = descField.match(/Acceptance Criteria:?(.+)/i);
        if (acMatch) {
          descriptionText = descField.split(/Acceptance Criteria:?/i)[0].trim();
          acceptanceCriteria = acMatch[1].trim();
        } else {
          descriptionText = descField;
        }
      }

      // Update form fields with extracted values
      setFormData(prev => ({
        ...prev,
        storyTitle: title,
        description: descriptionText,
        acceptanceCriteria: acceptanceCriteria,
      }));
      // --- Auto-fill logic ends here ---
    } catch (err: any) {
      setJiraError(err.message || 'Network or fetch error.');
    } finally {
      setJiraLoading(false);
    }
  };
  const [formData, setFormData] = useState<GenerateRequest>({
    storyTitle: '',
    acceptanceCriteria: '',
    description: '',
    additionalInfo: '',
    categories: [],
    numTestCases: 1, // Add number of testcases required to form data
  });
  const [results, setResults] = useState<GenerateResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTestCases, setExpandedTestCases] = useState<Set<string>>(new Set());
  const [jiraLoading, setJiraLoading] = useState(false);
  const [jiraError, setJiraError] = useState<string | null>(null);

  // Handle number input change for number of testcases required
  const handleNumTestCasesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = Number(e.target.value);
    if (isNaN(value)) value = 1;
    value = Math.max(1, Math.min(20, value));
    setFormData(prev => ({ ...prev, numTestCases: value }));
  };

  const handleInputChange = (field: keyof GenerateRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (category: TestCategory) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const toggleTestCaseExpansion = (testCaseId: string) => {
    const newExpanded = new Set(expandedTestCases);
    if (newExpanded.has(testCaseId)) {
      newExpanded.delete(testCaseId);
    } else {
      newExpanded.add(testCaseId);
    }
    setExpandedTestCases(newExpanded);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.storyTitle.trim() || !formData.acceptanceCriteria.trim()) {
      setError('Story Title and Acceptance Criteria are required');
      return;
    }
    if (!formData.categories || formData.categories.length === 0) {
      setError('Please select at least one test category.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await generateTests(formData);
      setResults(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate tests');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Jira issue type details by ID
  // Fetch all issues in a project using JQL

  return (
    <div>
      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          background-color: #f5f5f5;
          color: #333;
          line-height: 1.6;
        }
        
        .container {
          max-width: 95%;
          width: 100%;
          margin: 0 auto;
          padding: 20px;
          min-height: 100vh;
        }
        
        @media (min-width: 768px) {
          .container {
            max-width: 90%;
            padding: 30px;
          }
        }
        
        @media (min-width: 1024px) {
          .container {
            max-width: 85%;
            padding: 40px;
          }
        }
        
        @media (min-width: 1440px) {
          .container {
            max-width: 1800px;
            padding: 50px;
          }
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .title {
          font-size: 2.5rem;
          color: #2c3e50;
          margin-bottom: 10px;
        }
        
        .subtitle {
          color: #666;
          font-size: 1.1rem;
        }
        
        .form-container {
          background: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-bottom: 30px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-label {
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
          color: #2c3e50;
        }
        
        .form-input, .form-textarea {
          width: 100%;
          padding: 12px;
          border: 2px solid #e1e8ed;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }
        
        .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: #3498db;
        }
        
        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }
        
        .submit-btn {
          background: #3498db;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .submit-btn:hover:not(:disabled) {
          background: #2980b9;
        }
        
        .submit-btn:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
        }
        
        .error-banner {
          background: #e74c3c;
          color: white;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
        }
        
        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
          font-size: 18px;
        }
        
        .results-container {
          background: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .results-header {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e1e8ed;
        }
        
        .results-title {
          font-size: 1.8rem;
          color: #2c3e50;
          margin-bottom: 10px;
        }
        
        .results-meta {
          color: #666;
          font-size: 14px;
        }
        
        .table-container {
          overflow-x: auto;
        }
        
        .results-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0 0.5rem;
          margin-top: 20px;
          font-size: 1.05rem;
        }

        .results-table th,
        .results-table td {
          padding: 14px 18px;
          text-align: left;
          border-bottom: 1.5px solid #e1e8ed;
          vertical-align: top;
        }

        .results-table th {
          background: #f8f9fa;
          font-weight: 700;
          color: #2c3e50;
          letter-spacing: 0.5px;
        }

        .results-table td:first-child, .results-table th:first-child {
          width: 140px;
          min-width: 120px;
          max-width: 180px;
          font-family: 'Fira Mono', 'Menlo', 'Consolas', monospace;
          font-size: 1.08rem;
          letter-spacing: 0.5px;
        }

        .results-table tr:hover {
          background: #f0f6ff;
      {/* The rest of your JSX (container, form, etc.) goes here, already wrapped in this parent <div> */}
        }
        
        .category-positive { color: #27ae60; font-weight: 600; }
        .category-negative { color: #e74c3c; font-weight: 600; }
        .category-edge { color: #f39c12; font-weight: 600; }
        .category-authorization { color: #9b59b6; font-weight: 600; }
        .category-non-functional { color: #34495e; font-weight: 600; }
        
        .test-case-id {
          cursor: pointer;
          color: #3498db;
          font-weight: 600;
          padding: 8px 12px;
          border-radius: 4px;
          transition: background-color 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        
        .test-case-id:hover {
          background: #f8f9fa;
        }
        
        .test-case-id.expanded {
          background: #e3f2fd;
          color: #1976d2;
        }
        
        .expand-icon {
          font-size: 10px;
          transition: transform 0.2s;
        }
        
        .expand-icon.expanded {
          transform: rotate(90deg);
        }
        
        .expanded-details {
          margin-top: 15px;
          background: #fafbfc;
          border: 1px solid #e1e8ed;
          border-radius: 8px;
          padding: 20px;
        }
        
        .step-item {
          background: white;
          border: 1px solid #e1e8ed;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .step-header {
          display: grid;
          grid-template-columns: 80px 1fr 1fr 1fr;
          gap: 15px;
          align-items: start;
        }
        
        .step-id {
          font-weight: 600;
          color: #2c3e50;
          background: #f8f9fa;
          padding: 4px 8px;
          border-radius: 4px;
          text-align: center;
          font-size: 12px;
        }
        
        .step-description {
          color: #2c3e50;
          line-height: 1.5;
        }
        
        .step-test-data {
          color: #666;
          font-style: italic;
          font-size: 14px;
        }
        
        .step-expected {
          color: #27ae60;
          font-weight: 500;
          font-size: 14px;
        }
        
        .step-labels {
          display: grid;
          grid-template-columns: 80px 1fr 1fr 1fr;
          gap: 15px;
          margin-bottom: 10px;
          font-weight: 600;
          color: #666;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      `}</style>
      
      <div className="container">
        {/* App Header */}
        <div className="header" style={{ marginBottom: 32 }}>
          <h1 className="title" style={{ fontWeight: 800, fontSize: '2.7rem', color: '#1a237e', letterSpacing: '1px' }}>User Story to Tests</h1>
          <p className="subtitle" style={{ color: '#607d8b', fontSize: '1.15rem', marginTop: 8 }}>Generate comprehensive test cases from your user stories or Jira tickets</p>
        </div>

        {/* Main Form Section */}
        <form onSubmit={handleSubmit} className="form-container" style={{ maxWidth: 700, margin: '0 auto', background: '#fff', borderRadius: 12, boxShadow: '0 4px 24px rgba(60,72,100,0.08)', padding: 36 }}>
          {/* Show Jira fetch error if any */}
          {jiraError && (
            <div className="error-banner" style={{ marginBottom: '1.2rem', fontWeight: 500 }}>{jiraError}</div>
          )}

          {/* Jira Issue Fetch Section */}
          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', gap: '1.2rem', marginBottom: '2rem' }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="jira-issue-input" className="form-label" style={{ fontWeight: 700, color: '#1a237e' }}>Jira Issue ID, Key, or URL</label>
              <input
                id="jira-issue-input"
                type="text"
                className="form-input"
                placeholder="e.g. SCRUM-1 or https://..."
                value={jiraIssueInput}
                onChange={e => setJiraIssueInput(e.target.value)}
                style={{ width: '100%', border: '2px solid #e3eafc', borderRadius: 8, fontSize: 16, padding: '12px 16px', background: '#f7f9fc' }}
              />
            </div>
            <button
              type="button"
              className="fetch-btn"
              style={{
                borderRadius: '2rem',
                background: '#1976d2',
                color: 'white',
                border: 'none',
                padding: '0.7rem 2.1rem',
                fontWeight: 700,
                fontSize: '1.08rem',
                letterSpacing: '0.5px',
                cursor: jiraIssueInput.trim() && !jiraLoading ? 'pointer' : 'not-allowed',
                opacity: jiraIssueInput.trim() && !jiraLoading ? 1 : 0.6,
                boxShadow: '0 2px 8px rgba(25,118,210,0.10)',
                transition: 'background 0.2s, box-shadow 0.2s',
              }}
              disabled={!jiraIssueInput.trim() || jiraLoading}
              onClick={handleFetchJiraIssue}
            >
              {jiraLoading ? 'Fetching...' : 'Fetch Issue'}
            </button>
          </div>
      {/* Show fetched Jira issue if any */}

      {/* Main layout: sidebar for Jira details if present, form always shown */}
      {/* Horizontal Jira details bar if Jira issue is fetched */}
      {jiraIssue && (
        <div
          style={{
            width: '100%',
            background: '#fff',
            borderRadius: 14,
            boxShadow: '0 4px 24px rgba(60,72,100,0.10)',
            padding: '18px 32px',
            margin: '0 auto 32px auto',
            border: '1.5px solid #e3eafc',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 32,
            flexWrap: 'wrap',
            maxWidth: 900,
          }}
        >
          {/* Atlassian logo */}
          <div style={{ display: 'flex', alignItems: 'center', minWidth: 60, justifyContent: 'center' }}>
            <img
              src="https://wac-cdn.atlassian.com/assets/img/favicons/atlassian/favicon.png"
              alt="Atlassian Logo"
              style={{ width: 32, height: 32, marginRight: 10 }}
            />
          </div>
          {/* Jira key as link */}
          <div style={{ minWidth: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <a
              href={`https://padhmapriyaa.atlassian.net/browse/${jiraIssue.key}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#1976d2',
                fontWeight: 800,
                textDecoration: 'underline',
                fontSize: 20,
                letterSpacing: '0.5px',
                display: 'inline-block',
                padding: '2px 0',
              }}
            >
              {jiraIssue.key}
            </a>
          </div>
          {/* Status only */}
          <div style={{ minWidth: 120, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginRight: 0, paddingRight: 0 }}>
            <span style={{ color: '#607d8b', fontWeight: 700, fontSize: 15 }}>Status:</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#388e3c' }}>{jiraIssue.fields?.status?.name}</span>
          </div>
        </div>
      )}
      {/* Main form always shown */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* The form and all other content remain unchanged here */}
        {/* ...existing form code... */}
      </div>
      {/* Show fetched Jira issues if any */}

          <div className="form-group">
            <label htmlFor="storyTitle" className="form-label">
              Story Title *
            </label>
            <input
              type="text"
              id="storyTitle"
              className="form-input"
              value={formData.storyTitle}
              onChange={(e) => handleInputChange('storyTitle', e.target.value)}
              placeholder="Enter the user story title..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              className="form-textarea"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Additional description (optional)..."
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="acceptanceCriteria" className="form-label">
              Acceptance Criteria *
            </label>
            <textarea
              id="acceptanceCriteria"
              className="form-textarea"
              value={formData.acceptanceCriteria}
              onChange={(e) => handleInputChange('acceptanceCriteria', e.target.value)}
              placeholder="Enter the acceptance criteria..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="additionalInfo" className="form-label">
              Additional Info
            </label>
            <textarea
              id="additionalInfo"
              className="form-textarea"
              value={formData.additionalInfo}
              onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
              placeholder="Any additional information (optional)..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Test Categories *</label>
            <div className="checkbox-group">
              {TEST_CATEGORIES.map((category) => (
                <label key={category} className="chic-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.categories.includes(category)}
                    onChange={() => handleCategoryChange(category)}
                  />
                  <span className="checkmark"></span>
                  {category}
                </label>
              ))}
            </div>
          </div>
          {/* Number of Testcases Required input - moved after categories */}
          <div className="form-group">
            <label htmlFor="num-testcases" className="form-label">
              Number of Testcases Required:
            </label>
            <input
              id="num-testcases"
              type="number"
              min={1}
              max={20}
              value={formData.numTestCases}
              onChange={handleNumTestCasesChange}
              className="form-input number-input"
              style={{ width: '100px', marginRight: '1rem' }}
            />
            <div className="helper-text" style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>
              Please enter a value between 1 and 20.
            </div>
          </div>
          
          <button
            type="submit"
            className="submit-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate'}
          </button>
        </form>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="loading">
            Generating test cases...
          </div>
        )}

        {results && (
          <div className="results-container">
            <div className="results-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 className="results-title">Generated Test Cases</h2>
                <div className="results-meta">{results.count} test cases generated</div>
              </div>
              {/* Download/Export icons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
                {/* Download icon */}
                <button
                  title="Download"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  onClick={() => setShowDownloadMenu(v => !v)}
                >
                  <svg width="22" height="22" fill="#1976d2" viewBox="0 0 24 24"><path d="M5 20h14v-2H5v2zm7-18C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h3l-4 4-4-4h3V7z"/></svg>
                </button>
                {/* Download menu */}
                {showDownloadMenu && (
                  <div style={{ position: 'absolute', top: 32, right: 0, background: '#fff', border: '1px solid #e3eafc', borderRadius: 8, boxShadow: '0 2px 8px rgba(60,72,100,0.10)', zIndex: 10, minWidth: 120 }}>
                    <button style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleDownload('csv')}>Download as CSV</button>
                    <button style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleDownload('json')}>Download as JSON</button>
                  </div>
                )}
                {/* Export to Jira icon (not implemented in preview) */}
                <button
                  title="Export to Jira (CSV attachment)"
                  style={{ background: 'none', border: 'none', cursor: jiraIssue?.key && results?.cases ? 'pointer' : 'not-allowed', padding: 0, opacity: jiraIssue?.key && results?.cases ? 1 : 0.5 }}
                  onClick={handleExportToJira}
                  disabled={!jiraIssue?.key || !results?.cases}
                >
                  {/* Export icon: paper plane */}
                  <svg width="22" height="22" fill="#388e3c" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
              </div>
            </div>
            <div className="table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Test Case ID</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Expected Result</th>
                  </tr>
                </thead>
                <tbody>
                  {results.cases.map((testCase: TestCase) => (
                    <>
                      <tr key={testCase.id}>
                        <td>
                          <div 
                            className={`test-case-id ${expandedTestCases.has(testCase.id) ? 'expanded' : ''}`}
                            onClick={() => toggleTestCaseExpansion(testCase.id)}
                          >
                            <span className={`expand-icon ${expandedTestCases.has(testCase.id) ? 'expanded' : ''}`}>
                              ▶
                            </span>
                            {testCase.id}
                          </div>
                        </td>
                        <td style={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }}>{testCase.title}</td>
                        <td>
                          <span className={`category-${testCase.category.toLowerCase().replace(/ /g, '-')}`}>{testCase.category}</span>
                        </td>
                        <td style={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }}>{testCase.expectedResult}</td>
                      </tr>
                      {expandedTestCases.has(testCase.id) && (
                        <tr key={`${testCase.id}-details`}>
                          <td colSpan={4}>
                            <div className="expanded-details">
                              <h4 style={{marginBottom: '15px', color: '#2c3e50'}}>Test Steps for {testCase.id}</h4>
                              <div className="step-labels">
                                <div>Step ID</div>
                                <div>Step Description</div>
                                <div>Test Data</div>
                                <div>Expected Result</div>
                              </div>
                              {testCase.steps.map((step, index) => (
                                <div key={index} className="step-item">
                                  <div className="step-header">
                                    <div className="step-id">S{String(index + 1).padStart(2, '0')}</div>
                                    <div className="step-description">{step}</div>
                                    <div className="step-test-data">{testCase.testData || 'N/A'}</div>
                                    <div className="step-expected">
                                      {index === testCase.steps.length - 1 ? testCase.expectedResult : 'Step completed successfully'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="test-case-count">
              Total Test Cases: <strong>{results.count}</strong>
            </div>
          </div>
        )}
      </div>

    {/* Notification */}
    {notification && (
      <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
    )}
  </div>
  )
}

export default App