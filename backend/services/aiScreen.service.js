import { parseResume } from "./resumeParser.service.js";

/**
 * Deterministic Local Candidate Scoring and Screening Service
 */

// Supported relevant degrees for education matching
const RELEVANT_DEGREES = [
  "computer science",
  "information technology",
  "software engineering",
  "computer engineering",
  "electronics & communication engineering",
  "electrical engineering",
  "data science",
  "artificial intelligence",
  "machine learning",
  "information systems",
  "computer applications", // BCA/MCA
  "cs",
  "it",
  "ece",
  "swe"
];

/**
 * Calculates Candidate Profile Completeness (Confidence Score) from 0 to 100.
 */
export const calculateConfidence = (candidate, resumeMetadata) => {
  let score = 0;

  // 1. Resume presence (20 pts)
  if (resumeMetadata?.textPreview || candidate.resumeUrl) {
    score += 20;
  }

  // 2. Skills listed (20 pts)
  if (candidate.skills && candidate.skills.length > 0) {
    score += 20;
  }

  // 3. Experience array populated (20 pts)
  if (candidate.experience && candidate.experience.length > 0) {
    score += 20;
  }

  // 4. Education array populated (20 pts)
  if (candidate.education && candidate.education.length > 0) {
    score += 20;
  }

  // 5. About section filled (10 pts)
  if (candidate.about && candidate.about.trim().length > 0) {
    score += 10;
  }

  // 6. Headline filled (10 pts)
  if (candidate.headline && candidate.headline.trim().length > 0) {
    score += 10;
  }

  return score;
};

/**
 * Computes the total years of professional experience for a candidate
 */
export const calculateCandidateExperience = (experienceArray) => {
  if (!experienceArray || experienceArray.length === 0) return 0;

  let totalMonths = 0;

  for (const exp of experienceArray) {
    if (!exp.startDate) continue;

    const start = new Date(exp.startDate);
    const end = exp.endDate ? new Date(exp.endDate) : new Date(); // Present fallback

    if (isNaN(start.getTime()) || isNaN(end.getTime())) continue;

    const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    totalMonths += Math.max(0, diffMonths);
  }

  return parseFloat((totalMonths / 12).toFixed(1));
};

/**
 * Extracts required years of experience from job details
 */
export const extractRequiredExperience = (job) => {
  let requiredYears = 2; // Default fallback

  const searchText = `${job.title} ${job.description} ${(job.requirements || []).join(" ")}`.toLowerCase();
  
  // Search for patterns like "3+ years", "3 years", "5 yrs of experience"
  const expPatterns = [
    /(\d+)\+?\s*years?\s*(?:of\s*)?experience/i,
    /experience\s*(?:of\s*)?(\d+)\+?\s*years?/i,
    /(\d+)\+?\s*yrs?\s*(?:of\s*)?experience/i,
    /experience\s*(?:of\s*)?(\d+)\+?\s*yrs?/i
  ];

  for (const pattern of expPatterns) {
    const match = searchText.match(pattern);
    if (match) {
      const val = parseInt(match[1], 10);
      if (!isNaN(val) && val > 0 && val < 30) { // filter out garbage matches
        requiredYears = val;
        break;
      }
    }
  }

  return requiredYears;
};

/**
 * Deterministic local scoring engine.
 * Computes scores out of 100 based on:
 * - Skills Match (60%)
 * - Experience Match (25%)
 * - Education Match (15%)
 */
