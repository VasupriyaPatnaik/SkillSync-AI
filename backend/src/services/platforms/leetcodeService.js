const axios = require("axios");
const logger = require("../../utils/logger");

async function fetchLeetcode(username) {
  if (!username) {
    throw new Error("LeetCode username is required");
  }

  const headers = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0",
  };

  try {
    // ---------------- PROFILE + SUBMISSIONS ----------------
    const profileQuery = {
      query: `
        query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            username
            profile {
              realName
              ranking
              reputation
            }
            submitStats {
              acSubmissionNum {
                difficulty
                count
              }
            }
          }
        }
      `,
      variables: { username },
    };

    const profileRes = await axios.post(
      "https://leetcode.com/graphql",
      profileQuery,
      { headers, timeout: 15000 }
    );

    const user = profileRes.data?.data?.matchedUser;

    if (!user) {
      throw new Error("LeetCode user not found");
    }

    let easy = 0,
      medium = 0,
      hard = 0;

    user.submitStats?.acSubmissionNum?.forEach((item) => {
      if (item.difficulty === "Easy") easy = item.count;
      if (item.difficulty === "Medium") medium = item.count;
      if (item.difficulty === "Hard") hard = item.count;
    });

    // ---------------- CONTEST DATA ----------------
    const contestQuery = {
      query: `
        query getUserContestRanking($username: String!) {
          userContestRanking(username: $username) {
            rating
            attendedContestsCount
            globalRanking
          }
        }
      `,
      variables: { username },
    };

    const contestRes = await axios.post(
      "https://leetcode.com/graphql",
      contestQuery,
      { headers, timeout: 15000 }
    );

    const contestData = contestRes.data?.data?.userContestRanking;

    const profileName = user.profile?.realName || user.username || username;

    return {
      name: profileName,
      totalSolved: easy + medium + hard,
      easySolved: easy,
      mediumSolved: medium,
      hardSolved: hard,

      ranking: user.profile?.ranking || 0,
      reputation: user.profile?.reputation || 0,

      contestRating: contestData?.rating || 0,
      contestsAttended: contestData?.attendedContestsCount || 0,
      contestGlobalRank: contestData?.globalRanking || 0,
    };
  } catch (err) {
    logger.error("LeetCode fetch error", {
      code: err.code,
      status: err.response?.status,
      message: err.message,
    });
    throw new Error("Failed to fetch LeetCode profile");
  }
}

module.exports = { fetchLeetcode };
