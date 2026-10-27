// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import AssistantError from './error';

it('offers route reload and a useful alternative without exposing the exception', async () => {
  const reset = vi.fn();
  render(<AssistantError error={new Error('private server exception')} reset={reset}/>);
  expect(screen.getByRole('alert')).not.toHaveTextContent('private server exception');
  expect(screen.getByRole('link', { name: /Explore sample reports/ })).toHaveAttribute('href', '/audits');
  await userEvent.click(screen.getByRole('button', { name: 'Reload assistant' })); expect(reset).toHaveBeenCalledOnce();
});
