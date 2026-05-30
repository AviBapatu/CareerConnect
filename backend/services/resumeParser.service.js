import { createRequire } from "module";
const require = createRequire(import.meta.url);

const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");
import crypto from "crypto";
import { TECH_SKILLS } from "../constants/skills.js";

// Max resume size limit (10MB)
const MAX_RESUME_SIZE = 10 * 1024 * 1024;

// Precompile skill detection regexes once at startup for performance optimization
const TECH_SKILL_PATTERNS = TECH_SKILLS.map((skill) => {
  const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  return {
    skill,
    regex: new RegExp(`(?:^|[^a-zA-Z0-9_#+.-])${escaped}(?:$|[^a-zA-Z0-9_#+.-])`, "i"),
  };
});

/**
 * Downloads a resume from a URL (e.g., Cloudinary), parses it,
 * extracts technical skills, computes a SHA-256 hash, and generates a preview.
 * 
 * @param {string} resumeUrl - The URL to the resume file
 * @returns {Promise<{ detectedSkills: string[], textPreview: string, textHash: string | null }>}
 */
export const parseResume = async (resumeUrl) => {
  // Gracefully handle case where candidate applies without a resume URL
  if (!resumeUrl) {
    return {
      detectedSkills: [],
      textPreview: "",
      textHash: null,
    };
  }

  // Fetch resume from remote host (Cloudinary)
  const response = await fetch(resumeUrl);
  if (!response.ok) {
    throw new Error(`Failed to download resume from ${resumeUrl}: ${response.statusText}`);
  }

  // File size protection check
  const contentLength = response.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_RESUME_SIZE) {
    throw new Error(`Resume exceeds maximum allowed size of 10MB (Size: ${contentLength} bytes)`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // More resilient file type detection (Content-Type header + URL path check)
  const contentType = response.headers.get("content-type")?.toLowerCase() || "";
  const isDocx = contentType.includes("officedocument.wordprocessingml.document") || 
                  contentType.includes("msword") ||
                  resumeUrl.toLowerCase().split(/[?#]/)[0].endsWith(".docx");

  let text = "";

  if (isDocx) {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value || "";
  } else {
    // Fallback to PDF parser using the new PDFParse
    let parser;
    try {
      parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      text = result.text || "";
    } catch (err) {
      console.error("PDFParse error:", err);
      text = "";
    } finally {
      if (parser) {
        await parser.destroy().catch(() => {});
      }
    }
  }

  // Detect skills using precompiled patterns
  const detectedSkills = [];
  for (const { skill, regex } of TECH_SKILL_PATTERNS) {
    if (regex.test(text)) {
      detectedSkills.push(skill);
    }
  }

  // Create SHA-256 hash
  const textHash = crypto
    .createHash("sha256")
    .update(text)
    .digest("hex");

  // Generate 10KB preview
  const textPreview = text.substring(0, 10000);

  return {
    detectedSkills,
    textPreview,
    textHash,
  };
};
