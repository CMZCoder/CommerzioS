/**
 * E2E Bug Report Service
 * 
 * Manages automated test failure reports that appear in the admin panel.
 * Provides LLM-friendly prompts for quick bug fixing.
 */

import { db } from "./db";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { e2eBugReports } from "@shared/schema";

export interface BugReportInput {
  testFile: string;
  testName: string;
  testSuite?: string;
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  screenshotUrl?: string;
  pageUrl?: string;
  userAgent?: string;
  testUserId?: string;
  testUserRole?: string;
  stepsToReproduce?: string[];
  apiEndpoint?: string;
  apiResponse?: any;
  requestPayload?: any;
  browserName?: string;
  browserVersion?: string;
  runId?: string;
  retryCount?: number;
}

/**
 * Generate an LLM-friendly prompt from bug report data
 */
function generateLLMPrompt(report: BugReportInput): string {
  const prompt = `
## E2E Test Failure Bug Report

### Test Information
- **File**: \`${report.testFile}\`
- **Test Name**: ${report.testName}
${report.testSuite ? `- **Suite**: ${report.testSuite}` : ''}
${report.testUserRole ? `- **User Role**: ${report.testUserRole}` : ''}

### Error Details
- **Error Type**: ${report.errorType}
- **Error Message**: 
\`\`\`
${report.errorMessage}
\`\`\`

${report.stackTrace ? `### Stack Trace
\`\`\`
${report.stackTrace}
\`\`\`` : ''}

${report.pageUrl ? `### Page Context
- **URL**: ${report.pageUrl}` : ''}

${report.apiEndpoint ? `### API Context
- **Endpoint**: ${report.apiEndpoint}
${report.requestPayload ? `- **Request**: \`\`\`json
${JSON.stringify(report.requestPayload, null, 2)}
\`\`\`` : ''}
${report.apiResponse ? `- **Response**: \`\`\`json
${JSON.stringify(report.apiResponse, null, 2)}
\`\`\`` : ''}` : ''}

${report.stepsToReproduce && report.stepsToReproduce.length > 0 ? `### Steps to Reproduce
${report.stepsToReproduce.map((step, i) => `${i + 1}. ${step}`).join('\n')}` : ''}

### Environment
- **Browser**: ${report.browserName || 'Chromium'} ${report.browserVersion || ''}
- **Run ID**: ${report.runId || 'N/A'}

---

**Task**: Please analyze this E2E test failure and provide:
1. Root cause analysis
2. Code fix with exact file paths and line changes
3. Any additional tests that should be added to prevent regression
`.trim();

  return prompt;
}

/**
 * Create a new bug report
 */
export async function createBugReport(input: BugReportInput): Promise<string> {
  const llmPrompt = generateLLMPrompt(input);
  
  const [result] = await db.insert(e2eBugReports).values({
    testFile: input.testFile,
    testName: input.testName,
    testSuite: input.testSuite,
    errorType: input.errorType,
    errorMessage: input.errorMessage,
    stackTrace: input.stackTrace,
    screenshotUrl: input.screenshotUrl,
    pageUrl: input.pageUrl,
    userAgent: input.userAgent,
    testUserId: input.testUserId,
    testUserRole: input.testUserRole,
    llmPrompt,
    stepsToReproduce: input.stepsToReproduce || [],
    apiEndpoint: input.apiEndpoint,
    apiResponse: input.apiResponse,
    requestPayload: input.requestPayload,
    browserName: input.browserName,
    browserVersion: input.browserVersion,
    runId: input.runId,
    retryCount: input.retryCount || 0,
  }).returning({ id: e2eBugReports.id });
  
  console.log(`[BugReportService] Created bug report: ${result.id}`);
  return result.id;
}

/**
 * Get all bug reports with optional filters
 */