export const calculateLocalScreening = (job, candidate, resumeMetadata) => {
  // 1. Skills Scoring (60%)
  const jobRequirements = (job.requirements || []).map(s => s.toLowerCase().trim());
  const candidateSkills = new Set([
    ...(candidate.skills || []).map(s => s.toLowerCase().trim()),
    ...(resumeMetadata?.detectedSkills || []).map(s => s.toLowerCase().trim())
  ]);

  const matchedSkills = [];
  const missingSkills = [];

  if (jobRequirements.length > 0) {
    for (const req of jobRequirements) {
      // Direct substring or exact check
      let found = false;
      for (const candSkill of candidateSkills) {
        if (candSkill === req) {
          found = true;
          break;
        }
      }

      // Check raw resume text preview if available
      if (!found && resumeMetadata?.textPreview) {
        const escaped = req.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        const regex = new RegExp(`(?:^|[^a-zA-Z0-9_#+.-])${escaped}(?:$|[^a-zA-Z0-9_#+.-])`, "i");
        if (regex.test(resumeMetadata.textPreview)) {
          found = true;
        }
      }

      if (found) {
        // Find original casing from job requirements
        const orig = job.requirements.find(s => s.toLowerCase().trim() === req) || req;
        matchedSkills.push(orig);
      } else {
        const orig = job.requirements.find(s => s.toLowerCase().trim() === req) || req;
        missingSkills.push(orig);
      }
    }
  }

  const skillsScoreRatio = jobRequirements.length > 0 
    ? matchedSkills.length / jobRequirements.length 
    : 1.0;

  // 2. Experience Scoring (25%)
  const candidateYears = calculateCandidateExperience(candidate.experience);
  const requiredYears = extractRequiredExperience(job);
  const experienceScoreRatio = requiredYears > 0 
    ? Math.min(candidateYears / requiredYears, 1.0) 
    : 1.0;

  // 3. Education Scoring (15%)
  let educationScoreRatio = 0;
  let matchedDegreeName = "";

  if (candidate.education && candidate.education.length > 0) {
    for (const edu of candidate.education) {
      const degree = (edu.degree || "").toLowerCase().trim();
      const field = (edu.fieldOfStudy || "").toLowerCase().trim();

      // Check if any degree or field of study matches the relevant list
      const isRelevant = RELEVANT_DEGREES.some(rel => 
        degree.includes(rel) || field.includes(rel)
      );

      if (isRelevant) {
        educationScoreRatio = 1.0;
        matchedDegreeName = edu.degree + (edu.fieldOfStudy ? ` (${edu.fieldOfStudy})` : "");
        break;
      }
    }

    // Fallback: If they have a degree but not in a tech field, give partial credit
    if (educationScoreRatio === 0) {
      educationScoreRatio = 0.5;
    }
  }

  // Weighted Calculation
  const finalScore = Math.round(
    (skillsScoreRatio * 60) + 
    (experienceScoreRatio * 25) + 
    (educationScoreRatio * 15)
  );

  // Recommendation Logic
  let recommendation = "Under-qualified";
  if (finalScore >= 80) {
    recommendation = "Strong Match";
  } else if (finalScore >= 60) {
    recommendation = "Potential Match";
  }

  // Strengths and Concerns Generation
  const strengths = [];
  const concerns = [];
  const screeningReasons = [];

  // Skills insights
  if (jobRequirements.length > 0) {
    const percent = Math.round((matchedSkills.length / jobRequirements.length) * 100);
    screeningReasons.push(`Matched ${matchedSkills.length} of ${jobRequirements.length} required skills (${percent}%)`);
    if (percent >= 70) {
      strengths.push(`Excellent skill coverage (${percent}% match)`);
    } else if (percent < 40) {
      concerns.push(`Low keyword match with required job requirements (${percent}%)`);
    }
  } else {
    screeningReasons.push("No explicit skill requirements specified for this job");
  }

  // Experience insights
  screeningReasons.push(`Has ${candidateYears} years of professional experience (Required: ${requiredYears} years)`);
  if (candidateYears >= requiredYears) {
    strengths.push(`Meets or exceeds experience requirement (${candidateYears} yrs vs ${requiredYears} yrs)`);
  } else {
    concerns.push(`Short on experience (Has ${candidateYears} yrs, job seeks ${requiredYears}+ yrs)`);
  }

  // Education insights
  if (educationScoreRatio === 1.0) {
    strengths.push(`Relevant technical degree: ${matchedDegreeName}`);
    screeningReasons.push(`Holds relevant technical degree: ${matchedDegreeName}`);
  } else if (educationScoreRatio === 0.5) {
    screeningReasons.push("Holds degree in non-technical or other field");
  } else {
    concerns.push("No post-secondary education listed");
    screeningReasons.push("No education background recorded on profile");
  }

  // Fallback default summary
  const summary = `${candidate.name || "Candidate"} is a ${candidate.headline || "professional"} with ${candidateYears} years of experience. They match ${matchedSkills.length}/${jobRequirements.length} key requirements for this position.`;

  return {
    matchScore: finalScore,
    confidence: calculateConfidence(candidate, resumeMetadata),
    summary,
    recommendation,
    matchedSkills,
    missingSkills,
    strengths,
    concerns,
    screeningReasons,
    source: "local",
    lastScreenedAt: new Date()
  };
};

