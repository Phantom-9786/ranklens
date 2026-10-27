import { z } from 'zod';

export const auditInputSchema = z.object({
  auditId: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/).describe('Report ID: studio-north, field-notes, or evergreen. Pass other requested IDs through so missing reports can be reported honestly.'),
});
export const auditOutputSchema = z.object({
  id: z.string(), domain: z.string(), score: z.number().int().min(0).max(100),
  pages: z.number().int().positive(), issues: z.number().int().nonnegative(), sample: z.literal(true),
  findings: z.array(z.object({ title: z.string(), detail: z.string(), severity: z.enum(['High', 'Medium', 'Low']), count: z.number().int().nonnegative(), category: z.string() })).max(10),
});
export type AuditInput = z.infer<typeof auditInputSchema>;
export type AuditOutput = z.infer<typeof auditOutputSchema>;
export const auditToolPartSchema = z.discriminatedUnion('state', [
  z.object({ type: z.literal('tool-get_audit_report'), toolCallId: z.string().min(1), state: z.literal('input-streaming'), inputText: z.string().max(4000) }),
  z.object({ type: z.literal('tool-get_audit_report'), toolCallId: z.string().min(1), state: z.literal('input-available'), input: auditInputSchema }),
  z.object({ type: z.literal('tool-get_audit_report'), toolCallId: z.string().min(1), state: z.literal('output-available'), input: auditInputSchema, output: auditOutputSchema }),
  z.object({ type: z.literal('tool-get_audit_report'), toolCallId: z.string().min(1), state: z.literal('output-error'), input: auditInputSchema.optional(), errorText: z.string().max(300) }),
]);
export type AuditToolPart = z.infer<typeof auditToolPartSchema>;
