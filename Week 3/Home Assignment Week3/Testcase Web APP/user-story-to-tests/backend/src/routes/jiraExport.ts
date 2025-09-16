import express, { Request, Response } from 'express';
import fetch from 'node-fetch';
import multer, { Multer } from 'multer';
import dotenv from 'dotenv';
import FormData from 'form-data';
dotenv.config();

const router = express.Router();
const upload: Multer = multer();

const JIRA_BASE = 'https://padhmapriyaa.atlassian.net/rest/api/3/issue/';
const JIRA_EMAIL = process.env.VITE_JIRA_EMAIL || process.env.JIRA_EMAIL;
const JIRA_API_KEY = process.env.VITE_JIRA_API_KEY || process.env.JIRA_API_KEY;

// Attach CSV to Jira issue
router.post('/attach-csv/:idOrKey', upload.single('file'), async (req: Request, res: Response) => {
  const idOrKey = req.params.idOrKey;
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!idOrKey || !file) {
    return res.status(400).json({ error: 'Missing Jira issue ID/key or file.' });
  }
  try {
    const form = new FormData();
    form.append('file', file.buffer, {
      filename: file.originalname,
      contentType: 'text/csv',
    });
    const jiraRes = await fetch(`${JIRA_BASE}${idOrKey}/attachments`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${JIRA_EMAIL}:${JIRA_API_KEY}`).toString('base64'),
        'X-Atlassian-Token': 'no-check',
        ...form.getHeaders(),
      },
      body: form,
    });
    if (!jiraRes.ok) {
      const errorText = await jiraRes.text();
      return res.status(jiraRes.status).json({ error: `Jira attachment failed (${jiraRes.status})`, details: errorText });
    }
    const data = await jiraRes.json();
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: 'Network or fetch error.' });
  }
});

export default router;