export const CURRENT_VERSION = 1;

/**
 * Validates the Gemini API response structure.
 */
export const validateGeminiResponse = (data) => {
  if (!data || typeof data !== "object") return false;
  if (typeof data.summary !== "string") return false;
  if (typeof data.recommendation !== "string") return false;
  
  if (!Array.isArray(data.strengths) || !data.strengths.every(s => typeof s === "string")) return false;
  if (!Array.isArray(data.concerns) || !data.concerns.every(c => typeof c === "string")) return false;
  if (!Array.isArray(data.screeningReasons) || !data.screeningReasons.every(r => typeof r === "string")) return false;
  
  const validRecs = ["Strong Match", "Potential Match", "Under-qualified"];
  if (!validRecs.includes(data.recommendation)) return false;
  
  return true;
};

/**
 * Checks if the cached screening result is still valid.
 */
export const isCacheValid = (application, job, candidate) => {
  const cache = application.aiScreening;
  if (!cache || cache.status !== "COMPLETED" || cache.version !== CURRENT_VERSION || !cache.lastScreenedAt) {
    return false;
  }

  const cacheTime = new Date(cache.lastScreenedAt).getTime();

  // Cache age check: max 24 hours
  if (Date.now() - cacheTime > 24 * 60 * 60 * 1000) {
    return false;
  }

  // Check if job updated after screening
  if (job.updatedAt && new Date(job.updatedAt).getTime() > cacheTime) {
    return false;
  }

  // Check if candidate profile updated after screening
  if (candidate.updatedAt && new Date(candidate.updatedAt).getTime() > cacheTime) {
    return false;
  }

  // Check if resume was updated/re-uploaded after screening
  if (application.resumeMetadata?.extractedAt && new Date(application.resumeMetadata.extractedAt).getTime() > cacheTime) {
    return false;
  }

  return true;
};

/**
 * Calls the Gemini API to retrieve advanced structured insights.
 */
