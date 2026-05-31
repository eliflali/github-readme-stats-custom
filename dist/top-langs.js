"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const axios_1 = __importDefault(require("axios"));
const GITHUB_GRAPHQL_API = 'https://api.github.com/graphql';
/**
 * Fetches user languages from the GitHub GraphQL API v4
 */
async function fetchUserLanguages(username, token) {
    const query = `
    query userLanguages($login: String!) {
      user(login: $login) {
        name
        login
        repositories(ownerAffiliations: OWNER, first: 100, isFork: false) {
          nodes {
            languages(first: 5, orderBy: {field: SIZE, direction: DESC}) {
              edges {
                size
                node {
                  name
                  color
                }
              }
            }
          }
        }
      }
    }
  `;
    const response = await axios_1.default.post(GITHUB_GRAPHQL_API, {
        query,
        variables: { login: username },
    }, {
        headers: {
            Authorization: `bearer ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'github-readme-stats-custom',
        },
        timeout: 10000,
    });
    if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
    }
    const user = response.data.data?.user;
    if (!user) {
        throw new Error(`User "${username}" not found.`);
    }
    const name = user.name || user.login || username;
    const login = user.login;
    const repos = user.repositories?.nodes || [];
    const languageMap = {};
    let totalBytes = 0;
    repos.forEach((repo) => {
        const edges = repo.languages?.edges || [];
        edges.forEach((edge) => {
            const { size, node } = edge;
            const langName = node.name;
            const color = node.color || '#8b949e';
            if (languageMap[langName]) {
                languageMap[langName].size += size;
            }
            else {
                languageMap[langName] = { size, color };
            }
            totalBytes += size;
        });
    });
    const languages = Object.entries(languageMap)
        .map(([langName, { size, color }]) => ({
        name: langName,
        size,
        color,
        percentage: totalBytes > 0 ? (size / totalBytes) * 100 : 0,
    }))
        .sort((a, b) => b.size - a.size);
    return {
        name,
        login,
        languages,
        totalBytes,
    };
}
/**
 * Renders the top languages SVG card
 */
function renderTopLangsSVG(data) {
    const { name, languages, totalBytes } = data;
    // Cohesive styling properties
    const cardWidth = 495;
    const cardHeight = 195;
    // Select top 5 languages, group everything else as "Others"
    const topLangs = languages.slice(0, 5);
    const remainingLangs = languages.slice(5);
    if (remainingLangs.length > 0 && totalBytes > 0) {
        const othersSize = remainingLangs.reduce((acc, curr) => acc + curr.size, 0);
        const othersPercentage = (othersSize / totalBytes) * 100;
        topLangs.push({
            name: 'Others',
            size: othersSize,
            color: '#444c56',
            percentage: othersPercentage,
        });
    }
    // Construct the segmented progress bar
    let currentX = 22;
    const barWidth = 451; // 495 - (22 * 2)
    const barSegments = [];
    topLangs.forEach((lang) => {
        if (lang.percentage <= 0)
            return;
        const segmentWidth = (lang.percentage / 100) * barWidth;
        barSegments.push(`<rect x="${currentX}" y="60" width="${segmentWidth}" height="10" fill="${lang.color}" />`);
        currentX += segmentWidth;
    });
    // Fallback for no languages
    if (topLangs.length === 0) {
        barSegments.push(`<rect x="22" y="60" width="${barWidth}" height="10" fill="#444c56" />`);
    }
    // Legend grid items (2 columns, 3 rows max)
    const legendItems = [];
    topLangs.forEach((lang, index) => {
        const isLeftColumn = index % 2 === 0;
        const colX = isLeftColumn ? 22 : 255;
        const rowMultiplier = Math.floor(index / 2);
        const rowY = 98 + rowMultiplier * 26;
        legendItems.push(`
    <g class="fade-in" style="animation-delay: ${0.2 + index * 0.1}s;">
      <circle cx="${colX + 5}" cy="${rowY - 5}" r="5" fill="${lang.color}" />
      <text x="${colX + 18}" y="${rowY}" class="lang-name">${lang.name}</text>
      <text x="${colX + 150}" y="${rowY}" class="lang-percent">${lang.percentage.toFixed(1)}%</text>
    </g>
    `);
    });
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
    <clipPath id="barClip">
      <rect x="22" y="60" width="451" height="10" rx="5" />
    </clipPath>
  </defs>

  <style>
    .title {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 16px;
      font-weight: 700;
      fill: #f0f6fc;
    }
    .lang-name {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 13px;
      font-weight: 600;
      fill: #c9d1d9;
    }
    .lang-percent {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 13px;
      font-weight: 700;
      fill: #8b949e;
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

  <!-- Header Title -->
  <text x="22" y="36" class="title fade-in" style="animation-delay: 0.1s;">${name}'s Top Languages</text>

  <!-- Segmented Distribution Bar -->
  <g clip-path="url(#barClip)" class="fade-in" style="animation-delay: 0.15s;">
    ${barSegments.join('\n    ')}
  </g>

  <!-- Legend Grid -->
  ${legendItems.join('\n  ')}
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
        // 4. Fetch languages
        const data = await fetchUserLanguages(parsedUsername, token);
        // 5. Render SVG response
        const topLangsSvg = renderTopLangsSVG(data);
        return res.status(200).send(topLangsSvg);
    }
    catch (error) {
        console.error('Error fetching languages:', error);
        const errorMsg = error.message || 'Unknown network error has occurred.';
        const errorSvg = renderErrorSVG('Failed to Fetch Languages', `An error occurred while fetching GitHub language data for user <strong>${parsedUsername}</strong>.<br/><br/><code>${errorMsg}</code>`);
        return res.status(200).send(errorSvg);
    }
}
