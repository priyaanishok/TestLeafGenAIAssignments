/**
 * Collection of default prompts for different use cases (ICE POT Format)
 */
export const DEFAULT_PROMPTS = {
 
  /**
   * Selenium Java Page Object Prompt (No Test Class)
   */
  SELENIUM_JAVA_PAGE_ONLY: `
    Instructions:
    - Generate ONLY a Selenium Java Page Object Class (no test code).
    - Add JavaDoc for methods & class.
    - Use Selenium 2.30+ compatible imports.
    - Use meaningful method names.
    - Do NOT include explanations or test code.

    Context:
    DOM:
    \`\`\`html
    \${domContent}
    \`\`\`

    Example:
    \`\`\`java
    package com.testleaf.pages;

    /**
     * Page Object for Component Page
     */
    public class ComponentPage {
        // Add methods as per the DOM
    }
    \`\`\`

    Persona:
    - Audience: Automation engineer focusing on maintainable POM structure.

    Output Format:
    - A single Java class inside a \`\`\`java\`\`\` block.

    Tone:
    - Clean, maintainable, enterprise-ready.
  `,
  /** PLAYWRIGHT FEATURE FILE PROMPT  */
  PLAYWRIGHT_FEATURE_FILE: `
Instructions:
- Generate ONLY a Playwright TypeScript Page Object Class (no test code).
- Use Playwright 1.30+ compatible imports.
- Add TypeDoc comments for class and methods.
- Use meaningful method and locator names.
- Use \`Locator\` and \`Page\` appropriately with \`@playwright/test\`.
- Do NOT include explanations or test code.

Context:
    DOM:
    \`\`\`html
    \${domContent}
    \`\`\`

    Example:
    import { Locator, Page } from '@playwright/test';

/**
 * Page Object for Component Page
 */
export class ComponentPage {
  private page: Page;
  
  constructor(page: Page) {
    this.page = page;
    // Define locators here
  }

  // Add methods as per the DOM
}
Persona:

Audience: Automation engineer focusing on maintainable POM structure using Playwright.

Output Format:

A single TypeScript class inside a ts block.

Tone:

Clean, maintainable, enterprise-ready.
  `,

  /**
   * Cucumber Feature File Only Prompt
   */
  CUCUMBER_ONLY: `
    Instructions:
    - Generate ONLY a Cucumber (.feature) file.
    - Use Scenario Outline with Examples table.
    - Make sure every step is relevant to the provided DOM.
    - Do not combine multiple actions into one step.
    - Use South India realistic dataset (names, addresses, pin codes, mobile numbers).
    - Use dropdown values only from provided DOM.
    - Generate multiple scenarios if applicable.

    Context:
    DOM:
    \`\`\`html
    \${domContent}
    \`\`\`

    Example:
    \`\`\`gherkin
    Feature: Login to OpenTaps

    Scenario Outline: Successful login with valid credentials
      Given I open the login page
      When I type "<username>" into the Username field
      And I type "<password>" into the Password field
      And I click the Login button
      Then I should be logged in successfully

    Examples:
      | username   | password  |
      | "testuser" | "testpass"|
      | "admin"    | "admin123"|
    \`\`\`

    Persona:
    - Audience: BDD testers who only need feature files.

    Output Format:
    - Only valid Gherkin in a \`\`\`gherkin\`\`\` block.

    Tone:
    - Clear, structured, executable.
  `,
  /** TEST DATA CREATION FOR THE GIVEN DOM */
  TEST_DATA_ONLY: `
    Instructions:
    - Generate ONLY test data in JSON format.
    - Create realistic South India-centric data (names, addresses, pin codes, mobile numbers).
    - Ensure data matches the fields in the provided DOM.
    - Include at least 5 unique records.
    - Use appropriate data types (e.g., strings for names, numbers for pin codes).
    - Generate postive, negative, and boundary test cases where applicable.

    Context:
    DOM:
    \`\`\`html
    \${domContent}
    \`\`\`

    Example:
    \`\`\`json
    [
      {
        "firstName": "Ravi",
        "lastName": "Kumar",
        "email": "  
      } 
  ]
      \`\`\`
  `,
  /** TEST DATA for the given Feature file for each scenario */
  TEST_DATA_FOR_FEATURE: `
    Instructions:
    - Generate ONLY test data in JSON format for the provided Cucumber feature file.
    - Create realistic South India-centric data (names, addresses, pin codes, mobile numbers).
    - Ensure data matches the fields and scenarios in the provided feature file.
    - Include at least 5 unique records per scenario.
    - Use appropriate data types (e.g., strings for names, numbers for pin codes).
    - Generate positive, negative, and boundary test cases where applicable.

    Context:
    Feature File:
    \`\`\`gherkin
    \${featureFileContent}
    \`\`\`

    Example:
    \`\`\`json
    [
      {
        "firstName": "Ravi",
        "lastName": "Kumar",
        "email": "  

      }
    ] 
    \`\`\`
    `,
/** TEST DATA for the given Page object model code - PLAYWRIGHT TYPESCRIPT */
   
  TEST_DATA_FOR_PLAYWRIGHT_PAGE: `
  Instructions:
  - Generate ONLY test data in JSON format for the provided Playwright TypeScript Page Object class.
  - Data must align with the fields, locators, and methods defined in the provided TypeScript code.
  - Create realistic South India-centric data (names, addresses, pin codes, mobile numbers).
  - Include at least 5 unique records.
  - Use appropriate data types (e.g., strings for names, numbers for pin codes).
  - Ensure test data includes positive, negative, and boundary value cases wherever applicable.
  - Avoid adding explanations or comments.

Context:  
    Page Object Class:  
      \`\`\`ts
        \${pageObjectContent}
      \`\`\`

Example:  
\`\`\`json
[
  {
    "firstName": "Ravi",
    "lastName": "Kumar",
    "email": "ravi.kumar@gmail.com",
    "phone": "9876543210",
    "pinCode": 600001,
    "address": "12/5 Ranganathan Street, T Nagar, Chennai"
  }
]
\`\`\`


    `,  
  
   /** TEST DATA for the given Page Object Model code - SELENIUM JAVA */

TEST_DATA_FOR_SELENIUM_PAGE: `
Instructions:
- Generate ONLY test data in JSON format for the provided Selenium Java Page Object class.
- Data must align with the fields, locators, and methods defined in the provided Java class.
- Create realistic South India-centric data (names, addresses, pin codes, mobile numbers).
- Include at least 5 unique records.
- Use appropriate data types (e.g., strings for names, numbers for pin codes).
- Ensure test data includes positive, negative, and boundary value cases wherever applicable.
- Avoid adding explanations or comments.

Context:  
    Page Object Class:  
      \`\`\`java
        \${pageObjectContent}
      \`\`\`

Example:  
\`\`\`json
[
  {
    "firstName": "Ravi",
    "lastName": "Kumar",
    "email": "ravi.kumar@gmail.com",
    "phone": "9876543210",
    "pinCode": 600001,
    "address": "12/5 Ranganathan Street, T Nagar, Chennai"
  }
]
\`\`\`
`,

 
    /**
   * Cucumber with Step Definitions
   */
  CUCUMBER_WITH_SELENIUM_JAVA_STEPS: `
    Instructions:
    - Generate BOTH:
      1. A Cucumber .feature file.
      2. A Java step definition class for selenium.
    - Do NOT include Page Object code.
    - Step defs must include WebDriver setup, explicit waits, and actual Selenium code.
    - Use Scenario Outline with Examples table (South India realistic data).

    Context:
    DOM:
    \`\`\`html
    \${domContent}
    \`\`\`
    URL: \${pageUrl}

    Example:
    \`\`\`gherkin
    Feature: Login to OpenTaps

    Scenario Outline: Successful login with valid credentials
      Given I open the login page
      When I type "<username>" into the Username field
      And I type "<password>" into the Password field
      And I click the Login button
      Then I should be logged in successfully

    Examples:
      | username   | password  |
\      | "admin"    | "admin123"|
    \`\`\`

    \`\`\`java
    package com.leaftaps.stepdefs;

    import io.cucumber.java.en.*;
    import org.openqa.selenium.*;
    import org.openqa.selenium.chrome.ChromeDriver;
    import org.openqa.selenium.support.ui.*;

    public class LoginStepDefinitions {
        private WebDriver driver;
        private WebDriverWait wait;

        @io.cucumber.java.Before
        public void setUp() {
            driver = new ChromeDriver();
            wait = new WebDriverWait(driver, Duration.ofSeconds(10));
            driver.manage().window().maximize();
        }

        @io.cucumber.java.After
        public void tearDown() {
            if (driver != null) driver.quit();
        }

        @Given("I open the login page")
        public void openLoginPage() {
            driver.get("\${pageUrl}");
        }

        @When("I type {string} into the Username field")
        public void enterUsername(String username) {
            WebElement el = wait.until(ExpectedConditions.elementToBeClickable(By.id("username")));
            el.sendKeys(username);
        }

        @When("I type {string} into the Password field")
        public void enterPassword(String password) {
            WebElement el = wait.until(ExpectedConditions.elementToBeClickable(By.id("password")));
            el.sendKeys(password);
        }

        @When("I click the Login button")
        public void clickLogin() {
            driver.findElement(By.xpath("//button[contains(text(),'Login')]")).click();
        }

        @Then("I should be logged in successfully")
        public void verifyLogin() {
            WebElement success = wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("success")));
            assert success.isDisplayed();
        }
    }
    \`\`\`

    Persona:
    - Audience: QA engineers working with Cucumber & Selenium.

    Output Format:
    - Gherkin in \`\`\`gherkin\`\`\` block + Java code in \`\`\`java\`\`\` block.

    Tone:
    - Professional, executable, structured.
  `
};

