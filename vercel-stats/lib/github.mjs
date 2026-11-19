const ACCOUNT = 'mreshrati';
const API = 'https://api.github.com';
const PAGE_SIZE = 100;
const PARALLEL_REQUESTS = 6;

async function request(path, token, signal, query) {
  const response = await fetch(new URL(path, API), {
    method: query ? 'POST' : 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'mreshrati-profile-cards',
      ...(query && { 'Content-Type': 'application/json' }),
    },
    body: query && JSON.stringify({ query }),
    redirect: 'error',
    signal,
  });
  if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
  return { data: await response.json(), links: response.headers.get('Link') ?? '' };
}

function checkAccount(login) {
  if (login?.toLowerCase() !== ACCOUNT) throw new Error('Wrong GitHub account');
}

export async function getActivity(token, signal) {
  const query = `query ProfileActivity {
    viewer {
      login
      contributionsCollection {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        contributionCalendar {
          totalContributions
          weeks { contributionDays { contributionCount } }
        }
      }
    }
  }`;
  const { data } = await request('/graphql', token, signal, query);
  if (data.errors?.length) throw new Error('GitHub GraphQL request failed');
  const viewer = data.data?.viewer;
  checkAccount(viewer?.login);
  const activity = viewer.contributionsCollection;
  const calendar = activity?.contributionCalendar;
  const total = calendar?.totalContributions;
  const commits = activity?.totalCommitContributions;
  const pullRequests = activity?.totalPullRequestContributions;
  const issues = activity?.totalIssueContributions;
  if (![total, commits, pullRequests, issues].every(value => Number.isSafeInteger(value) && value >= 0)
    || !Array.isArray(calendar?.weeks)) {
    throw new Error('Missing contribution totals');
  }

  let totalDays = 0;
  let activeDays = 0;
  let streak = 0;
  let longestStreak = 0;
  for (const week of calendar.weeks) {
    for (const day of week.contributionDays) {
      totalDays++;
      if (day.contributionCount > 0) {
        activeDays++;
        streak++;
        longestStreak = Math.max(longestStreak, streak);
      } else {
        streak = 0;
      }
    }
  }
  return { total, commits, pullRequests, issues, totalDays, activeDays, longestStreak };
}

export async function getLanguages(token, signal) {
  const { data: user } = await request('/user', token, signal);
  checkAccount(user.login);

  const repositories = new Map();
  for (let page = 1; ; page++) {
    const { data, links } = await request(
      `/user/repos?affiliation=owner&visibility=all&sort=full_name&per_page=${PAGE_SIZE}&page=${page}`,
      token,
      signal,
    );
    if (!Array.isArray(data)) throw new Error('Invalid repository list');
    for (const repo of data) {
      if (repo.owner?.login?.toLowerCase() === ACCOUNT && repo.fork === false) {
        repositories.set(repo.id, encodeURIComponent(repo.name));
      }
    }
    if (!links.includes('rel="next"')) break;
  }

  const names = [...repositories.values()];
  const totals = new Map();
  for (let i = 0; i < names.length; i += PARALLEL_REQUESTS) {
    const batch = await Promise.all(names.slice(i, i + PARALLEL_REQUESTS).map(
      repo => request(`/repos/${ACCOUNT}/${repo}/languages`, token, signal),
    ));
    for (const { data } of batch) {
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Invalid repository language totals');
      }
      for (const [name, bytes] of Object.entries(data)) {
        if (!Number.isSafeInteger(bytes) || bytes <= 0) continue;
        totals.set(name, (totals.get(name) ?? 0) + bytes);
      }
    }
  }
  return [...totals].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'en'));
}
