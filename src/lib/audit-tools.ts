import 'server-only';
import { tool } from 'ai';
import { auditInputSchema, auditOutputSchema, type AuditInput, type AuditOutput } from './audit-tool-contract';
import { audits, findings } from './fixtures';

/** Read-only fixture lookup. No URL fetching, writes, credentials, or live crawl. */
export async function executeAuditLookup(input: AuditInput): Promise<AuditOutput> {
  const { auditId } = auditInputSchema.parse(input);
  const audit = audits.find(report => report.id === auditId);
  if (!audit) throw new Error('REPORT_NOT_FOUND');
  return auditOutputSchema.parse({ ...audit, sample: true, findings });
}

export const auditTools = {
  get_audit_report: tool({
    description: 'Look up a stored sample SEO audit report by its ID. Returns its score, page and issue totals, and shared illustrative finding examples. This does not visit a website. Unknown IDs fail with report not found.',
    inputSchema: auditInputSchema,
    outputSchema: auditOutputSchema,
    execute: executeAuditLookup,
  }),
};
