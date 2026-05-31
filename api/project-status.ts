import type { VercelRequest, VercelResponse } from '@vercel/node';

interface ProjectMetrics {
  name: string;
  status: string;
  platform: string;
  uptime: string;
  version: string;
}

/**
 * Renders the Live Project Metrics SVG card
 */
function renderProjectStatusSVG(metrics: ProjectMetrics): string {
  const { name, status, platform, uptime, version } = metrics;
  
  const cardWidth = 495;
  const cardHeight = 195;

  // Determine status color & pulse rates based on status
  const normalizedStatus = status.trim().toLowerCase();
  let statusColor = '#3fb950'; // standard live green
  let statusLabelColor = '#56d364';
  let pulseDuration = '2s';

  if (normalizedStatus === 'maintenance' || normalizedStatus === 'beta' || normalizedStatus === 'paused') {
    statusColor = '#d4a373'; // amber
    statusLabelColor = '#e3b341';
    pulseDuration = '3s';
  } else if (normalizedStatus === 'down' || normalizedStatus === 'critical' || normalizedStatus === 'offline') {
    statusColor = '#f85149'; // red
    statusLabelColor = '#ff7b72';
    pulseDuration = '1s';
  }

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
    .status-badge {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
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
      font-size: 15px;
      fill: #f0f6fc;
      font-weight: 700;
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
    .pulse {
      animation: pulseAnimation ${pulseDuration} infinite ease-in-out;
      transform-origin: center;
    }
    @keyframes pulseAnimation {
      0% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 0.9; transform: scale(1.4); }
      100% { opacity: 0.3; transform: scale(1); }
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

  <!-- Header Section -->
  <g class="fade-in" style="animation-delay: 0.1s;">
    <!-- Project Name Title -->
    <text x="22" y="36" class="title">${name} Product Status</text>
    
    <!-- Dynamic Status Light Indicator -->
    <circle cx="410" cy="31" r="5" fill="${statusColor}" />
    <circle cx="410" cy="31" r="8" fill="${statusColor}" class="pulse" />
    <text x="424" y="35" class="status-badge" fill="${statusLabelColor}">${status.toUpperCase()}</text>
  </g>

  <!-- Live Metrics 2x2 Grid -->
  <!-- Panel 1: Deployment Platform -->
  <g class="fade-in" style="animation-delay: 0.2s;">
    <rect x="22" y="60" width="218" height="52" rx="8" class="card-panel" />
    <!-- Platform Icon (Brackets/Code) -->
    <svg x="37" y="78" width="16" height="16" viewBox="0 0 16 16" fill="#58a6ff">
      <path fill-rule="evenodd" d="M4.72 3.22a.75.75 0 011.06 1.06L2.06 8l3.72 3.72a.75.75 0 11-1.06 1.06L.47 8.53a.75.75 0 010-1.06l4.25-4.25zm6.56 0a.75.75 0 00-1.06 1.06L13.94 8l-3.72 3.72a.75.75 0 101.06 1.06l4.25-4.25a.75.75 0 000-1.06l-4.25-4.25z" />
    </svg>
    <text x="62" y="77" class="stat-label">Platform</text>
    <text x="62" y="96" class="stat-value">${platform}</text>
  </g>

  <!-- Panel 2: Live Uptime / Health -->
  <g class="fade-in" style="animation-delay: 0.3s;">
    <rect x="255" y="60" width="218" height="52" rx="8" class="card-panel" />
    <!-- Uptime Icon (Heartbeat / Activity) -->
    <svg x="270" y="78" width="16" height="16" viewBox="0 0 16 16" fill="#3fb950">
      <path fill-rule="evenodd" d="M1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0zM0 8a8 8 0 1116 0A8 8 0 010 8zm9.5-2.5a1.5 1.5 0 10-3 0V8h-1.5a.75.75 0 000 1.5h2.25A.75.75 0 008 8.75v-3.25a.75.75 0 011.5 0z" />
    </svg>
    <text x="295" y="77" class="stat-label">System Uptime</text>
    <text x="295" y="96" class="stat-value">${uptime}</text>
  </g>

  <!-- Panel 3: Uptime Spark / Ping -->
  <g class="fade-in" style="animation-delay: 0.4s;">
    <rect x="22" y="122" width="218" height="52" rx="8" class="card-panel" />
    <!-- Health Check Icon (Server) -->
    <svg x="37" y="140" width="16" height="16" viewBox="0 0 16 16" fill="#bc8cff">
      <path fill-rule="evenodd" d="M8 2a5.978 5.978 0 00-4.243 1.757 1 1 0 11-1.414-1.414A7.97 7.97 0 018 0c2.21 0 4.21.896 5.657 2.343a1 1 0 11-1.414 1.414A5.978 5.978 0 008 2zM3.757 6.243a1 1 0 10-1.414-1.414A5.978 5.978 0 001 8c0 1.657.672 3.156 1.757 4.243a1 1 0 101.414-1.414A3.985 3.985 0 013 8c0-1.104.448-2.104 1.157-2.813L3.757 6.243zm8.486-1.414a1 1 0 10-1.414 1.414A3.985 3.985 0 0112 8c0 1.104-.448 2.104-1.157 2.813a1 1 0 101.414 1.414A5.978 5.978 0 0015 8c0-1.657-.672-3.156-1.757-4.243zm-2.486 2.486a1 1 0 10-1.414-1.414.997.997 0 000 1.414zm-3.514-1.414a1 1 0 000 1.414.997.997 0 001.414 0 1 1 0 00-1.414-1.414zM8 4a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
    <text x="62" y="139" class="stat-label">Environment</text>
    <text x="62" y="158" class="stat-value">Production</text>
  </g>

  <!-- Panel 4: Version / Release Tag -->
  <g class="fade-in" style="animation-delay: 0.5s;">
    <rect x="255" y="122" width="218" height="52" rx="8" class="card-panel" />
    <!-- Tag Icon -->
    <svg x="270" y="140" width="16" height="16" viewBox="0 0 16 16" fill="#f1e05a">
      <path fill-rule="evenodd" d="M2.5 7.75a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5zm.75 8.25a2.25 2.25 0 01-2.25-2.25v-8.5A2.25 2.25 0 013.25 1h9.5A2.25 2.25 0 0115 3.25v8.5a2.25 2.25 0 01-2.25 2.25h-9.5zm9.5-13.5H3.25A.75.75 0 002.5 3.25v2.25h11v-2.25a.75.75 0 00-.75-.75z" />
    </svg>
    <text x="295" y="139" class="stat-label">Version</text>
    <text x="295" y="158" class="stat-value">${version}</text>
  </g>
</svg>`;
}

/**
 * Vercel Serverless Function Handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Enable Vercel edge-caching headers immediately
  res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=3600');
  res.setHeader('Content-Type', 'image/svg+xml');

  // 2. Parse query parameters with polished defaults
  const { name, status, platform, uptime, version } = req.query;

  const metrics: ProjectMetrics = {
    name: (Array.isArray(name) ? name[0] : name || 'Doku').trim(),
    status: (Array.isArray(status) ? status[0] : status || 'Live').trim(),
    platform: (Array.isArray(platform) ? platform[0] : platform || 'iOS / Next.js').trim(),
    uptime: (Array.isArray(uptime) ? uptime[0] : uptime || '99.98%').trim(),
    version: (Array.isArray(version) ? version[0] : version || 'v1.2.0').trim(),
  };

  // 3. Render and send SVG response
  const projectStatusSvg = renderProjectStatusSVG(metrics);
  return res.status(200).send(projectStatusSvg);
}
