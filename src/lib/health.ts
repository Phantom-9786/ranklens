export const HEALTH_SOURCE = 'https://api.github.com/repos/Phantom-9786/ranklens';
type Repository = { full_name: string; default_branch: string; updated_at: string; html_url: string };
export async function fetchHealth(): Promise<{ ok: true; checkedAt: string; repository: Repository } | { ok: false; checkedAt: string; error: string }> {
  const checkedAt = new Date().toISOString();
  try {
    const response = await fetch(HEALTH_SOURCE, { cache: 'no-store', signal: AbortSignal.timeout(8000), headers: { Accept: 'application/vnd.github+json' } });
    if (!response.ok) throw new Error(`Upstream returned HTTP ${response.status}`);
    const data: unknown = await response.json();
    if (!data || typeof data !== 'object') throw new Error('Unexpected repository response');
    const repo = data as Partial<Repository>;
    if (typeof repo.full_name !== 'string' || typeof repo.default_branch !== 'string' || typeof repo.updated_at !== 'string' || typeof repo.html_url !== 'string') throw new Error('Missing repository fields');
    return { ok: true, checkedAt, repository: { full_name: repo.full_name, default_branch: repo.default_branch, updated_at: repo.updated_at, html_url: repo.html_url } };
  } catch (error) {
    return { ok: false, checkedAt, error: error instanceof Error && error.name === 'TimeoutError' ? 'The public repository request timed out. Try again shortly.' : 'The public repository request failed. GitHub may be unavailable or rate-limited. Try again shortly.' };
  }
}
