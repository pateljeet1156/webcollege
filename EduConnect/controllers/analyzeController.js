const { fetchGitHubData, fetchLinkedInData, fetchLeetCodeData } = require('../utils/apiClients');
const { calculateScores, generateInsights } = require('../utils/dataProcessor');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.analyzeProfile = async (req, res, next) => {
  try {
    const { github, linkedin, leetcode } = req.body;
    if (!github || !linkedin || !leetcode) {
      return res.status(400).json({ message: 'Missing required profile information.' });
    }

    // Fetch data from external APIs
    const [githubData, linkedinData, leetcodeData] = await Promise.all([
      fetchGitHubData(github),
      fetchLinkedInData(linkedin),
      fetchLeetCodeData(leetcode)
    ]);

    // Calculate scores
    const scores = calculateScores({
      github: githubData,
      linkedin: linkedinData,
      leetcode: leetcodeData
    });

    // Generate AI insights using OpenAI
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: "You are an expert developer career analyst. Analyze the following developer profile data and provide insights."
      }, {
        role: "user",
        content: JSON.stringify({ githubData, linkedinData, leetcodeData, scores })
      }]
    });

    const aiInsights = {
      strengths: aiResponse.choices[0].message.content.split('\n\n')[0],
      weaknesses: aiResponse.choices[0].message.content.split('\n\n')[1],
      trajectory: aiResponse.choices[0].message.content.split('\n\n')[2]
    };

    res.json({
      overall_score: scores.overallScore,
      github_score: scores.githubScore,
      leetcode_score: scores.leetcodeScore,
      skill_radar_data: scores.skillRadarData,
      activity_timeline_data: scores.activityTimelineData,
      ai_insights: aiInsights,
      action_plan: scores.actionPlan
    });
  } catch (error) {
    next(error);
  }
}; 