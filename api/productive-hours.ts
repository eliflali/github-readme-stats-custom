import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const GITHUB_GRAPHQL_API = 'https://api.github.com/graphql';

interface CommitNode {
  committedDate: string;
}

interface SearchResponse {
  search: {
    nodes: CommitNode[];
  };
}

interface UserData {
  name: string;
  login: string;
}

interface ProductiveHoursData {
  name: string;
  login: string;
  timezone: number;
  morning: number;
  afternoon: number;
  evening: number;
  night: number;
  totalCommits: number;
}

/**
 * Fetches user commit history from the GitHub GraphQL API v4
 */
async function fetchUserCommitHours(
  username: string,
  token: string,
  timezoneOffset: number
): Promise<ProductiveHoursData> {
  // First query to get the user's formal name / login
  const userQuery = `
    query userBasics($login: String!) {
      user(login: $login) {
        name
        login
      }
    }
  `;

  // Second query to get commit history using Search API (which returns commits across public and private repos)
  const commitQuery = `
    query commitHistory($queryString: String!) {
      search(query: $queryString, type: COMMITS, first: 100) {
        nodes {
          ... on Commit {
            committedDate
          }
        }
      }
    }
  `;

  // 1. Fetch user basics
  const userRes = await axios.post(
    GITHUB_GRAPHQL_API,
    {
      query: userQuery,
      variables: { login: username },
    },
    {
      headers: {
        Authorization: `bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'github-readme-stats-custom',
      },
      timeout: 10000,
    }
  );

  if (userRes.data.errors) {
    throw new Error(userRes.data.errors[0].message);
  }

  const user = userRes.data.data?.user;
  if (!user) {
    throw new Error(`User "${username}" not found.`);
  }

  const name = user.name || user.login || username;
  const login = user.login;

  // 2. Fetch commits
  const commitRes = await axios.post(
    GITHUB_GRAPHQL_API,
    {
      query: commitQuery,
      variables: { queryString: `author:${username}` },
    },
    {
      headers: {
        Authorization: `bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'github-readme-stats-custom',
      },
      timeout: 12000,
    }
  );

  const commitNodes = commitRes.data.data?.search?.nodes || [];

  let morning = 0;   // 6 AM - 12 PM
  let afternoon = 0; // 12 PM - 6 PM
  let evening = 0;   // 6 PM - 12 AM
  let night = 0;     // 12 AM - 6 AM
  let totalCommits = 0;

  commitNodes.forEach((node: CommitNode) => {
    if (!node.committedDate) return;
    totalCommits++;
    
    // Parse commit date in UTC
    const utcDate = new Date(node.committedDate);
    
    // Shift date by user's timezone offset
    const localDate = new Date(utcDate.getTime() + timezoneOffset * 60 * 60 * 1000);
    const hour = localDate.getUTCHours();

    if (hour >= 6 && hour < 12) {
      morning++;
    } else if (hour >= 12 && hour < 18) {
      afternoon++;
    } else if (hour >= 18 && hour < 24) {
      evening++;
    } else {
      night++;
    }
  });

  return {
    name,
    login,
    timezone: timezoneOffset,
    morning,
    afternoon,
    evening,
    night,
    totalCommits,
  };
}

/**
 * Renders the productive hours SVG card
 */