export const enhanceWithGemini = async (job, candidate, resumeMetadata) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const promptText = `
You are an expert ATS (Applicant Tracking System) assistant.
Analyze the following Candidate details and Job description to generate structured insights.

Job Details:
Title: ${job.title}
Description: ${job.description}
Requirements: ${(job.requirements || []).join(", ")}

Candidate Details:
Name: ${candidate.name || "N/A"}
Headline: ${candidate.headline || "N/A"}
About: ${candidate.about || "N/A"}
Skills: ${(candidate.skills || []).join(", ")}
Resume Text: ${resumeMetadata?.textPreview || "N/A"}

Provide:
1. summary: A professional, clear candidate overview (2-3 sentences).
2. strengths: Bulleted points highlight candidate qualifications for this job.
3. concerns: Bulleted points highlighting qualifications gaps, missing certifications, or missing technical skills.
4. screeningReasons: Bulleted scannable recruiter highlights showing exact reasons for match.
5. recommendation: One of: "Strong Match", "Potential Match", "Under-qualified".

Return ONLY valid JSON strictly matching this schema:
{
  "summary": "string",
  "strengths": ["string"],
  "concerns": ["string"],
  "screeningReasons": ["string"],
  "recommendation": "Strong Match" | "Potential Match" | "Under-qualified"
}
Do NOT wrap the output in markdown block codes or include text before/after. Return pure JSON.
`;

  const payload = {
    contents: [{
      parts: [{
        text: promptText
      }]
    }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          summary: { type: "STRING" },
          strengths: { type: "ARRAY", items: { type: "STRING" } },
          concerns: { type: "ARRAY", items: { type: "STRING" } },
          screeningReasons: { type: "ARRAY", items: { type: "STRING" } },
          recommendation: { type: "STRING", enum: ["Strong Match", "Potential Match", "Under-qualified"] }
        },
        required: ["summary", "strengths", "concerns", "screeningReasons", "recommendation"]
      }
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Gemini API request failed with status: ${response.status}`);
  }

  const result = await response.json();
  const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textResponse) {
    throw new Error("Empty response from Gemini API");
  }

  let data;
  try {
    data = JSON.parse(textResponse.trim());
  } catch (err) {
    throw new Error(`Failed to parse Gemini JSON: ${err.message}`);
  }

  if (!validateGeminiResponse(data)) {
    throw new Error("Invalid Gemini response structure");
  }

  return data;
};

/**
 * Screen all applications for a job, caching results, and enhancing the top 10 candidates with Gemini.
 */
export const screenApplicants = async (job, applications, refresh = false) => {
  // 1. Calculate local screening metrics for all candidates
  const processedList = [];

  for (const app of applications) {
    if (app.resume && (refresh || !app.resumeMetadata || !app.resumeMetadata.textPreview)) {
      try {
        const parsedData = await parseResume(app.resume);
        app.resumeMetadata = {
          ...parsedData,
          extractedAt: new Date()
        };
        await app.save();
      } catch (err) {
        console.error(`Failed to re-parse resume for application ${app._id}:`, err);
      }
    }

    const local = calculateLocalScreening(job, app.user, app.resumeMetadata);
    processedList.push({
      application: app,
      local
    });
  }

  // 2. Rank candidates by matchScore descending
  processedList.sort((a, b) => b.local.matchScore - a.local.matchScore);

  // 3. Process top 10 and enhance with Gemini if needed
  const apiKey = process.env.GEMINI_API_KEY;

  for (let i = 0; i < processedList.length; i++) {
    const item = processedList[i];
    const isTop10 = i < 10;

    const cacheValid = isCacheValid(item.application, job, item.application.user);

    if (cacheValid && !refresh) {
      // Reuse cache, override local with cache values
      item.finalScreening = {
        ...item.local, // base deterministic values
        summary: item.application.aiScreening.summary,
        strengths: item.application.aiScreening.strengths,
        concerns: item.application.aiScreening.concerns,
        screeningReasons: item.application.aiScreening.screeningReasons,
        recommendation: item.application.aiScreening.recommendation,
        source: item.application.aiScreening.source,
        model: item.application.aiScreening.model || "local",
        status: "COMPLETED",
        version: CURRENT_VERSION,
        lastScreenedAt: item.application.aiScreening.lastScreenedAt
      };
      continue;
    }

    // Cache invalid or refresh = true
    let screeningResult = {
      ...item.local,
      source: "local",
      model: "local",
      status: "COMPLETED",
      version: CURRENT_VERSION,
      lastScreenedAt: new Date()
    };

    if (isTop10 && apiKey && process.env.NODE_ENV !== "test") {
      // Mark as PROCESSING in DB first (non-blocking)
      item.application.aiScreening = {
        ...item.local,
        status: "PROCESSING",
        version: CURRENT_VERSION,
        lastScreenedAt: new Date()
      };
      await item.application.save().catch(() => {});

      try {
        const geminiEnhanced = await enhanceWithGemini(job, item.application.user, item.application.resumeMetadata);
        
        // Match scores and skills MUST remain deterministic (not overwritten by Gemini)
        screeningResult = {
          ...item.local,
          summary: geminiEnhanced.summary,
          strengths: geminiEnhanced.strengths,
          concerns: geminiEnhanced.concerns,
          screeningReasons: geminiEnhanced.screeningReasons,
          recommendation: geminiEnhanced.recommendation,
          source: "gemini",
          model: "gemini-2.5-flash",
          status: "COMPLETED",
          version: CURRENT_VERSION,
          lastScreenedAt: new Date()
        };
      } catch (error) {
        // Safe fallback on rate limits, timeouts, or JSON errors
        console.error(`Gemini enhancement failed for ${item.application.user.name}:`, error.message);
      }
    }

    // Save final screening to candidate application
    item.application.aiScreening = screeningResult;
    await item.application.save();

    item.finalScreening = screeningResult;
  }

  // Sort final results by score descending and return
  return processedList.map(item => ({
    applicationId: item.application._id,
    userId: item.application.user._id,
    name: item.application.user.name,
    email: item.application.user.email,
    headline: item.application.user.headline,
    status: item.application.status,
    resume: item.application.resume,
    aiScreening: item.finalScreening
  })).sort((a, b) => b.aiScreening.matchScore - a.aiScreening.matchScore);
};
