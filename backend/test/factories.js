import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";
import User from "../models/User.js";
import Company from "../models/Company.js";
import Job from "../models/Job.js";
import Article from "../models/Article.js";
import Connection from "../models/Connection.js";
import Application from "../models/Application.js";

// Pre-compute bcrypt password hash once to speed up tests
const PASSWORD = "Password123!";
const HASHED_PASSWORD = bcrypt.hashSync(PASSWORD, 1); // 1 salt round is super fast

export { PASSWORD };

/**
 * Creates a candidate user in the database.
 */
export const createCandidate = async (attrs = {}) => {
  const defaultAttrs = {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: HASHED_PASSWORD,
    role: "candidate",
    headline: faker.person.jobTitle(),
    about: faker.lorem.paragraph(),
    location: faker.location.city(),
    skills: ["JavaScript", "React"],
    isOpenToWork: true,
    resumeUrl: "https://example.com/resume.pdf",
  };
  return await User.create({ ...defaultAttrs, ...attrs });
};

/**
 * Creates a recruiter user in the database.
 */
export const createRecruiter = async (attrs = {}) => {
  const defaultAttrs = {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: HASHED_PASSWORD,
    role: "recruiter",
    headline: "Recruiter Manager",
    about: faker.lorem.paragraph(),
    location: faker.location.city(),
    isOpenToWork: false,
  };
  return await User.create({ ...defaultAttrs, ...attrs });
};

/**
 * Creates an admin user in the database.
 */
export const createAdmin = async (attrs = {}) => {
  const defaultAttrs = {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: HASHED_PASSWORD,
    role: "admin",
    headline: "Global Platform Administrator",
    about: faker.lorem.paragraph(),
    location: faker.location.city(),
    isOpenToWork: false,
  };
  return await User.create({ ...defaultAttrs, ...attrs });
};

/**
 * Creates a company in the database.
 */
export const createCompany = async (attrs = {}) => {
  const randomSuffix = Math.floor(Math.random() * 1000000);
  const defaultAttrs = {
    name: `${faker.company.name()} ${randomSuffix}`,
    industry: faker.helpers.arrayElement(["Technology", "Finance", "Healthcare"]),
    size: "11-50",
    location: faker.location.city(),
    website: faker.internet.url(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    description: faker.company.catchPhrase(),
    foundedYear: 2010,
    verified: true,
    admins: [],
    members: [],
  };
  return await Company.create({ ...defaultAttrs, ...attrs });
};

/**
 * Helper to add a user to a company's admin list and set user company fields.
 */
export const createCompanyAdmin = async (company, attrs = {}) => {
  const user = await createRecruiter(attrs);
  user.company = company._id;
  user.companyRole = "admin";
  await user.save();

  company.admins.push(user._id);
  company.members.push({ user: user._id, role: "admin" });
  await company.save();
  return user;
};

/**
 * Helper to add a user to a company as recruiter.
 */
export const createCompanyRecruiter = async (company, attrs = {}) => {
  const user = await createRecruiter(attrs);
  user.company = company._id;
  user.companyRole = "recruiter";
  await user.save();

  company.members.push({ user: user._id, role: "recruiter" });
  company.joinRequests.push({ user: user._id, roleTitle: "recruiter", status: "accepted" });
  await company.save();
  return user;
};

/**
 * Helper to add a user to a company as employee.
 */
export const createCompanyEmployee = async (company, attrs = {}) => {
  const user = await createCandidate(attrs);
  user.company = company._id;
  user.companyRole = "employee";
  await user.save();

  company.members.push({ user: user._id, role: "employee" });
  company.joinRequests.push({ user: user._id, roleTitle: "employee", status: "accepted" });
  await company.save();
  return user;
};

/**
 * Creates a job post in the database.
 */
export const createJob = async (company, recruiter, attrs = {}) => {
  const defaultAttrs = {
    title: faker.person.jobTitle(),
    description: faker.lorem.paragraphs(2),
    requirements: ["NodeJS", "ExpressJS", "MongoDB"],
    company: company._id,
    companyName: company.name,
    location: company.location || faker.location.city(),
    type: "full-time",
    industry: company.industry,
    postedBy: recruiter._id,
    status: "active",
  };
  
  const job = await Job.create({ ...defaultAttrs, ...attrs });
  
  company.jobs.push(job._id);
  await company.save();
  
  return job;
};

/**
 * Creates an article in the database.
 */
export const createArticle = async (authorId, authorType = "User", attrs = {}) => {
  const defaultAttrs = {
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(3),
    category: "Interview Tips",
    status: "published",
    summary: faker.lorem.sentence(),
    authorType,
    author: authorId,
    tags: ["interview", "tips"],
  };
  return await Article.create({ ...defaultAttrs, ...attrs });
};

/**
 * Creates a connection request.
 */
export const createConnectionRequest = async (requesterId, recipientId, status = "pending") => {
  return await Connection.create({
    requester: requesterId,
    recipient: recipientId,
    status,
  });
};

/**
 * Creates a job application in the database.
 */
export const createApplication = async (jobId, userId, attrs = {}) => {
  const defaultAttrs = {
    job: jobId,
    user: userId,
    resume: "https://example.com/test-resume.pdf",
    coverLetter: "I would be a great fit for this position.",
    status: "applied",
  };
  return await Application.create({ ...defaultAttrs, ...attrs });
};