function renderProductiveHoursSVG(data: ProductiveHoursData): string {
  const { name, timezone, morning, afternoon, evening, night, totalCommits } = data;

  const cardWidth = 495;
  const cardHeight = 195;

  const blocks = [
    { name: 'Morning', range: '6am - 12pm', count: morning, icon: '🌅', color: '#ff9b6a' },
    { name: 'Afternoon', range: '12pm - 6pm', count: afternoon, icon: '☀️', color: '#ffdb6d' },
    { name: 'Evening', range: '6pm - 12am', count: evening, icon: '🌆', color: '#58a6ff' },
    { name: 'Night Owl', range: '12am - 6am', count: night, icon: '🦉', color: '#bc8cff' },
  ];

  // Find peak block
  const maxCount = Math.max(...blocks.map((b) => b.count));

  const rowsHtml: string[] = [];
  const startY = 56;
  const rowHeight = 29;

  blocks.forEach((block, index) => {
    const y = startY + index * rowHeight;
    const isPeak = maxCount > 0 && block.count === maxCount;
    const percentage = totalCommits > 0 ? (block.count / totalCommits) * 100 : 0;
    const fillWidth = totalCommits > 0 ? (block.count / totalCommits) * 160 : 0; // max bar width 160px

    const peakBadge = isPeak
      ? `<g transform="translate(420, ${y + 2})">
          <rect width="52" height="15" rx="4" fill="${block.color}" opacity="0.2" />
          <rect width="52" height="15" rx="4" fill="none" stroke="${block.color}" stroke-width="0.75" />
          <text x="26" y="10" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8px" font-weight="800" fill="${block.color}" text-anchor="middle" letter-spacing="0.5px">PEAK HOUR</text>
         </g>`
      : '';

    rowsHtml.push(`
    <!-- Block: ${block.name} -->
    <g class="fade-in" style="animation-delay: ${0.2 + index * 0.1}s;">
      <text x="22" y="${y + 13}" class="row-label">${block.icon} <tspan font-weight="700" fill="#c9d1d9">${block.name}</tspan> (${block.range})</text>
      
      <!-- Bar Container -->
      <rect x="200" y="${y + 4}" width="160" height="10" rx="5" class="bar-bg" />
      <!-- Bar Fill -->
      <rect x="200" y="${y + 4}" width="${fillWidth}" height="10" rx="5" fill="${block.color}" class="bar-fill" />
      
      <!-- Values -->
      <text x="372" y="${y + 13}" class="row-value" fill="${isPeak ? '#ffffff' : '#8b949e'}" font-weight="${isPeak ? '700' : '500'}">${block.count}</text>
      <text x="395" y="${y + 13}" class="row-percent" fill="${isPeak ? block.color : '#8b949e'}">${percentage.toFixed(0)}%</text>
      
      ${peakBadge}
    </g>
    `);
  });

  const timezoneText = `UTC${timezone >= 0 ? '+' + timezone : timezone}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cardWidth} ${cardHeight}" width="${cardWidth}" height="${cardHeight}">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0f19" />
      <stop offset="100%" stop-color="#0d1117" />
    </linearGradient>
    <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#58a6ff" />
      <stop offset="100%" stop-color="#bc8cff" />
    </linearGradient>
  </defs>

  <style>
    .title {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 16px;
      font-weight: 700;
      fill: #f0f6fc;
    }
    .subtitle {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 10px;
      font-weight: 600;
      fill: #58a6ff;
      letter-spacing: 0.5px;
    }
    .row-label {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 12px;
      fill: #8b949e;
    }
    .row-value {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 12px;
      text-anchor: end;
    }
    .row-percent {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      font-weight: 700;
    }
    .bar-bg {
      fill: #161b22;
      stroke: #30363d;
      stroke-width: 0.5;
    }
    .bar-fill {
      transition: width 0.8s ease-out;
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
  <rect x="0.5" y="0.5" width="${cardWidth - 1}" height="${cardHeight - 1}" rx="10" fill="url(#bgGradient)" stroke="url(#borderGradient)" stroke-width="1.5" />

  <!-- Header Titles -->
  <text x="22" y="34" class="title fade-in" style="animation-delay: 0.1s;">${name}'s Productive Hours</text>
  <text x="473" y="34" text-anchor="end" class="subtitle fade-in" style="animation-delay: 0.12s;">ANALYTIC OFFSET: ${timezoneText}</text>

  <!-- Horizontal Rows -->
  ${rowsHtml.join('\n  ')}
</svg>`;
}

/**
 * Generates an SVG card to gracefully display error details
 */
function renderErrorSVG(title: string, message: string): string {
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
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Enable Vercel edge-caching headers immediately
  res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=3600');
  res.setHeader('Content-Type', 'image/svg+xml');

  // 2. Parse username with fallback default
  const { username, timezone } = req.query;
  const parsedUsername = (Array.isArray(username) ? username[0] : username || 'eliflali').trim();
  
  // Parse timezone offset (defaulting to 0 / UTC)
  let timezoneOffset = 0;
  if (timezone) {
    const parsedOffset = parseFloat(Array.isArray(timezone) ? timezone[0] : timezone);
    if (!isNaN(parsedOffset)) {
      timezoneOffset = parsedOffset;
    }
  }

  // 3. Retrieve environment GH_TOKEN
  const token = process.env.GH_TOKEN;

  if (!token) {
    const errorSvg = renderErrorSVG(
      'GH_TOKEN Config Error',
      'The environment variable <strong>GH_TOKEN</strong> is not configured. Please generate a GitHub Personal Access Token (PAT) with <code>read:user</code> and <code>repo</code> permissions, and configure it under your Vercel Project Settings.'
    );
    return res.status(200).send(errorSvg);
  }

  try {
    // 4. Fetch commit statistics and shift timestamps
    const data = await fetchUserCommitHours(parsedUsername, token, timezoneOffset);
    
    // 5. Render SVG response
    const productiveHoursSvg = renderProductiveHoursSVG(data);
    return res.status(200).send(productiveHoursSvg);
  } catch (error: any) {
    console.error('Error fetching commit history:', error);
    const errorMsg = error.message || 'Unknown network error has occurred.';
    const errorSvg = renderErrorSVG(
      'Failed to Fetch Commits',
      `An error occurred while fetching GitHub commit data for user <strong>${parsedUsername}</strong>.<br/><br/><code>${errorMsg}</code>`
    );
    return res.status(200).send(errorSvg);
  }
}
