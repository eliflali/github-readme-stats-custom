"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const axios_1 = __importDefault(require("axios"));
const GITHUB_GRAPHQL_API = 'https://api.github.com/graphql';
/**
 * Fetches user statistics from the GitHub GraphQL API v4
 */
async function fetchUserStats(username, token) {
    const primaryQuery = `
    query userInfo($login: String!, $issueQuery: String!, $prQuery: String!) {
      user(login: $login) {
        name
        login
        avatarUrl(size: 80)
        contributionsCollection {
          contributionYears
        }
        repositories(ownerAffiliations: OWNER, first: 100, isFork: false) {
          nodes {
            stargazerCount
          }
        }
      }
      issueCount: search(query: $issueQuery, type: ISSUE, first: 0) {
        issueCount
      }
      prCount: search(query: $prQuery, type: ISSUE, first: 0) {
        issueCount
      }
    }
  `;
    // 1. Primary request to get user info, repos stars, contribution years, and PR/issue counts
    const primaryResponse = await axios_1.default.post(GITHUB_GRAPHQL_API, {
        query: primaryQuery,
        variables: {
            login: username,
            issueQuery: `author:${username} is:issue`,
            prQuery: `author:${username} is:pr`,
        },
    }, {
        headers: {
            Authorization: `bearer ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'github-readme-stats-custom',
        },
        timeout: 10000,
    });
    if (primaryResponse.data.errors) {
        throw new Error(primaryResponse.data.errors[0].message);
    }
    const user = primaryResponse.data.data?.user;
    if (!user) {
        throw new Error(`User "${username}" not found.`);
    }
    const name = user.name || user.login || username;
    const login = user.login;
    const repositories = user.repositories.nodes || [];
    const totalStars = repositories.reduce((acc, repo) => acc + (repo.stargazerCount || 0), 0);
    const totalIssues = primaryResponse.data.data.issueCount.issueCount || 0;
    const totalPRs = primaryResponse.data.data.prCount.issueCount || 0;
    // 2. Fetch avatar and convert to Base64
    let avatarBase64;
    if (user.avatarUrl) {
        try {
            const avatarRes = await axios_1.default.get(user.avatarUrl, {
                responseType: 'arraybuffer',
                timeout: 3000,
            });
            avatarBase64 = Buffer.from(avatarRes.data, 'binary').toString('base64');
        }
        catch (e) {
            console.error('Failed to fetch avatar:', e);
        }
    }
    // 3. Dynamic secondary query to sum commits across all contribution years
    const contributionYears = user.contributionsCollection.contributionYears || [];
    let totalCommits = 0;
    if (contributionYears.length > 0) {
        let commitQuery = 'query userCommits($login: String!) { user(login: $login) {';
        contributionYears.forEach((year) => {
            commitQuery += `
        year${year}: contributionsCollection(from: "${year}-01-01T00:00:00Z", to: "${year}-12-31T23:59:59Z") {
          totalCommitContributions
        }
      `;
        });
        commitQuery += '} }';
        const commitsResponse = await axios_1.default.post(GITHUB_GRAPHQL_API, {
            query: commitQuery,
            variables: { login: username },
        }, {
            headers: {
                Authorization: `bearer ${token}`,
                'Content-Type': 'application/json',
                'User-Agent': 'github-readme-stats-custom',
            },
            timeout: 10000,
        });
        if (commitsResponse.data && commitsResponse.data.data && commitsResponse.data.data.user) {
            const yearsData = commitsResponse.data.data.user;
            contributionYears.forEach((year) => {
                const yearCommits = yearsData[`year${year}`]?.totalCommitContributions || 0;
                totalCommits += yearCommits;
            });
        }
    }
    return {
        name,
        login,
        totalCommits,
        totalStars,
        totalPRs,
        totalIssues,
        avatarBase64,
    };
}
/**
 * Generates the premium SVG stats card
 */
function renderStatsSVG(stats) {
    const formatNumber = (num) => num.toLocaleString('en-US');
    const avatarX = 22;
    const avatarY = 14;
    const avatarSize = 32;
    const titleX = stats.avatarBase64 ? 64 : 22;
    const titleY = 36;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 495 195" width="495" height="195">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0f19" />
      <stop offset="100%" stop-color="#0d1117" />
    </linearGradient>
    <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#58a6ff" />
      <stop offset="100%" stop-color="#bc8cff" />
    </linearGradient>
    <clipPath id="avatarClip">
      <circle cx="${avatarX + avatarSize / 2}" cy="${avatarY + avatarSize / 2}" r="${avatarSize / 2}" />
    </clipPath>
  </defs>

  <style>
    .stat-label {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 10px;
      fill: #8b949e;
      font-weight: 600;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }
    .stat-value {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 18px;
      fill: #f0f6fc;
      font-weight: 700;
    }
    .title {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 16px;
      font-weight: 700;
      fill: #f0f6fc;
    }
    .avatar-border {
      stroke: url(#borderGradient);
      stroke-width: 1.5;
      fill: none;
    }
    .card-panel {
      fill: #161b22;
      stroke: #30363d;
      stroke-width: 1;
      transition: fill 0.3s, stroke 0.3s;
    }
    .card-panel:hover {
      fill: #1f242c;
      stroke: #444c56;
    }
    .fade-in {
      animation: fadeIn 0.5s ease-out forwards;
      opacity: 0;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>

  <!-- Background Card -->
  <rect x="0.5" y="0.5" width="494" height="194" rx="10" fill="url(#bgGradient)" stroke="url(#borderGradient)" stroke-width="1.5" />

  <!-- Profile Avatar (Conditional) -->
  ${stats.avatarBase64
        ? `
  <g class="fade-in" style="animation-delay: 0s;">
    <image x="${avatarX}" y="${avatarY}" width="${avatarSize}" height="${avatarSize}" clip-path="url(#avatarClip)" href="data:image/jpeg;base64,${stats.avatarBase64}" />
    <circle cx="${avatarX + avatarSize / 2}" cy="${avatarY + avatarSize / 2}" r="${avatarSize / 2}" class="avatar-border" />
  </g>
  `
        : ''}

  <!-- Header Title -->
  <text x="${titleX}" y="${titleY}" class="title fade-in" style="animation-delay: 0.1s;">${stats.name}'s GitHub Stats</text>

  <!-- Metrics Grid -->
  <!-- Panel 1: Commits -->
  <g class="fade-in" style="animation-delay: 0.2s;">
    <rect x="22" y="60" width="218" height="52" rx="8" class="card-panel" />
    <svg x="37" y="78" width="16" height="16" viewBox="0 0 16 16" fill="#58a6ff">
      <path fill-rule="evenodd" d="M10.5 7.75a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm1.43.75a4.002 4.002 0 01-7.86 0H.75a.75.75 0 110-1.5h3.32a4.002 4.002 0 017.86 0h3.32a.75.75 0 110 1.5h-3.32z" />
    </svg>
    <text x="62" y="78" class="stat-label">Commits</text>
    <text x="62" y="98" class="stat-value">${formatNumber(stats.totalCommits)}</text>
  </g>

  <!-- Panel 2: Stars -->
  <g class="fade-in" style="animation-delay: 0.3s;">
    <rect x="255" y="60" width="218" height="52" rx="8" class="card-panel" />
    <svg x="270" y="78" width="16" height="16" viewBox="0 0 16 16" fill="#f1e05a">
      <path fill-rule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694z" />
    </svg>
    <text x="295" y="78" class="stat-label">Stargazers</text>
    <text x="295" y="98" class="stat-value">${formatNumber(stats.totalStars)}</text>
  </g>

  <!-- Panel 3: PRs -->
  <g class="fade-in" style="animation-delay: 0.4s;">
    <rect x="22" y="122" width="218" height="52" rx="8" class="card-panel" />
    <svg x="37" y="140" width="16" height="16" viewBox="0 0 16 16" fill="#bc8cff">
      <path fill-rule="evenodd" d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a2.25 2.25 0 012.25 2.25v5.256a2.251 2.251 0 11-1.5 0V6.25A.75.75 0 0011 5.5zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5zm7.5 0a.75.75 0 100 1.5.75.75 0 000-1.5z" />
    </svg>
    <text x="62" y="140" class="stat-label">Pull Requests</text>
    <text x="62" y="160" class="stat-value">${formatNumber(stats.totalPRs)}</text>
  </g>

  <!-- Panel 4: Issues -->
  <g class="fade-in" style="animation-delay: 0.5s;">
    <rect x="255" y="122" width="218" height="52" rx="8" class="card-panel" />
    <svg x="270" y="140" width="16" height="16" viewBox="0 0 16 16" fill="#3fb950">
      <path fill-rule="evenodd" d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9 3a1 1 0 11-2 0 1 1 0 012 0zm-.25-6.25a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z" />
    </svg>
    <text x="295" y="140" class="stat-label">Issues Created</text>
    <text x="295" y="160" class="stat-value">${formatNumber(stats.totalIssues)}</text>
  </g>
</svg>`;
}
/**
 * Generates an SVG card to gracefully display error details
 */
function renderErrorSVG(title, message) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 495 195" width="495" height="195">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0f19" />
      <stop offset="100%" stop-color="#0d1117" />
    </linearGradient>
    <linearGradient id="errorBorder" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ff7b72" />
      <stop offset="100%" stop-color="#f8e3a1" />
    </linearGradient>
  </defs>

  <style>
    .title {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 15px;
      font-weight: 700;
      fill: #ff7b72;
    }
    .message {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 13px;
      color: #8b949e;
      line-height: 1.5;
    }
  </style>

  <!-- Background Card -->
  <rect x="0.5" y="0.5" width="494" height="194" rx="10" fill="url(#bgGradient)" stroke="url(#errorBorder)" stroke-width="1.5" />

  <!-- Error Icon -->
  <svg x="22" y="20" width="22" height="22" viewBox="0 0 24 24" fill="#ff7b72">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
  </svg>

  <text x="54" y="36" class="title">${title}</text>
  
  <foreignObject x="22" y="55" width="451" height="120">
    <div xmlns="http://www.w3.org/1999/xhtml" class="message">
      ${message}
    </div>
  </foreignObject>
</svg>`;
}
/**
 * Vercel Serverless Function Handler
 */
async function handler(req, res) {
    // 1. Enable Vercel edge-caching headers immediately
    res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=3600');
    res.setHeader('Content-Type', 'image/svg+xml');
    // 2. Parse username with fallback default
    const { username } = req.query;
    const parsedUsername = (Array.isArray(username) ? username[0] : username || 'eliflali').trim();
    // 3. Retrieve environment GH_TOKEN
    const token = process.env.GH_TOKEN;
    if (!token) {
        const errorSvg = renderErrorSVG('GH_TOKEN Config Error', 'The environment variable <strong>GH_TOKEN</strong> is not configured. Please generate a GitHub Personal Access Token (PAT) with <code>read:user</code> and <code>repo</code> permissions, and configure it under your Vercel Project Settings.');
        return res.status(200).send(errorSvg);
    }
    try {
        // 4. Fetch Stats
        const stats = await fetchUserStats(parsedUsername, token);
        // 5. Render SVG response
        const statsSvg = renderStatsSVG(stats);
        return res.status(200).send(statsSvg);
    }
    catch (error) {
        console.error('Error fetching stats:', error);
        const errorMsg = error.message || 'Unknown network error has occurred.';
        const errorSvg = renderErrorSVG('Failed to Fetch Stats', `An error occurred while fetching GitHub profile data for user <strong>${parsedUsername}</strong>.<br/><br/><code>${errorMsg}</code>`);
        return res.status(200).send(errorSvg);
    }
}
