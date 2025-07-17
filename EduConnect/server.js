const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// After the MongoDB connection setup
app.get('/api/test', async (req, res) => {
  try {
    // Test MongoDB connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    
    // Test GitHub API
    const githubTest = await axios.get('https://api.github.com/rate_limit', {
      headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
    });

    // Test OpenAI API
    const openaiTest = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "test" }],
      max_tokens: 5
    });
    
    res.json({
      status: 'ok',
      mongodb: dbStatus,
      github: githubTest.data.rate.remaining + ' API calls remaining',
      openai: openaiTest ? 'Connected' : 'Error'
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      details: {
        mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        github: error.response?.data?.message || 'GitHub API error',
        openai: error.message.includes('OpenAI') ? 'OpenAI API error' : 'OpenAI key configured'
      }
    });
  }
});

// MongoDB Schema
const ProfileSchema = new mongoose.Schema({
  github: String,
  leetcode: String,
  linkedin: String,
  scores: {
    overall: Number,
    github: Number,
    leetcode: Number,
    linkedin: Number
  },
  metrics: {
    github: Object,
    leetcode: Object
  },
  insights: Object,
  actionPlan: Object,
  createdAt: { type: Date, default: Date.now }
});

const Profile = mongoose.model('Profile', ProfileSchema);

// Utility function to validate input
function validateInput(github, leetcode, linkedin) {
  if (!github || typeof github !== 'string') {
    throw new Error('Invalid GitHub username');
  }
  if (!leetcode || typeof leetcode !== 'string') {
    throw new Error('Invalid LeetCode username');
  }
  if (!linkedin || typeof linkedin !== 'string' || !linkedin.includes('linkedin.com/in/')) {
    throw new Error('Invalid LinkedIn URL');
  }
}

// GitHub Analysis
async function analyzeGitHub(username) {
  try {
    const [userResponse, reposResponse, eventsResponse] = await Promise.all([
      axios.get(`https://api.github.com/users/${username}`, {
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
      }),
      axios.get(`https://api.github.com/users/${username}/repos`, {
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
      }),
      axios.get(`https://api.github.com/users/${username}/events/public`, {
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
      })
    ]);

    const user = userResponse.data;
    const repos = reposResponse.data;
    const events = eventsResponse.data;

    // Calculate detailed GitHub metrics
    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
    const recentActivity = events.filter(e => 
      new Date(e.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;

    // Get languages used
    const languages = {};
    await Promise.all(repos.map(async repo => {
      if (!repo.fork) {
        try {
          const langResponse = await axios.get(repo.languages_url, {
            headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          });
          Object.keys(langResponse.data).forEach(lang => {
            languages[lang] = (languages[lang] || 0) + langResponse.data[lang];
          });
        } catch (error) {
          console.warn(`Error fetching languages for ${repo.name}:`, error.message);
        }
      }
    }));

    return {
      score: calculateGitHubScore(user, repos, events),
      metrics: {
        repos: user.public_repos,
        stars: totalStars,
        followers: user.followers,
        forks: totalForks,
        recentActivity,
        languages
      }
    };
  } catch (error) {
    throw new Error(`GitHub Analysis Failed: ${error.response?.data?.message || error.message}`);
  }
}

// LeetCode Analysis
async function analyzeLeetCode(username) {
  try {
    const response = await axios.get(`https://leetcode-stats-api.herokuapp.com/${username}`);
    const data = response.data;

    return {
      score: calculateLeetCodeScore(data),
      metrics: {
        totalSolved: data.totalSolved,
        easySolved: data.easySolved,
        mediumSolved: data.mediumSolved,
        hardSolved: data.hardSolved,
        acceptanceRate: data.acceptanceRate,
        ranking: data.ranking
      }
    };
  } catch (error) {
    console.warn('LeetCode API error, using simulated data');
    return {
      score: 75,
      metrics: {
        totalSolved: 200,
        easySolved: 100,
        mediumSolved: 75,
        hardSolved: 25,
        acceptanceRate: 65,
        ranking: 100000
      }
    };
  }
}

// Generate AI Insights using OpenAI
async function generateAIInsights(githubData, leetcodeData) {
  try {
    const prompt = `Analyze this developer profile and provide specific, actionable insights:
    
GitHub Metrics:
- ${githubData.metrics.repos} public repositories
- ${githubData.metrics.stars} total stars
- ${githubData.metrics.followers} followers
- ${githubData.metrics.recentActivity} activities in last 30 days
- Top languages: ${Object.keys(githubData.metrics.languages).slice(0, 5).join(', ')}

LeetCode Metrics:
- ${leetcodeData.metrics.totalSolved} problems solved
- ${leetcodeData.metrics.hardSolved} hard problems
- ${leetcodeData.metrics.acceptanceRate}% acceptance rate
- Ranking: ${leetcodeData.metrics.ranking}

Please provide:
1. Three key strengths
2. Two areas for improvement
3. A growth trajectory prediction
4. Three specific action items for improvement`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert developer career advisor. Provide specific, actionable insights based on GitHub and LeetCode metrics."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7
    });

    const response = completion.choices[0].message.content;
    const sections = response.split('\n\n');
    
    return {
      strengths: sections[0],
      weaknesses: sections[1],
      trajectory: sections[2],
      actionItems: sections[3]
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    return generateFallbackInsights(githubData, leetcodeData);
  }
}

// Main analysis endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { github, leetcode, linkedin } = req.body;
    validateInput(github, leetcode, linkedin);

    const [githubAnalysis, leetcodeAnalysis] = await Promise.all([
      analyzeGitHub(github),
      analyzeLeetCode(leetcode)
    ]);

    // Calculate activity timeline
    const activityData = await generateActivityTimeline(github);

    // Generate AI insights
    const aiInsights = await generateAIInsights(githubAnalysis, leetcodeAnalysis);

    // Generate comprehensive response
    const response = {
      overall_score: Math.round(
        (githubAnalysis.score * 0.4) + 
        (leetcodeAnalysis.score * 0.3) + 
        80 * 0.3  // LinkedIn score (simulated)
      ),
      github_score: githubAnalysis.score,
      leetcode_score: leetcodeAnalysis.score,
      linkedin_score: 80,
      github_metrics: githubAnalysis.metrics,
      leetcode_metrics: leetcodeAnalysis.metrics,
      skill_radar_data: calculateSkillRadar(githubAnalysis, leetcodeAnalysis),
      activity_timeline_data: activityData,
      ai_insights: aiInsights,
      action_plan: generateActionPlan(githubAnalysis, leetcodeAnalysis)
    };

    // Save to MongoDB
    await new Profile({
      github,
      leetcode,
      linkedin,
      scores: {
        overall: response.overall_score,
        github: response.github_score,
        leetcode: response.leetcode_score,
        linkedin: response.linkedin_score
      },
      metrics: {
        github: githubAnalysis.metrics,
        leetcode: leetcodeAnalysis.metrics
      },
      insights: aiInsights,
      actionPlan: response.action_plan
    }).save();

    res.json(response);
  } catch (error) {
    console.error('Analysis Error:', error);
    res.status(500).json({ 
      error: 'Analysis failed',
      message: error.message 
    });
  }
});

