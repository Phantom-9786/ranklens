import { expect, it } from 'vitest';
import { executeAuditLookup } from './audit-tools';
import { auditInputSchema } from './audit-tool-contract';
import { applyStreamPart, isMessage, messageContext, parseStreamPart, type ChatMessage } from './chat-protocol';

it('validates report IDs and returns actual fixture data with an explicit sample label', async () => {
  expect(auditInputSchema.safeParse({ auditId: 'https://private.example' }).success).toBe(false);
  expect(auditInputSchema.safeParse({ auditId: '' }).success).toBe(false);
  expect(auditInputSchema.safeParse({ auditId: 'a'.repeat(65) }).success).toBe(false);
  const report = await executeAuditLookup({ auditId: 'studio-north' });
  expect(report).toMatchObject({ score: 82, pages: 24, issues: 12, sample: true });
  expect(report.findings).toHaveLength(3);
  await expect(executeAuditLookup({ auditId: 'missing-report' })).rejects.toThrow('REPORT_NOT_FOUND');
});

it('morphs one tool part through states, preserves interleaved text, and validates storage', async () => {
  let message: ChatMessage = { id: 'a', role: 'assistant', parts: [{ type: 'text', text: 'Looking up. ' }] };
  message = applyStreamPart(message, { type: 'tool-update', part: { type: 'tool-get_audit_report', toolCallId: 't', state: 'input-streaming', inputText: '{' } });
  message = applyStreamPart(message, { type: 'tool-update', part: { type: 'tool-get_audit_report', toolCallId: 't', state: 'input-available', input: { auditId: 'studio-north' } } });
  const event = { type: 'tool-update', part: { type: 'tool-get_audit_report', toolCallId: 't', state: 'output-available', input: { auditId: 'studio-north' }, output: await executeAuditLookup({ auditId: 'studio-north' }) } };
  message = applyStreamPart(message, parseStreamPart(JSON.stringify(event)));
  message = applyStreamPart(message, { type: 'text-delta', delta: 'Start with descriptions.' });
  expect(message.parts).toHaveLength(3);
  expect(isMessage(message)).toBe(true);
  expect(messageContext(message)).toContain('"score":82');
  expect(isMessage({ ...message, role: 'user' })).toBe(false);
  expect(() => parseStreamPart(JSON.stringify({ ...event, part: { ...event.part, output: { score: 'bad' } } }))).toThrow();
});
