# ⚡ Premium GitHub Readme Stats Custom

A highly customizable, high-performance, and visually stunning GitHub profile statistics card generator designed to be embedded directly into your GitHub Profile README. Built with **TypeScript**, **GitHub GraphQL API (v4)**, and optimized for instant deployment as a **Vercel Serverless Function**.

Unlike generic stats generators, this custom version features a sleek dark mode design, base64-encoded avatar rendering, dynamic multi-year commit contributions, and a resilient styled-SVG error card generator.

---

## 🎨 Previews

### ✨ Successful Stats Card
![Successful Stats Card](mock-stats.svg)

### ⚠️ Graceful Error Handling Card
![Error Card](mock-error.svg)

---

## 🚀 Key Features

*   **⚡ Blazing Fast & Cached**: Implements Vercel Edge Cache headers (`Cache-Control: public, max-age=1800, s-maxage=3600`) to guarantee high-speed card loading and prevent rate-limiting from the GitHub API.
*   **📊 Dynamic Multi-Year Commit Fetching**: Queries all contribution years dynamically and sums them, ensuring your *entire* commit history is displayed accurately (unlike standard REST API calls that are often capped or restricted to the current year).
*   **👤 Integrated Profile Avatar**: Fetches your profile avatar and dynamically base64-encodes it into the SVG to avoid blocked external content warnings on GitHub.
*   **✨ Premium Glassmorphic Design**: Sleek dark aesthetic with clean gradients (`#58a6ff` to `#bc8cff`), elegant icons, micro-animations, and dynamic SVG hover transitions.
*   **🛡️ Robust SVG Error Renderers**: If anything fails (e.g., rate limits, invalid user, or missing token), it serves a custom-styled SVG card containing the error message instead of a broken image link, keeping your profile clean.
*   **🛠️ Written in TypeScript**: Strongly typed for easy modification, extension, and maintenance.

---

## 🛠️ Technology Stack

- **Runtime & Deployment**: [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **API**: [GitHub GraphQL API v4](https://docs.github.com/en/graphql)
- **HTTP Client**: [Axios](https://axios-http.com/)

---

## 🚀 Quick Start & Deployment

Deploying your custom stats generator to Vercel takes under 3 minutes.

### 1. Generate a GitHub Personal Access Token (PAT)
To query the GraphQL API, you need a token:
1. Go to your GitHub **Settings** ➔ **Developer settings** ➔ **Personal access tokens** ➔ **Tokens (classic)**.
2. Click **Generate new token (classic)**.
3. Select the `read:user` and `repo` scopes.
4. Generate the token and copy it immediately.

### 2. Deploy to Vercel
You can deploy directly via the Vercel CLI or by linking your cloned repository on the Vercel Dashboard.

#### Option A: Deployment via Vercel CLI
```bash
# Install Vercel CLI globally if you haven't already
npm install -g vercel

# Log in and deploy from your project root
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

## 📦 Usage

Once deployed, you can embed the SVG directly in your GitHub profile `README.md` or any HTML page.

### Markdown Syntax
```markdown
[![GitHub Stats](https://<your-vercel-deployment-subdomain>.vercel.app/api/stats?username=your_github_username)](https://github.com/your_github_username)
```

### HTML Syntax
```html
<a href="https://github.com/your_github_username">
  <img src="https://<your-vercel-deployment-subdomain>.vercel.app/api/stats?username=your_github_username" alt="GitHub Stats" width="495" height="195" />
</a>
```

### Parameters
| Query Parameter | Required | Description | Default |
| :--- | :--- | :--- | :--- |
| `username` | **Yes** | The GitHub username you want to fetch stats for. | `eliflali` |

---

## 💻 Local Development

To run, debug, and customize the card generator on your local machine:

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root of the project:
```env
GH_TOKEN=your_personal_access_token_here
```

### 3. Run Development Server
Start the local Vercel dev environment:
```bash
npm run vercel-dev
```
The server will boot up (usually on `http://localhost:3000`). You can view your local stats card by opening:
```
http://localhost:3000/api/stats?username=your_github_username
```

---

## 🎨 Customizing the Card Design

Want to change colors, fonts, or layout? You can easily customize the SVG template directly in the codebase:

- **Style & Fonts**: Edit the `<style>` block in [api/stats.ts](file:///Users/eliflale/Desktop/github-readme-stats-custom/api/stats.ts#L173-L217). You can adjust font weights, hover transitions, letter-spacing, or add custom keyframe animations.
- **Color Gradients**: Modify the gradient definitions in [api/stats.ts](file:///Users/eliflale/Desktop/github-readme-stats-custom/api/stats.ts#L159-L171) to match your personal website or profile theme.
- **Card Panels**: The card features a grid of four metrics (Commits, Stars, PRs, Issues). You can customize or rearrange these panels starting at [api/stats.ts](file:///Users/eliflale/Desktop/github-readme-stats-custom/api/stats.ts#L237).

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE). Feel free to customize and redistribute it as you wish!