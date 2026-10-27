// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import AuditToolCard from './audit-tool-card';
import { executeAuditLookup } from '@/lib/audit-tools';

it('renders all four tool states with distinct content and preserves the card', async () => {
  const base = { type: 'tool-get_audit_report' as const, toolCallId: 'lookup-1' };
  const input = { auditId: 'studio-north' };
  const { rerender } = render(<AuditToolCard part={{ ...base, state: 'input-streaming', inputText: '{' }}/>);
  const card = screen.getByRole('region', { name: 'Sample audit report lookup' });
  expect(screen.getByText('Preparing your report request…')).toBeInTheDocument();
  rerender(<AuditToolCard part={{ ...base, state: 'input-available', input }}/>);
  expect(screen.getByText('studio-north')).toBeInTheDocument();
  expect(screen.getByText('Input checked. Waiting for the server lookup result…')).toBeInTheDocument();
  rerender(<AuditToolCard part={{ ...base, state: 'output-available', input, output: await executeAuditLookup(input) }}/>);
  expect(screen.getByText('82')).toBeInTheDocument();
  expect(screen.getAllByRole('listitem')).toHaveLength(3);
  expect(screen.getByRole('region', { name: 'Sample audit report lookup' })).toBe(card);
  rerender(<AuditToolCard part={{ ...base, state: 'output-error', input: { auditId: 'missing-report' }, errorText: 'That report was not found.' }}/>);
  expect(screen.getByText('We couldn’t load that report.')).toBeInTheDocument();
  expect(screen.getByText('That report was not found.')).toBeInTheDocument();
  expect(screen.getByText(/Try asking/)).toBeInTheDocument();
});

it('does not leave interrupted lookups claiming to be running', () => {
  render(<AuditToolCard interrupted part={{ type: 'tool-get_audit_report', toolCallId: 'x', state: 'input-streaming', inputText: '' }}/>);
  expect(screen.getByText('Interrupted')).toBeInTheDocument();
  expect(screen.queryByText('In progress')).not.toBeInTheDocument();
});
