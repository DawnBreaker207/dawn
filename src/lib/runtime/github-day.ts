import { env } from '@/lib/env';
import { GITHUB_USERNAME } from '@/lib/site';

const GITHUB_GRAPHQL = 'https://api.github.com/graphql';

export interface GithubDayPayload {
  ok: boolean;
  date: string;
  contributions: number | null;
  commits: number | null;
  additions: number | null;
  deletions: number | null;
  issues: number | null;
  pullRequests: number | null;
  error?: string;
}

type Collection = {
  totalCommitContributions: number;
  totalIssueContributions: number;
  totalPullRequestContributions: number;
  totalPullRequestReviewContributions: number;
};

type DayRepoCommit = {
  committedDate: string;
  additions?: number;
  deletions?: number;
  author?: { user?: { login?: string } };
};

type DayGraphqlResponse = {
  user?: { selected?: Collection };
  viewer?: {
    repositories?: {
      nodes: Array<{
        defaultBranchRef?: {
          target?: { history?: { nodes: DayRepoCommit[] } };
        };
      }>;
    };
  };
};

const QUERY = `
  query GithubSingleDay($username: String!, $fromDateTime: DateTime!, $toDateTime: DateTime!, $fromGitTimestamp: GitTimestamp!, $toGitTimestamp: GitTimestamp!) {
    user(login: $username) {
      selected: contributionsCollection(from: $fromDateTime, to: $toDateTime) {
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
      }
    }
    viewer {
      repositories(first: 30, orderBy: { field: PUSHED_AT, direction: DESC }, affiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER]) {
        nodes {
          defaultBranchRef {
            target {
              ... on Commit {
                history(first: 60, since: $fromGitTimestamp, until: $toGitTimestamp) {
                  nodes {
                    committedDate
                    additions
                    deletions
                    author { user { login } }
                  }
                }
              }
            }
          }
        }
      }
    }
  }`;

function utcRange(date: string): { date: string; from: string; to: string } {
  const [year, month, day] = date.split('-').map(Number);
  const startMs = Date.UTC(year, month - 1, day);
  return {
    date,
    from: new Date(startMs).toISOString(),
    to: new Date(startMs + 86_400_000 - 1).toISOString(),
  };
}

const EMPTY: Omit<GithubDayPayload, 'ok' | 'date'> = {
  contributions: null,
  commits: null,
  additions: null,
  deletions: null,
  issues: null,
  pullRequests: null,
};

function buildDay(
  data: DayGraphqlResponse,
  range: { date: string; from: string; to: string },
): GithubDayPayload {
  const collection = data.user?.selected;
  const repos = data.viewer?.repositories?.nodes ?? [];

  const dayCommits = repos.flatMap((repo) =>
    (repo.defaultBranchRef?.target?.history?.nodes ?? [])
      .filter(
        (c) => !c.author?.user?.login || c.author.user.login === GITHUB_USERNAME,
      )
      .filter(
        (c) => c.committedDate >= range.from && c.committedDate <= range.to,
      ),
  );

  return {
    ok: true,
    date: range.date,
    contributions: collection
      ? collection.totalCommitContributions +
        collection.totalIssueContributions +
        collection.totalPullRequestContributions +
        collection.totalPullRequestReviewContributions
      : null,
    commits: dayCommits.length ? dayCommits.length : collection?.totalCommitContributions ?? null,
    additions: dayCommits.length
      ? dayCommits.reduce((sum, c) => sum + (c.additions ?? 0), 0)
      : null,
    deletions: dayCommits.length
      ? dayCommits.reduce((sum, c) => sum + (c.deletions ?? 0), 0)
      : null,
    issues: collection?.totalIssueContributions ?? null,
    pullRequests: collection?.totalPullRequestContributions ?? null,
  };
}

async function githubGraphql(query: string, variables: Record<string, unknown>): Promise<DayGraphqlResponse> {
  const token = env('GITHUB_API_TOKEN');
  if (!token) throw new Error('GITHUB_API_TOKEN is not configured.');
  const res = await fetch(GITHUB_GRAPHQL, {
    method: 'POST',
    headers: {
      authorization: `bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GitHub GraphQL failed with HTTP ${res.status}.`);
  const json = (await res.json()) as { errors?: { message?: string }[]; data?: DayGraphqlResponse };
  if (json.errors?.length) throw new Error(json.errors[0]?.message ?? 'GitHub GraphQL returned errors.');
  return json.data as DayGraphqlResponse;
}

async function fetchSingleDay(date: string): Promise<GithubDayPayload> {
  const range = utcRange(date);
  const data = await githubGraphql(QUERY, {
    username: GITHUB_USERNAME,
    fromDateTime: range.from,
    toDateTime: range.to,
    fromGitTimestamp: range.from,
    toGitTimestamp: range.to,
  });
  return buildDay(data, range);
}

export async function fetchGithubDay(date: string): Promise<GithubDayPayload> {
  try {
    return await fetchSingleDay(date);
  } catch (error) {
    return {
      ok: false,
      date,
      ...EMPTY,
      error: error instanceof Error ? error.message : 'GitHub request failed.',
    };
  }
}

export async function fetchGithubToday(): Promise<GithubDayPayload> {
  return fetchGithubDay(new Date().toISOString().slice(0, 10));
}