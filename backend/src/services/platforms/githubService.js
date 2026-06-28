const axios = require("axios");
const logger = require("../../utils/logger");

async function fetchGithub(username) {
  const headers = {
    "User-Agent": "Mozilla/5.0",
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  };

  try {
    const response = await axios.get(
  `https://api.github.com/users/${username}`,
  {
    headers,
    validateStatus: () => true,
  }
);

if (response.status !== 200) {
  throw new Error(
    `GitHub API ${response.status}: ${response.data.message}`
  );
}

const user = response.data;

    const { data: repos } = await axios.get(
      `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
      { headers, validateStatus: (status) => status < 500 }
    );

    if (!Array.isArray(repos)) {
      logger.warn(`No repos found for user ${username}`);
      return {
        name: user.name || "",
        followers: user.followers || 0,
        publicRepos: 0,
        totalStars: 0,
        totalForks: 0,
        totalPRs: 0,
        totalIssues: 0,
        topLanguages: [],
        totalCommits: 0,
        avgCommitsPerRepo: 0,
        activeRepositories: 0,
        repositoriesWithREADME: 0,
        lastCommitDate: null,
        commitFrequency: "low",
        projectComplexity: 0,
        documentationQuality: 0,
        collaborationScore: 0,
        contributionConsistency: 0,
      };
    }

    logger.info(`Analyzing ${repos.length} repositories for ${username}...`);

    let totalStars = 0;
    let totalForks = 0;
    let totalCommits = 0;
    let repositoriesWithREADME = 0;
    let lastCommitDate = null;
    const languageMap = {};
    const commitFrequencies = [];

    // Analyze each repository
    for (const repo of repos) {
      totalStars += repo.stargazers_count || 0;
      totalForks += repo.forks_count || 0;

      if (repo.language) {
        languageMap[repo.language] = (languageMap[repo.language] || 0) + 1;
      }

      // Check for README
      if (repo.description || repo.readme_url) {
        repositoriesWithREADME++;
      }

      // Fetch commit data for this repo (skip forked repos to reduce API calls)
      if (!repo.fork) {
        try {
          // Use a more reliable endpoint - get commits from the repo's commit history
          const recentCommits = await axios.get(
            `https://api.github.com/repos/${username}/${repo.name}/commits?since=${new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()}&per_page=100`,
            { headers, validateStatus: (status) => status < 500 } // Don't throw on 4xx errors
          );

          if (recentCommits.status === 200 && recentCommits.data && Array.isArray(recentCommits.data)) {
            const commitCount = recentCommits.data.length || 0;
            totalCommits += commitCount;
            commitFrequencies.push(commitCount);

            // Track last commit
            if (recentCommits.data.length > 0) {
              const commitDate = new Date(recentCommits.data[0].commit.author.date);
              if (!lastCommitDate || commitDate > lastCommitDate) {
                lastCommitDate = commitDate;
              }
            }
          } else if (recentCommits.status === 409) {
            // 409 Conflict - likely empty repo, skip it
            logger.warn(`Empty or unavailable repo: ${repo.name} (409 Conflict)`);
            commitFrequencies.push(0);
          } else {
            logger.warn(`Could not fetch commits for ${repo.name}: Status ${recentCommits.status}`);
            commitFrequencies.push(0);
          }
        } catch (err) {
          // Skip if commit fetch fails for a repo
          logger.warn(`Error fetching commits for ${repo.name}: ${err.message}`);
          commitFrequencies.push(0);
        }
      } else {
        // For forked repos, add 0 commits to maintain repo count
        commitFrequencies.push(0);
      }
    }

    // Calculate metrics
    const avgCommitsPerRepo = commitFrequencies.length > 0 ? totalCommits / commitFrequencies.length : 0;
    
    // Determine commit frequency (based on avg commits across all repos)
    let commitFrequency = "low";
    if (avgCommitsPerRepo > 50) commitFrequency = "very-high";
    else if (avgCommitsPerRepo > 20) commitFrequency = "high";
    else if (avgCommitsPerRepo > 5) commitFrequency = "moderate";

    // Calculate active repositories (repos with commits in last year)
    const activeRepositories = commitFrequencies.filter(c => c > 0).length;

    // Calculate project complexity (based on language diversity and fork count)
    const languageCount = Object.keys(languageMap).length;
    const avgForksPerRepo = repos.length > 0 ? totalForks / repos.length : 0;
    const projectComplexity = Math.min(100, (languageCount * 10) + (avgForksPerRepo * 5));

    // Documentation quality (README presence)
    const documentationQuality = repos.length > 0 ? (repositoriesWithREADME / repos.length) * 100 : 0;

    // Collaboration score (forks + PRs contribution)
    const { data: prData } = await axios.get(
      `https://api.github.com/search/issues?q=author:${username}+type:pr`,
      { headers, validateStatus: (status) => status < 500 }
    );

    const totalPRsCount = prData.total_count || 0;
    const avgForksPerRepo2 = repos.length > 0 ? totalForks / repos.length : 0;
    const collaborationScore = Math.min(100, (avgForksPerRepo2 * 5) + (totalPRsCount / 10));

    // Contribution consistency (spread of commits)
    let contributionConsistency = 0;
    if (commitFrequencies.length > 0 && commitFrequencies.some(c => c > 0)) {
      const nonZeroCommits = commitFrequencies.filter(c => c > 0);
      const avgCommit = nonZeroCommits.reduce((a, b) => a + b, 0) / nonZeroCommits.length;
      const variance = nonZeroCommits.reduce((sum, freq) => sum + Math.pow(freq - avgCommit, 2), 0) / nonZeroCommits.length;
      const stdDev = Math.sqrt(variance);
      // Lower standard deviation = more consistent contributions
      contributionConsistency = Math.min(100, 100 - ((stdDev / (avgCommit || 1)) * 50));
    }

    const { data: issueData } = await axios.get(
      `https://api.github.com/search/issues?q=author:${username}+type:issue`,
      { headers, validateStatus: (status) => status < 500 }
    );

    const sortedLanguages = Object.entries(languageMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([lang]) => lang);

    logger.info(`GitHub analysis complete for ${username}:`);
    logger.info(`Total Commits: ${totalCommits}, Active Repos: ${activeRepositories}/${repos.filter(r => !r.fork).length}`);
    logger.info(`Commit Frequency: ${commitFrequency}, Documentation Quality: ${documentationQuality.toFixed(0)}%`);

    return {
      name: user.name || "",
      followers: user.followers || 0,
      publicRepos: user.public_repos || 0,
      totalStars,
      totalForks,
      totalPRs: totalPRsCount || 0,
      totalIssues: issueData.total_count || 0,
      topLanguages: sortedLanguages,
      // Enhanced metrics
      totalCommits: Math.round(totalCommits),
      avgCommitsPerRepo: commitFrequencies.length > 0 ? Math.round((totalCommits / commitFrequencies.length) * 10) / 10 : 0,
      activeRepositories,
      repositoriesWithREADME,
      lastCommitDate,
      commitFrequency,
      projectComplexity: Math.round(projectComplexity),
      documentationQuality: Math.round(documentationQuality),
      collaborationScore: Math.round(collaborationScore),
      contributionConsistency: Math.round(contributionConsistency),
    };
  } catch (err) {
    logger.error(`GitHub fetch error for ${username}: ${err.message}`);
    throw new Error(`Failed to fetch GitHub data: ${err.message}`);
  }
}

module.exports = { fetchGithub };
