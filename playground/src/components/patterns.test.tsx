import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { Modal } from './Modal';
import { Tabs } from './Tabs';
import { Disclosure } from './Disclosure';

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});

function renderModal() {
  render(<><Modal trigger="Open practice" title="Practice dialog" description="Keyboard practice"><label htmlFor="name">Name</label><input id="name"/></Modal><button>Outside</button></>);
}
const items = [
  { label: 'First', content: <p>First content</p> },
  { label: 'Second', content: <p>Second content</p> },
  { label: 'Third', content: <p>Third content</p> },
];

it('opens the modal by keyboard, names it, and focuses its title', async () => {
  const user = userEvent.setup(); renderModal();
  await user.tab(); await user.keyboard('{Enter}');
  const dialog = screen.getByRole('dialog', { name: 'Practice dialog' });
  expect(dialog).toHaveAttribute('aria-modal', 'true');
  expect(dialog).toHaveAccessibleDescription('Keyboard practice');
  expect(within(dialog).getByRole('heading')).toHaveFocus();
});
it('wraps Tab and Shift+Tab at both modal boundaries', async () => {
  const user = userEvent.setup(); renderModal(); await user.click(screen.getByRole('button', { name: /Open practice/ }));
  await user.tab({ shift: true }); expect(screen.getByRole('button', { name: 'Keep exploring' })).toHaveFocus();
  await user.tab(); expect(screen.getByRole('button', { name: 'Close custom dialog' })).toHaveFocus();
  await user.tab({ shift: true }); expect(screen.getByRole('button', { name: 'Keep exploring' })).toHaveFocus();
});
it('restores opener focus and scroll state when closed', async () => {
  const user = userEvent.setup(); renderModal(); const opener = screen.getByRole('button', { name: /Open practice/ });
  await user.click(opener); expect(document.body.style.overflow).toBe('hidden');
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(opener).toHaveFocus(); expect(document.body.style.overflow).toBe(''); expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
it('handles the native cancel event used by Escape', async () => {
  const user = userEvent.setup(); renderModal(); const opener = screen.getByRole('button', { name: /Open practice/ }); await user.click(opener);
  fireEvent(screen.getByRole('dialog'), new Event('cancel', { bubbles: true, cancelable: true }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); expect(opener).toHaveFocus();
});
it('gives only the active tab a place in the Tab sequence', async () => {
  const user = userEvent.setup(); render(<Tabs label="Topics" items={items}/>);
  const tabs = screen.getAllByRole('tab'); expect(tabs.map(tab => tab.tabIndex)).toEqual([0, -1, -1]);
  await user.tab(); expect(tabs[0]).toHaveFocus(); await user.tab(); expect(screen.getByRole('tabpanel')).toHaveFocus();
});
it('moves and automatically activates tabs with arrows, wrapping both ways', async () => {
  const user = userEvent.setup(); render(<Tabs label="Topics" items={items}/>); await user.tab();
  await user.keyboard('{ArrowLeft}'); expect(screen.getByRole('tab', { name: 'Third' })).toHaveFocus();
  expect(screen.getByRole('tabpanel')).toHaveAccessibleName('Third');
  await user.keyboard('{ArrowRight}'); expect(screen.getByRole('tab', { name: 'First' })).toHaveAttribute('aria-selected', 'true');
  await user.keyboard('{ArrowRight}'); expect(screen.getByRole('tabpanel')).toHaveTextContent('Second content');
});
it('supports Home and End while leaving Up/Down alone', async () => {
  const user = userEvent.setup(); render(<Tabs label="Topics" items={items}/>); await user.tab();
  await user.keyboard('{End}'); expect(screen.getByRole('tab', { name: 'Third' })).toHaveFocus();
  await user.keyboard('{Home}'); expect(screen.getByRole('tab', { name: 'First' })).toHaveFocus();
  await user.keyboard('{ArrowDown}{ArrowUp}'); expect(screen.getByRole('tab', { name: 'First' })).toHaveFocus();
});
it('links tabs and panels with stable, unique IDs for multiple instances', () => {
  render(<><Tabs label="One" items={items}/><Tabs label="Two" items={items}/></>);
  const tabs = screen.getAllByRole('tab'); expect(new Set(tabs.map(tab => tab.id)).size).toBe(6);
  for (const tab of tabs) { const panel = document.getElementById(tab.getAttribute('aria-controls')!); expect(panel).toHaveAttribute('aria-labelledby', tab.id); }
  expect(screen.getAllByRole('tabpanel')).toHaveLength(2);
});
it('handles an empty tabs collection without invalid arithmetic', () => { render(<Tabs label="Empty" items={[]}/>); expect(screen.getByText('No tabs available.')).toBeInTheDocument(); });
it('toggles disclosure by Enter and Space and hides collapsed descendants', async () => {
  const user = userEvent.setup(); render(<Disclosure label="More details"><a href="#target">Details link</a></Disclosure>);
  const trigger = screen.getByRole('button', { name: 'More details' }); await user.tab();
  expect(trigger).toHaveAttribute('aria-expanded', 'false'); expect(screen.queryByRole('link')).not.toBeInTheDocument();
  await user.keyboard('{Enter}'); expect(trigger).toHaveAttribute('aria-expanded', 'true'); expect(screen.getByRole('link')).toBeVisible();
  expect(document.getElementById(trigger.getAttribute('aria-controls')!)).toContainElement(screen.getByRole('link'));
  await user.keyboard(' '); expect(trigger).toHaveAttribute('aria-expanded', 'false');
  expect(trigger).toHaveFocus(); expect(screen.queryByRole('link')).not.toBeInTheDocument();
});
