exports.calculateScores = (data) => {
  // Calculate GitHub score (40% weight)
  const githubScore = calculateGitHubScore(data.github);

  // Calculate LeetCode score (30% weight)
  const leetcodeScore = calculateLeetCodeScore(data.leetcode);

  // Calculate LinkedIn score (30% weight)
  const linkedinScore = calculateLinkedInScore(data.linkedin);

  // Calculate overall score
  const overallScore = Math.round(
    (0.4 * githubScore) +
    (0.3 * leetcodeScore) +
    (0.3 * linkedinScore)
  );

  // Generate skill radar data
  const skillRadarData = [
    calculateFrontendScore(data),    // Frontend
    calculateBackendScore(data),     // Backend
    calculateDevOpsScore(data),      // DevOps
    calculateAlgorithmScore(data),   // Algorithms
    calculateSystemDesignScore(data),// System Design
    calculateSoftSkillsScore(data)   // Soft Skills
  ];

  // Generate activity timeline
  const activityTimelineData = generateActivityTimeline(data);

  // Generate action plan
  const actionPlan = generateActionPlan(data, {
    githubScore,
    leetcodeScore,
    linkedinScore,
    overallScore
  });

  return {
    overallScore,
    githubScore,
    leetcodeScore,
    skillRadarData,
    activityTimelineData,
    actionPlan
  };
};

function calculateGitHubScore(github) {
  const repoScore = Math.min(100, (github.publicRepos / 30) * 100);
  const followerScore = Math.min(100, (github.followers / 100) * 100);
  const activityScore = github.activity_score;

  return Math.round((repoScore + followerScore + activityScore) / 3);
}

function calculateLeetCodeScore(leetcode) {
  if (leetcode.totalSolved === 0) return 0;

  const problemScore = Math.min(100, (leetcode.totalSolved / 300) * 100);
  const difficultyScore = calculateDifficultyScore(leetcode);
  const accuracyScore = leetcode.acceptanceRate;

  return Math.round((problemScore + difficultyScore + accuracyScore) / 3);
}

function calculateLinkedInScore(linkedin) {
  const connectionScore = Math.min(100, (linkedin.connections / 500) * 100);
  const engagementScore = Math.min(100, (linkedin.posts / 20) * 100);
  const endorsementScore = Math.min(100, (linkedin.endorsements / 50) * 100);

  return Math.round((connectionScore + engagementScore + endorsementScore) / 3);
}

function calculateDifficultyScore(leetcode) {
  const hardWeight = 3;
  const mediumWeight = 2;
  const easyWeight = 1;

  const weightedScore = 
    (leetcode.hardSolved * hardWeight) +
    (leetcode.mediumSolved * mediumWeight) +
    (leetcode.easySolved * easyWeight);

  return Math.min(100, (weightedScore / 300) * 100);
}

function calculateFrontendScore(data) {
  const frontendTechs = ['JavaScript', 'TypeScript', 'HTML', 'CSS', 'React', 'Vue', 'Angular'];
  return calculateTechScore(data.github.repos, frontendTechs);
}

function calculateBackendScore(data) {
  const backendTechs = ['Node.js', 'Python', 'Java', 'C#', 'PHP', 'Ruby', 'Go'];
  return calculateTechScore(data.github.repos, backendTechs);
}

function calculateDevOpsScore(data) {
  const devopsTechs = ['Docker', 'Kubernetes', 'AWS', 'Azure', 'Jenkins', 'Terraform'];
  return calculateTechScore(data.github.repos, devopsTechs);
}

function calculateAlgorithmScore(data) {
  if (data.leetcode.totalSolved === 0) return 0;
  return Math.min(100, 
    ((data.leetcode.hardSolved * 3) + 
     (data.leetcode.mediumSolved * 2) + 
     data.leetcode.easySolved) / 5
  );
}

function calculateSystemDesignScore(data) {
  // Based on repository complexity and size
  const repos = data.github.repos;
  const complexityScore = repos.reduce((score, repo) => {
    return score + (repo.forks + repo.stars) / 100;
  }, 0);

  return Math.min(100, complexityScore);
}

function calculateSoftSkillsScore(data) {
  // Based on LinkedIn engagement and GitHub collaboration
  return Math.round(
    (data.linkedin.connections / 500 * 50) + 
    (data.github.followers / 100 * 50)
  );
}

function calculateTechScore(repos, technologies) {
  const techCount = repos.reduce((count, repo) => {
    if (technologies.includes(repo.language)) {
      return count + 1;
    }
    return count;
  }, 0);

  return Math.min(100, (techCount / repositories.length) * 100);
}

function generateActivityTimeline(data) {
  // Generate 6-month activity data
  const timeline = new Array(6).fill(0);
  const now = new Date();

  data.github.repos.forEach(repo => {
    const updateDate = new Date(repo.updated_at);
    const monthsAgo = Math.floor((now - updateDate) / (1000 * 60 * 60 * 24 * 30));
    
    if (monthsAgo < 6) {
      timeline[5 - monthsAgo] += 10;
    }
  });

  return timeline.map(score => Math.min(100, score));
}

function generateActionPlan(data, scores) {
  const actions = {
    step1: '',
    step2: '',
    step3: ''
  };

  // Prioritize areas needing improvement
  if (scores.leetcodeScore < 70) {
    actions.step1 = 'Focus on solving more LeetCode problems, especially medium and hard difficulty';
  } else if (scores.githubScore < 70) {
    actions.step1 = 'Increase open source contributions and create more public repositories';
  } else {
    actions.step1 = 'Start a new full-stack project to showcase your skills';
  }

  if (calculateSystemDesignScore(data) < 70) {
    actions.step2 = 'Work on system design projects and documentation';
  } else if (calculateDevOpsScore(data) < 70) {
    actions.step2 = 'Learn and implement DevOps practices in your projects';
  } else {
    actions.step2 = 'Obtain relevant certifications in your strongest areas';
  }

  if (scores.linkedinScore < 70) {
    actions.step3 = 'Improve LinkedIn presence and professional networking';
  } else {
    actions.step3 = 'Contribute to technical blogs and community discussions';
  }

  return actions;
} 