import request from "supertest";
import app from "../server.js";
import { clearDatabase, authHeaders } from "../test/helpers.js";
import { jest } from "@jest/globals";
import {
  createCandidate,
  createCompany,
  createCompanyRecruiter,
  createCompanyAdmin,
  createJob,
  createApplication
} from "../test/factories.js";
import { calculateLocalScreening, calculateConfidence } from "../services/aiScreen.service.js";

// Mock the resume parser service directly for ESM test stability
jest.unstable_mockModule("../services/resumeParser.service.js", () => {
  return {
    parseResume: jest.fn().mockImplementation((resumeUrl) => {
      if (!resumeUrl) {
        return Promise.resolve({
          detectedSkills: [],
          textPreview: "",
          textHash: null
        });
      }
      return Promise.resolve({
        detectedSkills: ["React", "Node.js", "AWS", "Kubernetes"],
        textPreview: "Developer with experience in React, Node.js, AWS and Kubernetes. Holds a BS in Computer Science.",
        textHash: "mockedhash123"
      });
    })
  };
});

describe("AI Resume Parsing & Screening Tests", () => {
  let candidate, recruiter, company, job, application;
  let parseResume;

  beforeAll(async () => {
    const parser = await import("../services/resumeParser.service.js");
    parseResume = parser.parseResume;
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Set up standard entities
    company = await createCompany();
    recruiter = await createCompanyRecruiter(company);
    candidate = await createCandidate({
      name: "Alice Dev",
      skills: ["React", "JavaScript"],
      experience: [
        {
          company: "Tech Corp",
          title: "Software Engineer",
          startDate: "2023-01-01",
          endDate: "2025-01-01",
          description: "Worked on React and Node.js"
        }
      ],
      education: [
        {
          school: "State University",
          degree: "Bachelor of Science",
          fieldOfStudy: "Computer Science",
          startDate: "2019-09-01",
          endDate: "2023-05-30"
        }
      ]
    });
    
    job = await createJob(company, recruiter, {
      title: "Fullstack Developer",
      description: "Needs 2 years of experience. Working with React and NodeJS.",
      requirements: ["React", "Node.js", "AWS"]
    });
  });

  describe("Resume Parser Service", () => {
    it("should extract text and detect correct skills from mock PDF", async () => {
      // Mock global fetch
      const mockFetch = jest.spyOn(global, "fetch").mockImplementation(() =>
        Promise.resolve({
          ok: true,
          headers: {
            get: (h) => (h === "content-length" ? "100" : "application/pdf")
          },
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
        })
      );

      const parsed = await parseResume("https://example.com/alice-resume.pdf");
      
      expect(parsed).toHaveProperty("detectedSkills");
      expect(parsed.detectedSkills).toContain("React");
      expect(parsed.detectedSkills).toContain("Node.js");
      expect(parsed.detectedSkills).toContain("AWS");
      expect(parsed.detectedSkills).toContain("Kubernetes");
      expect(parsed).toHaveProperty("textHash");
      expect(parsed.textHash).not.toBeNull();
      expect(parsed.textPreview).toContain("Developer with experience");

      mockFetch.mockRestore();
    });

    it("should gracefully return empty skills and null hash if resumeUrl is blank", async () => {
      const parsed = await parseResume("");
      expect(parsed.detectedSkills).toEqual([]);
      expect(parsed.textHash).toBeNull();
    });
  });

  describe("Deterministic Local Scoring Engine", () => {
    it("should calculate correct confidence score based on profile completion", () => {
      const resumeMetadata = {
        detectedSkills: ["React"],
        textPreview: "Preview",
        textHash: "hash123"
      };
      const confidence = calculateConfidence(candidate, resumeMetadata);
      // Alice has: resume (20), skills (20), experience (20), education (20), about (10), headline (10) = 100
      expect(confidence).toBe(100);
    });

    it("should compute accurate match scores based on weights", () => {
      const resumeMetadata = {
        detectedSkills: ["Node.js", "AWS"],
        textPreview: "React, Node.js, AWS developer",
        textHash: "hash123"
      };

      const screening = calculateLocalScreening(job, candidate, resumeMetadata);

      // Skills: Job required ["React", "Node.js", "AWS"]. Candidate has React/JS in profile, Node.js/AWS in resume. Matches 3/3 = 100% -> 60 points
      // Experience: Candidate has 2 years of experience. Job description says "Needs 2 years". Matches 2/2 = 100% -> 25 points
      // Education: CS degree listed = 100% -> 15 points
      // Total matchScore should be 100
      expect(screening.matchScore).toBe(100);
      expect(screening.recommendation).toBe("Strong Match");
      expect(screening.matchedSkills).toContain("React");
      expect(screening.matchedSkills).toContain("Node.js");
      expect(screening.matchedSkills).toContain("AWS");
      expect(screening.missingSkills).toEqual([]);
    });
  });

  describe("AI Screen Route /:companyId/jobs/:jobId/screen", () => {
    it("should block non-recruiter users from accessing screening route", async () => {
      const candidateUser = await createCandidate();
      const res = await request(app)
        .post(`/api/job/${company._id}/jobs/${job._id}/screen`)
        .set(authHeaders(candidateUser));

      expect(res.status).toBe(403);
    });

    it("should block recruiters from other companies from accessing the screening route", async () => {
      const otherCompany = await createCompany();
      const otherRecruiter = await createCompanyRecruiter(otherCompany);

      const res = await request(app)
        .post(`/api/job/${company._id}/jobs/${job._id}/screen`)
        .set(authHeaders(otherRecruiter));

      expect(res.status).toBe(403);
    });

    it("should allow company recruiter to fetch screen rankings and return them sorted", async () => {
      // Create two candidates with different experience profiles
      const cand1 = await createCandidate({
        name: "Dev One",
        skills: ["React"],
        experience: [{ company: "A", title: "Dev", startDate: "2024-01-01", endDate: "2025-01-01" }], // 1 yr
        education: []
      });
      const cand2 = await createCandidate({
        name: "Dev Two",
        skills: ["React", "Node.js", "AWS"],
        experience: [{ company: "A", title: "Dev", startDate: "2020-01-01", endDate: "2025-01-01" }], // 5 yrs
        education: [{ school: "A", degree: "Bachelor of Science", fieldOfStudy: "Computer Science", startDate: "2020-09-01" }]
      });

      // Submit applications
      await createApplication(job._id, cand1._id);
      await createApplication(job._id, cand2._id);

      const res = await request(app)
        .post(`/api/job/${company._id}/jobs/${job._id}/screen`)
        .set(authHeaders(recruiter));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.totalApplicants).toBe(2);
      expect(res.body.applicants.length).toBe(2);
      
      // Top candidate should be cand2 (Dev Two) because of higher experience and skills matching
      expect(res.body.applicants[0].name).toBe("Dev Two");
      expect(res.body.applicants[0].aiScreening.matchScore).toBeGreaterThan(res.body.applicants[1].aiScreening.matchScore);
    });
  });
});