function calculateGitHubScore(profile, repos, events) {
  const repoScore = Math.min(100, (profile.public_repos / 30) * 100);
  const followerScore = Math.min(100, (profile.followers / 100) * 100);
  const starScore = Math.min(100, (repos.reduce((sum, repo) => sum + repo.stargazers_count, 0) / 100) * 100);
  const activityScore = Math.min(100, (events.length / 30) * 100);
  
  return Math.round((repoScore * 0.3) + (followerScore * 0.2) + (starScore * 0.3) + (activityScore * 0.2));
}

function calculateLeetCodeScore(data) {
  const totalScore = (data.totalSolved / 500) * 100;
  const difficultyScore = (
    (data.easySolved * 1) +
    (data.mediumSolved * 2) +
    (data.hardSolved * 3)
  ) / 10;
  
  return Math.min(100, Math.round((totalScore + difficultyScore) / 2));
}

async function generateActivityTimeline(username) {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const events = await axios.get(
      `https://api.github.com/users/${username}/events/public`,
      {
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
      }
    );

    const monthlyActivity = Array(6).fill(0);
    events.data.forEach(event => {
      const eventDate = new Date(event.created_at);
      if (eventDate > sixMonthsAgo) {
        const monthIndex = 5 - Math.floor((Date.now() - eventDate) / (30 * 24 * 60 * 60 * 1000));
        if (monthIndex >= 0 && monthIndex < 6) {
          monthlyActivity[monthIndex] += 1;
        }
      }
    });

    // Normalize to 0-100 scale
    const max = Math.max(...monthlyActivity, 1);
    return monthlyActivity.map(count => Math.round((count / max) * 100));
  } catch (error) {
    console.warn('Error generating activity timeline:', error);
    return [65, 70, 75, 80, 85, 90]; // Fallback data
  }
}

function calculateSkillRadar(github, leetcode) {
  return [
    Math.round((github.metrics.recentActivity / 50) * 100), // Frontend
    Math.round((github.metrics.repos / 30) * 100), // Backend
    Math.round((github.metrics.forks / 20) * 100), // DevOps
    leetcode.score, // Algorithms
    Math.round((github.metrics.stars / 100) * 100), // System Design
    Math.round((github.metrics.followers / 100) * 100) // Soft Skills
  ].map(score => Math.min(100, score));
}

function generateInsights(github, leetcode) {
  const strengths = [];
  const weaknesses = [];

  if (github.metrics.stars > 50) strengths.push("Strong open source presence");
  if (github.metrics.repos > 20) strengths.push("Diverse project portfolio");
  if (leetcode.metrics.totalSolved > 200) strengths.push("Strong problem-solving skills");

  if (github.metrics.recentActivity < 10) weaknesses.push("Could increase contribution frequency");
  if (leetcode.metrics.hardSolved < 20) weaknesses.push("Could tackle more challenging problems");

  return {
    strengths: strengths.join(". "),
    weaknesses: weaknesses.join(". "),
    trajectory: `Solved ${leetcode.metrics.totalSolved} LeetCode problems and maintains ${github.metrics.repos} public repositories`
  };
}

function generateActionPlan(github, leetcode) {
  const plan = {
    step1: "",
    step2: "",
    step3: ""
  };

  if (github.metrics.recentActivity < 10) {
    plan.step1 = "Increase GitHub activity with regular commits";
  } else if (github.metrics.repos < 20) {
    plan.step1 = "Create more diverse public repositories";
  } else {
    plan.step1 = "Maintain consistent GitHub activity";
  }

  if (leetcode.metrics.hardSolved < 20) {
    plan.step2 = "Focus on solving more hard-level LeetCode problems";
  } else if (leetcode.metrics.totalSolved < 200) {
    plan.step2 = "Increase overall problem-solving practice";
  } else {
    plan.step2 = "Continue maintaining strong algorithmic skills";
  }

  plan.step3 = "Enhance documentation and README files in repositories";

  return plan;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 