import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

const JIRA_BASE = 'https://padhmapriyaa.atlassian.net/rest/api/3/issue/';
const JIRA_EMAIL = process.env.VITE_JIRA_EMAIL || process.env.JIRA_EMAIL;
const JIRA_API_KEY = process.env.VITE_JIRA_API_KEY || process.env.JIRA_API_KEY;

// Helper to extract Jira ID/key from input (ID, key, or URL)
function extractJiraIdOrKey(input: string): string {
  const trimmed = input.trim();
  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split('/');
    return parts[parts.length - 1] || '';
  } catch {
    return trimmed;
  }
}

router.get('/issue/:idOrKey', async (req, res) => {
  const idOrKey = extractJiraIdOrKey(req.params.idOrKey);
  if (!idOrKey) {
    return res.status(400).json({ error: 'Missing Jira issue ID, key, or URL.' });
  }
  try {
    // Debug logging for credentials and endpoint
    console.log('Jira fetch:', { endpoint: `${JIRA_BASE}${idOrKey}`, email: JIRA_EMAIL ? 'set' : 'unset', apiKey: JIRA_API_KEY ? 'set' : 'unset', idOrKey });
    const jiraRes = await fetch(`${JIRA_BASE}${idOrKey}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${JIRA_EMAIL}:${JIRA_API_KEY}`).toString('base64'),
        'Accept': 'application/json',
      },
    });
    if (!jiraRes.ok) {
      const errorText = await jiraRes.text();
      console.error('Jira API error:', jiraRes.status, errorText);
      return res.status(jiraRes.status).json({ error: `Jira fetch failed (${jiraRes.status})`, details: errorText });
    }
    const data = await jiraRes.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Network or fetch error.' });
  }
});

export default router;
