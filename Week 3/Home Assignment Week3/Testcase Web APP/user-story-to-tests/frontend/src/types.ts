
export type TestCategory =
  | "Positive"
  | "Negative"
  | "Functional"
  | "Non functional"
  | "Edge"
  | "Smoke";

export interface GenerateRequest {
  storyTitle: string;
  acceptanceCriteria: string;
  description?: string;
  additionalInfo?: string;
  categories: TestCategory[];
  numTestCases: number; // Number of testcases required
}

export interface TestCase {
  id: string
  title: string
  steps: string[]
  testData?: string
  expectedResult: string
  category: string
}

export interface GenerateResponse {
  cases: TestCase[];
  count: number;
  model?: string;
  promptTokens: number;
  completionTokens: number;
}