import { z } from 'zod'

export const GenerateRequestSchema = z.object({
  storyTitle: z.string().min(1, 'Story title is required'),
  acceptanceCriteria: z.string().min(1, 'Acceptance criteria is required'),
  description: z.string().optional(),
  additionalInfo: z.string().optional(),
  categories: z.array(z.enum([
    'Positive',
    'Negative',
    'Functional',
    'Non functional',
    'Edge',
    'Smoke',
  ])).min(1, 'At least one category is required'),
  numTestCases: z.number().min(1).max(20),
})

export const TestCaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  steps: z.array(z.string()),
  testData: z.string().optional(),
  expectedResult: z.string(),
  category: z.string()
})

export const GenerateResponseSchema = z.object({
  cases: z.array(TestCaseSchema),
  count: z.number(),
  model: z.string().optional(),
  promptTokens: z.number(),
  completionTokens: z.number(),
})

// Type exports
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>
export type TestCase = z.infer<typeof TestCaseSchema>
export type GenerateResponse = z.infer<typeof GenerateResponseSchema>