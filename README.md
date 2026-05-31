# ⚡ Premium GitHub Readme Stats & Developer Analytics Suite

A highly customizable, high-performance, and visually stunning developer statistics and analytics suite designed to be embedded directly into your GitHub Profile README. Built with **TypeScript**, **GitHub GraphQL API (v4)**, and optimized for instant deployment as a **Vercel Serverless Function** with edge-caching capabilities.

Unlike generic stats generators, this custom version features a cohesive, premium glassmorphic dark theme, Base64 profile avatar rendering, dynamic multi-year commit contributions, and timezone-aware productivity tracking.

---

## 🎨 Interactive Live Dashboard

Here is a 2x2 preview of the entire suite rendered in a cohesive, minimalist dark-mode layout:

<p align="center">
  <table border="0" cellspacing="10" cellpadding="0">
    <tr>
      <td valign="top" width="50%">
        <h4 align="center">📊 1. Core Profile Statistics</h4>
        <a href="https://github.com/eliflali">
          <img src="mock-stats.svg" width="495" alt="Core Profile Statistics Card" style="border-radius: 10px;" />
        </a>
      </td>
      <td valign="top" width="50%">
        <h4 align="center">🎨 2. Top Languages Breakdown</h4>
        <a href="https://github.com/eliflali">
          <img src="mock-top-langs.svg" width="495" alt="Top Languages Card" style="border-radius: 10px;" />
        </a>
      </td>
    </tr>
    <tr>
      <td valign="top" width="50%">
        <h4 align="center">🦉 3. Timezone-Aware Productive Hours</h4>
        <a href="https://github.com/eliflali">
          <img src="mock-productive-hours.svg" width="495" alt="Productive Hours Card" style="border-radius: 10px;" />
        </a>
      </td>
      <td valign="top" width="50%">
        <h4 align="center">🚀 4. Live SaaS/Project Status Monitor</h4>
        <a href="https://github.com/eliflali">
          <img src="mock-project-status.svg" width="495" alt="Project Status Card" style="border-radius: 10px;" />
        </a>
      </td>
    </tr>
  </table>
</p>

---

## ⚙️ Technical Architecture Overview

This suite utilizes a serverless architecture designed for speed, cache efficiency, and extreme customizability:

*   **⚡ Edge-Caching Layer**: Every endpoint response implements strict Vercel Edge caching via `Cache-Control: public, max-age=1800, s-maxage=3600` headers. This speeds up rendering times on profile loads and prevents hitting GitHub API rate limits.
*   **📡 GraphQL API v4 Integration**: Leverages highly optimized GraphQL single-requests to query deep repository data.
    *   **Main Stats**: Queries all contribution years and sums commits, avoiding the capped lists of REST APIs.
    *   **Languages**: Traverses top-5 languages across all owned repositories to aggregate absolute byte sizes and percentages.
    *   **Productivity**: Queries the last 100 commits across all repos via GraphQL search filter.
*   **👤 Base64 Avatar Encoding**: Fetches the user's GitHub avatar on the fly, translates it into Base64, and inline-embeds it into the SVG to dodge blocked external resource warnings on GitHub markdown blocks.
*   **🕒 Dynamic Timezone Shifter**: Productive hours analyzes commits by shifting UTC timestamps in milliseconds using a configurable timezone URL query parameter offset (e.g. `timezone=2` for GMT+2).
*   **🛡️ Resilient SVG Error Cards**: Custom `<foreignObject>` templates gracefully capture database/GitHub errors (like missing tokens or invalid users) and render them directly into a beautiful warning-styled SVG card rather than a broken image icon.

---

## 📖 API Reference & Endpoint Options

Once deployed to Vercel, you can query four serverless endpoints under `/api/...` to generate your cards:

### 1. Main Profile Stats
**Endpoint**: `/api/stats`  
Returns your core profile metrics.

| Query Parameter | Type | Required | Description | Default |
| :--- | :--- | :--- | :--- | :--- |
| `username` | `string` | **Yes** | The GitHub username to query. | `eliflali` |

**Example Markdown**:
```markdown
![My Core Stats](https://<your-vercel-domain>.vercel.app/api/stats?username=your_username)
```

---

### 2. Top Languages Breakdown
**Endpoint**: `/api/top-langs`  
Aggregates absolute language byte sizes and calculates percentages for your top 5 languages.

| Query Parameter | Type | Required | Description | Default |
| :--- | :--- | :--- | :--- | :--- |
| `username` | `string` | **Yes** | The GitHub username to query. | `eliflali` |

**Example Markdown**:
```markdown
![My Top Languages](https://<your-vercel-domain>.vercel.app/api/top-langs?username=your_username)
```

