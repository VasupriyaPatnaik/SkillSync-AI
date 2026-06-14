const axios = require("axios");
const cheerio = require("cheerio");

async function fetchCodechef(username) {
  const res = await axios.get(
    `https://www.codechef.com/users/${username}`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "en-US,en;q=0.9",
      },
    }
  );

  const $ = cheerio.load(res.data);

  const pageTitle = $("meta[property='og:title']").attr("content") || "";
  const profileName =
    $(".user-details-container header h1").first().text().trim() ||
    $(".user-details h1").first().text().trim() ||
    pageTitle.replace(/\s*\|\s*CodeChef.*$/i, "").trim() ||
    username;


  const rating = parseInt($(".rating-number").text()) || 0;
  const starsText = $(".rating").first().text();
  const stars = starsText ? starsText.length : 0;
  const contestsParticipated =
    parseInt($(".contest-participated-count b").text()) || 0;


  let totalProblemsSolved = 0;
  $("h3").each((_, el) => {
    const text = $(el).text();
    if (text.includes("Total Problems Solved")) {
      totalProblemsSolved = parseInt(text.match(/\d+/)?.[0]) || 0;
    }
  });


  const globalRank =
    parseInt($(".rating-ranks ul li:first-child strong").text()) || 0;

  const countryRank =
    parseInt($(".rating-ranks ul li:nth-child(2) strong").text()) || 0;

  return {
    name: profileName,
    rating,
    stars,
    contestsParticipated,
    totalProblemsSolved,
    globalRank,
    countryRank,
  };
}

module.exports = { fetchCodechef };
