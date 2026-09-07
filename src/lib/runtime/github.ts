import { GITHUB_USERNAME } from '@/lib/site';
import { env } from '@/lib/env';
import type { GithubRepository } from '@/types/server';

export type { GithubRepository };

export interface ContributionDay {
  date: string;
  count: number;
  level: number;
}

const GITHUB_GRAPHQL = 'https://api.github.com/graphql';
const MIRROR = (username: string) => `https://github-contributions-api.jogruber.de/v4/${username}`;

export async function fetchContributions(username = GITHUB_USERNAME): Promise<ContributionDay[]> {
  const res = await fetch(MIRROR(username));
  if (!res.ok) throw new Error(`contributions API ${res.status}`);
  const data = (await res.json()) as { contributions?: ContributionDay[] };
  return (data.contributions ?? []).map((d) => ({
    date: d.date,
    count: d.count,
    level: d.level ?? 0,
  }));
}

export async function fetchRepoData(repo: string): Promise<GithubRepository | null> {
  const token = env('GITHUB_API_TOKEN');
  if (!token) {
    return fetchRepoDataRest(repo);
  }
  const [owner, name] = repo.split('/');
  if (!owner || !name) return null;
  try {
    const query = `
      query repository($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          stargazerCount
          description
          homepageUrl
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
            edges { node { color name } }
          }
          name
          nameWithOwner
          url
          forkCount
          repositoryTopics(first: 20) { edges { node { topic { name } } } }
        }
      }
    `;
    const res = await fetch(GITHUB_GRAPHQL, {
      method: 'POST',
      headers: {
        authorization: `token ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query, variables: { owner, repo: name } }),
    });
    if (!res.ok) { console.error('GitHub GraphQL', res.status); return null; }
    const body = (await res.json()) as {
      data?: { repository?: GithubRepository & { languages?: { edges: { node: { color: string; name: string } }[] }; repositoryTopics?: { edges: { node: { topic: { name: string } } }[] } } };
    };
    const repository = body.data?.repository;
    if (!repository) return null;
    return {
      stargazerCount: repository.stargazerCount,
      description: repository.description,
      homepageUrl: repository.homepageUrl,
      languages: (repository.languages?.edges ?? []).map((edge) => edge.node),
      name: repository.name,
      nameWithOwner: repository.nameWithOwner,
      url: repository.url,
      forkCount: repository.forkCount,
      repositoryTopics: (repository.repositoryTopics?.edges ?? []).map((edge) => edge.node.topic.name),
    };
  } catch (error) { console.error(error); return null; }
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178C6',
  JavaScript: '#f1e05a',
  Java: '#b07219',
  Python: '#3572A5',
  Kotlin: '#A97BFF',
  CSS: '#663399',
  HTML: '#e34c26',
  Go: '#00ADD8',
  Rust: '#dea584',
  'C#': '#178600',
  Ruby: '#701516',
};

async function fetchRepoDataRest(repo: string): Promise<GithubRepository | null> {
  const [owner, name] = repo.split('/');
  if (!owner || !name) return null;
  try {
    const base = `https://api.github.com/repos/${owner}/${name}`;
    const headers = { accept: 'application/vnd.github+json', 'user-agent': 'dawn-blog' };
    const res = await fetch(base, { headers });
    if (!res.ok) { console.error('GitHub REST', res.status); return null; }
    const data = (await res.json()) as { stargazers_count?: number; description?: string | null; homepage?: string | null; name?: string; full_name?: string; html_url?: string; forks_count?: number; topics?: string[] };
    const langsRes = await fetch(`${base}/languages`, { headers });
    const languages = langsRes.ok
      ? Object.entries((await langsRes.json()) as Record<string, number>).map(([lang]) => ({ name: lang, color: LANGUAGE_COLORS[lang] ?? '#8b949e' }))
      : [];
    return {
      stargazerCount: data.stargazers_count ?? 0,
      description: data.description ?? '',
      homepageUrl: data.homepage ?? '',
      languages,
      name: data.name ?? name,
      nameWithOwner: data.full_name ?? repo,
      url: data.html_url ?? `https://github.com/${repo}`,
      forkCount: data.forks_count ?? 0,
      repositoryTopics: data.topics ?? [],
    };
  } catch (error) { console.error(error); return null; }
}
