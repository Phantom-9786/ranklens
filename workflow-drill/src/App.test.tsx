import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App, { STORAGE_KEY } from './App';

beforeEach(() => { vi.restoreAllMocks(); localStorage.clear(); });
const save = () => fireEvent.click(screen.getByRole('button', { name: /save settings/i }));
const url = () => screen.getByLabelText('Website URL');
const pages = () => screen.getByLabelText('Maximum pages');

describe('audit settings', () => {
  it('shows defaults and persists all controlled settings with a trimmed URL', () => {
    render(<App />);
    expect(url()).toHaveValue('https://example.com');
    expect(pages()).toHaveValue(50);
    expect(screen.getByLabelText('Include subdomains')).not.toBeChecked();
    fireEvent.change(url(), { target: { value: ' https://example.com/docs ' } });
    fireEvent.click(screen.getByLabelText('Include subdomains'));
    save();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({ websiteUrl: 'https://example.com/docs', maxPages: 50, includeSubdomains: true });
    expect(screen.getByRole('status')).toHaveTextContent('No audit was run');
  });
  it.each(['ftp://example.com', 'https://user:pass@example.com', 'https://user@example.com', 'invalid', 'https://'])('rejects unsafe or invalid URL %s and focuses it', value => {
    render(<App />);
    fireEvent.change(url(), { target: { value } });
    save();
    expect(url()).toHaveAttribute('aria-invalid', 'true');
    expect(url()).toHaveAttribute('aria-describedby', 'url-hint url-error');
    expect(url()).toHaveFocus();
    expect(screen.getByRole('alert')).toHaveTextContent('HTTP or HTTPS');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
  it.each(['', '0', '501', '1.5'])('rejects page value %s with accessible error and focus', value => {
    render(<App />);
    fireEvent.change(pages(), { target: { value } });
    save();
    expect(pages()).toHaveAttribute('aria-invalid', 'true');
    expect(pages()).toHaveAttribute('aria-describedby', 'pages-hint pages-error');
    expect(pages()).toHaveFocus();
    expect(screen.getByRole('alert')).toHaveTextContent('whole number');
  });
  it.each(['1', '500'])('accepts page boundary %s and URL paths', value => {
    render(<App />);
    fireEvent.change(url(), { target: { value: 'https://example.com/docs' } });
    fireEvent.change(pages(), { target: { value } });
    save();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
  it('focuses URL first when both fields are invalid', () => {
    render(<App />);
    fireEvent.change(url(), { target: { value: 'ftp://example.com' } });
    fireEvent.change(pages(), { target: { value: '0' } });
    save();
    expect(screen.getAllByRole('alert')).toHaveLength(2);
    expect(url()).toHaveFocus();
  });
  it('restores validated persisted preferences', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ websiteUrl: 'http://example.org/path', maxPages: 500, includeSubdomains: true }));
    render(<App />);
    expect(url()).toHaveValue('http://example.org/path');
    expect(pages()).toHaveValue(500);
    expect(screen.getByLabelText('Include subdomains')).toBeChecked();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
  it.each(['{broken', 'null', '[]', '{"websiteUrl":"ftp://example.com","maxPages":50,"includeSubdomains":false}', '{"websiteUrl":"https://example.com","maxPages":0,"includeSubdomains":false}', '{"websiteUrl":"https://example.com","maxPages":"50","includeSubdomains":false}'])('recovers from malformed storage %s', raw => {
    localStorage.setItem(STORAGE_KEY, raw);
    render(<App />);
    expect(url()).toHaveValue('https://example.com');
    expect(pages()).toHaveValue(50);
  });
  it('remains usable when reading storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    render(<App />);
    expect(pages()).toHaveValue(50);
    save();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
  it('reports failed writes without stale success and clears failure on edit', () => {
    render(<App />);
    save();
    expect(screen.getByRole('status')).toBeInTheDocument();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    save();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('could not be saved');
    fireEvent.change(pages(), { target: { value: '40' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it.each(['url', 'pages', 'subdomains'])('clears success when editing %s', field => {
    render(<App />);
    save();
    if (field === 'subdomains') fireEvent.click(screen.getByLabelText('Include subdomains'));
    else fireEvent.change(field === 'url' ? url() : pages(), { target: { value: field === 'url' ? 'http://example.org' : '42' } });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