/**
 * Helper function to escape code blocks in prompts
 */
function escapeCodeBlocks(text) {
  return text.replace(/```/g, '\\`\\`\\`');
}

/**
 * Function to fill template variables in a prompt
 */
export function getPrompt(promptKey, variables = {}) {
  let prompt = DEFAULT_PROMPTS[promptKey];
  if (!prompt) {
    throw new Error(`Prompt not found: ${promptKey}`);
  }

  Object.entries(variables).forEach(([k, v]) => {
    const regex = new RegExp(`\\$\\{${k}\\}`, 'g');
    prompt = prompt.replace(regex, v);
  });

  return prompt.trim();
}

export const CODE_GENERATOR_TYPES = {
  SELENIUM_JAVA_PAGE_ONLY: 'Selenium-Java-Page-Only',
  TEST_DATA_FOR_SELENIUM_PAGE: 'Test-Data-For-Selenium-Page',
  TEST_DATA_FOR_PLAYWRIGHT_PAGE: 'Test-Data-For-Playwright-Page',
  TEST_DATA_FOR_FEATURE: 'Test-Data-For-Feature',
  TEST_DATA_ONLY: 'Test-Data-Only',
  CUCUMBER_ONLY: 'Cucumber-Only',
  CUCUMBER_WITH_SELENIUM_JAVA_STEPS: 'Cucumber-With-Selenium-Java-Steps',
  PLAYWRIGHT_FEATURE_FILE: 'Playwright-Feature-File'
};