---

### 3. Timezone-Aware Productive Hours
**Endpoint**: `/api/productive-hours`  
Analyzes commit timing across four 6-hour blocks: Morning, Afternoon, Evening, and Night Owl.

| Query Parameter | Type | Required | Description | Default |
| :--- | :--- | :--- | :--- | :--- |
| `username` | `string` | **Yes** | The GitHub username to query. | `eliflali` |
| `timezone` | `number` | No | Numeric hour offset relative to UTC (e.g. `2` or `-5`). | `0` (UTC) |

**Example Markdown**:
```markdown
![My Productive Hours](https://<your-vercel-domain>.vercel.app/api/productive-hours?username=your_username&timezone=2)
```

---

### 4. SaaS & Live Product Status Monitor
**Endpoint**: `/api/project-status`  
Generates a dynamic status badge representing SaaS platform metrics, uptime, and versions.

| Query Parameter | Type | Required | Description | Default |
| :--- | :--- | :--- | :--- | :--- |
| `name` | `string` | No | Name of the project/SaaS product. | `Doku` |
| `status` | `string` | No | Status state (`Live` 🟢, `Beta`/`Maintenance` 🟡, `Down` 🔴). | `Live` |
| `platform` | `string` | No | Technology stack or device platform. | `iOS / Next.js` |
| `uptime` | `string` | No | System uptime percentage. | `99.98%` |
| `version` | `string` | No | Current semantic release version. | `v1.2.0` |

**Example Markdown**:
```markdown
![Project Status](https://<your-vercel-domain>.vercel.app/api/project-status?name=Doku&status=Live&platform=iOS%20/%20Next.js&uptime=99.98%25&version=v1.2.0)
```

---

## 🚀 Quick Start & Deployment

### 1. Generate a GitHub Personal Access Token (PAT)
To query GitHub's GraphQL API, you need a Personal Access Token (PAT):
1. Go to your GitHub **Settings** ➔ **Developer settings** ➔ **Personal access tokens** ➔ **Tokens (classic)**.
2. Click **Generate new token (classic)**.
3. Select the `read:user` and `repo` scopes.
4. Copy the generated token string immediately.

### 2. Deploy to Vercel
You can deploy directly via the Vercel CLI or by linking your repository on the Vercel Dashboard.

#### Option A: Deployment via Vercel CLI
```bash
# Install Vercel CLI globally
npm install -g vercel

# Log in and deploy from project root
vercel
```

#### Option B: Deploy via Vercel Web Dashboard
1. Push this repository to your personal GitHub account.
2. Go to the [Vercel Dashboard](https://vercel.com/) and click **Add New Project**.
3. Import your repository.
4. In the **Environment Variables** section, add:
   * **Key**: `GH_TOKEN`
   * **Value**: *[Your GitHub PAT copied in Step 1]*
5. Click **Deploy**.

---

## 💻 Local Development & Customization

### 1. Setup
Install project dependencies and configure local environment credentials:
```bash
npm install
```
Create a `.env` file in the root of the project:
```env
GH_TOKEN=your_personal_access_token_here
```

### 2. Start Development Server
Boot up the local Vercel developer runtime:
```bash
npm run vercel-dev
```
Your dev server will load (usually on `http://localhost:3000`). You can view your live local cards immediately:
*   Stats: `http://localhost:3000/api/stats?username=your_username`
*   Langs: `http://localhost:3000/api/top-langs?username=your_username`
*   Hours: `http://localhost:3000/api/productive-hours?username=your_username&timezone=2`
*   Project: `http://localhost:3000/api/project-status?name=Spark&status=Beta`

---

## 🎨 Customizing Design & Branding

All cards leverage inline SVG styles matching the dark core layout. You can customize them directly in the codebase:

*   **Design Gradients & Borders**: Gradients for the backgrounds and glowing borders are defined in the `<linearGradient>` and `<style>` blocks in each card generator file inside the `api/` folder (e.g. [api/stats.ts](file:///Users/eliflale/Desktop/github-readme-stats-custom/api/stats.ts#L159-L217)).
*   **Colors & Ratios**: Change individual language or time-block colors directly in the code definitions of [api/top-langs.ts](file:///Users/eliflale/Desktop/github-readme-stats-custom/api/top-langs.ts) and [api/productive-hours.ts](file:///Users/eliflale/Desktop/github-readme-stats-custom/api/productive-hours.ts).
*   **Custom Panels**: Add, modify, or rearrange layout nodes, SVG icons, and metrics columns using the strongly-typed standard SVG layout sections.

---

## 📝 License

This project is open-source and released under the [MIT License](LICENSE). Feel free to adapt and build your custom metrics blocks!