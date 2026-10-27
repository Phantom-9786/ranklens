import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import App from './App';

afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

it('rejects invalid URLs and focuses the website field', async () => {
  const user = userEvent.setup(); render(<App />);
  await user.type(screen.getByLabelText(/Website URL/), 'javascript:alert(1)');
  await user.click(screen.getByRole('button', { name: /Save settings/ }));
  expect(screen.getByRole('alert')).toHaveTextContent('Enter a complete website URL');
  expect(screen.getByLabelText(/Website URL/)).toHaveFocus();
  expect(localStorage.getItem('ranklens-audit-settings')).toBeNull();
});

it('saves selected settings and clears the success message after editing', async () => {
  const user = userEvent.setup(); render(<App />);
  await user.type(screen.getByLabelText(/Website URL/), 'https://example.com');
  await user.selectOptions(screen.getByLabelText('Page limit'), '25');
  await user.selectOptions(screen.getByLabelText('Audit frequency'), 'weekly');
  await user.click(screen.getByLabelText(/Broken links/));
  await user.click(screen.getByRole('button', { name: /Save settings/ }));
  expect(JSON.parse(localStorage.getItem('ranklens-audit-settings')!)).toEqual({ website: 'https://example.com', limit: '25', frequency: 'weekly', mobile: true, links: false });
  expect(screen.getByRole('status')).toHaveTextContent('No audit has been started');
  await user.selectOptions(screen.getByLabelText('Page limit'), '500');
  expect(screen.getByRole('status')).toBeEmptyDOMElement();
});

it('reports storage failure without claiming success', async () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('storage unavailable'); });
  const user = userEvent.setup(); render(<App />);
  await user.type(screen.getByLabelText(/Website URL/), 'https://example.com');
  await user.click(screen.getByRole('button', { name: /Save settings/ }));
  expect(screen.getByRole('alert')).toHaveTextContent('could not save settings');
  expect(screen.getByRole('status')).toBeEmptyDOMElement();
});
