import express from 'express'
import { GroqClient } from '../llm/groqClient'
import { GenerateRequestSchema, GenerateResponseSchema, GenerateResponse } from '../schemas'
import { SYSTEM_PROMPT, buildPrompt } from '../prompt'

export const generateRouter = express.Router()

generateRouter.post('/', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    // Validate request body
    const validationResult = GenerateRequestSchema.safeParse(req.body)
    
    if (!validationResult.success) {
      res.status(400).json({
        error: `Validation error: ${validationResult.error.message}`
      })
      return
    }

    const request = validationResult.data

    // Build prompts
    const userPrompt = buildPrompt(request)

    // Create GroqClient instance here to ensure env vars are loaded
    const groqClient = new GroqClient()

    // Generate tests using Groq
    try {

      const groqResponse = await groqClient.generateTests(SYSTEM_PROMPT, userPrompt)
      // Log the raw LLM output for debugging
      console.log('Raw LLM output:', groqResponse.content);

      // Extract JSON from LLM output (handles extra text)
      let jsonText = groqResponse.content;
      const firstBrace = jsonText.indexOf('{');
      const lastBrace = jsonText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonText = jsonText.substring(firstBrace, lastBrace + 1);
      }

      let parsedResponse: GenerateResponse;
      try {
        // Parse as any to allow alternate keys
        const raw = JSON.parse(jsonText) as any;
        // Accept either 'cases' or 'testCases' as the array key
        let casesArr = Array.isArray(raw.cases) ? raw.cases : (Array.isArray(raw.testCases) ? raw.testCases : undefined);
        if (!Array.isArray(casesArr)) {
          throw new Error("Missing or invalid 'cases' array in LLM output");
        }
        // Ensure each test case has all required fields
        casesArr = casesArr.map((tc: any, idx: number) => ({
          id: tc.id || `TC-${String(idx + 1).padStart(3, '0')}`,
          title: tc.title || '',
          steps: Array.isArray(tc.steps) ? tc.steps : [],
          testData: tc.testData || '',
          expectedResult: tc.expectedResult || '',
          category: tc.category || '',
        }));
        parsedResponse = {
          cases: casesArr,
          count: typeof raw.count === 'number' ? raw.count : casesArr.length,
          model: raw.model,
          promptTokens: typeof raw.promptTokens === 'number' ? raw.promptTokens : 0,
          completionTokens: typeof raw.completionTokens === 'number' ? raw.completionTokens : 0,
        };
      } catch (parseError) {
        res.status(502).json({
          error: 'LLM returned invalid JSON format',
          details: parseError instanceof Error ? parseError.message : parseError,
          raw: groqResponse.content
        });
        return;
      }

      // Validate the response schema
      const responseValidation = GenerateResponseSchema.safeParse(parsedResponse)
      if (!responseValidation.success) {
        res.status(502).json({
          error: 'LLM response does not match expected schema'
        })
        return
      }

      // Add token usage info if available and ensure count is present
      const cases = responseValidation.data.cases;
      const finalResponse = {
        ...responseValidation.data,
        count: typeof responseValidation.data.count === 'number' ? responseValidation.data.count : (Array.isArray(cases) ? cases.length : 0),
        model: groqResponse.model,
        promptTokens: groqResponse.promptTokens,
        completionTokens: groqResponse.completionTokens
      };

      res.json(finalResponse);
    } catch (llmError) {
      console.error('LLM error:', llmError)
      res.status(502).json({
        error: 'Failed to generate tests from LLM service'
      })
      return
    }
  } catch (error) {
    console.error('Error in generate route:', error)
    res.status(500).json({
      error: 'Internal server error'
    })
  }
})