export async function getBugReports(options?: {
  status?: string;
  priority?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  reports: any[];
  total: number;
}> {
  const conditions = [];
  
  if (options?.status) {
    conditions.push(eq(e2eBugReports.status, options.status as any));
  }
  
  if (options?.priority) {
    conditions.push(eq(e2eBugReports.priority, options.priority as any));
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const reports = await db.query.e2eBugReports.findMany({
    where: whereClause,
    orderBy: [desc(e2eBugReports.createdAt)],
    limit: options?.limit || 50,
    offset: options?.offset || 0,
  });
  
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(e2eBugReports)
    .where(whereClause);
  
  return {
    reports,
    total: Number(countResult?.count || 0),
  };
}

/**
 * Get a single bug report by ID
 */
export async function getBugReportById(id: string): Promise<any | null> {
  return db.query.e2eBugReports.findFirst({
    where: eq(e2eBugReports.id, id),
  });
}

/**
 * Update bug report status
 */
export async function updateBugReportStatus(
  id: string,
  status: "new" | "investigating" | "fixed" | "wont_fix" | "duplicate",
  resolution?: string
): Promise<boolean> {
  const updateData: any = {
    status,
    updatedAt: new Date(),
  };
  
  if (status === "fixed" || status === "wont_fix") {
    updateData.resolvedAt = new Date();
  }
  
  if (resolution) {
    updateData.resolution = resolution;
  }
  
  const result = await db.update(e2eBugReports)
    .set(updateData)
    .where(eq(e2eBugReports.id, id))
    .returning({ id: e2eBugReports.id });
  
  return result.length > 0;
}

/**
 * Update bug report priority
 */
export async function updateBugReportPriority(
  id: string,
  priority: "critical" | "high" | "medium" | "low"
): Promise<boolean> {
  const result = await db.update(e2eBugReports)
    .set({
      priority,
      updatedAt: new Date(),
    })
    .where(eq(e2eBugReports.id, id))
    .returning({ id: e2eBugReports.id });
  
  return result.length > 0;
}

/**
 * Delete old resolved bug reports
 */
export async function cleanupOldReports(daysOld: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const result = await db.delete(e2eBugReports)
    .where(and(
      inArray(e2eBugReports.status, ["fixed", "wont_fix", "duplicate"]),
      sql`${e2eBugReports.resolvedAt} < ${cutoffDate}`
    ))
    .returning({ id: e2eBugReports.id });
  
  return result.length;
}

/**
 * Get bug report statistics
 */
export async function getBugReportStats(): Promise<{
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  recentCount: number;
}> {
  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(e2eBugReports);
  
  const statusCounts = await db
    .select({
      status: e2eBugReports.status,
      count: sql<number>`count(*)`,
    })
    .from(e2eBugReports)
    .groupBy(e2eBugReports.status);
  
  const priorityCounts = await db
    .select({
      priority: e2eBugReports.priority,
      count: sql<number>`count(*)`,
    })
    .from(e2eBugReports)
    .groupBy(e2eBugReports.priority);
  
  // Count reports from last 24 hours
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const [recentResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(e2eBugReports)
    .where(sql`${e2eBugReports.createdAt} > ${yesterday}`);
  
  return {
    total: Number(totalResult?.count || 0),
    byStatus: statusCounts.reduce((acc, { status, count }) => {
      acc[status] = Number(count);
      return acc;
    }, {} as Record<string, number>),
    byPriority: priorityCounts.reduce((acc, { priority, count }) => {
      acc[priority] = Number(count);
      return acc;
    }, {} as Record<string, number>),
    recentCount: Number(recentResult?.count || 0),
  };
}

/**
 * Check for duplicate bug report
 */
export async function findDuplicateReport(
  testFile: string,
  testName: string,
  errorMessage: string
): Promise<string | null> {
  const existing = await db.query.e2eBugReports.findFirst({
    where: and(
      eq(e2eBugReports.testFile, testFile),
      eq(e2eBugReports.testName, testName),
      eq(e2eBugReports.errorMessage, errorMessage),
      eq(e2eBugReports.status, "new")
    ),
    columns: { id: true },
  });
  
  return existing?.id || null;
}
