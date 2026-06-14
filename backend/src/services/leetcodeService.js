const axios = require("axios");

// Model for persisting LeetCode profile data
const LeetCodeProfile = require("../models/leetcodeData");

async function getLeetCodeData(username) {
  const url = "https://leetcode.com/graphql";

  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          ranking
          reputation
          contributionPoints
        }
        submitStats {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
        }
      }
      userContestRanking(username: $username) {
        rating
        globalRanking
        topPercentage
        attendedContestsCount
      }
    }
  `;

  const response = await axios.post(url, {
    query,
    variables: { username },
  });
  return response.data;
}
async function saveLeetCodeProfile(username, userId) {
  const data = await getLeetCodeData(username);

  const user = data.data.matchedUser;
  const contest = data.data.userContestRanking;

  const ac = user.submitStats.acSubmissionNum;

  const submissions = ac.find(x => x.difficulty === "All");
  const easy = ac.find(x => x.difficulty === "Easy");
  const medium = ac.find(x => x.difficulty === "Medium");
  const hard = ac.find(x => x.difficulty === "Hard");

  if (!userId) {
    throw new Error("userId is required to save LeetCode profile");
  }

  const profile = new LeetCodeProfile({
    userId,
    totalSolved: submissions.count,
    totalSubmissions: submissions,
    easySolved: easy.count,
    mediumSolved: medium.count,
    hardSolved: hard.count,
    ranking: user.profile.ranking,
    contributionPoint: user.profile.contributionPoints,
    reputation: user.profile.reputation,
  });

  await profile.save();

  return { message: "Saved Successfully", profile };
}

module.exports = { getLeetCodeData, saveLeetCodeProfile };
