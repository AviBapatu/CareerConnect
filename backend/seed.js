import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import Company from "./models/Company.js";
import Article from "./models/Article.js";
import Application from "./models/Application.js";
import Job from "./models/Job.js";
import { faker } from "@faker-js/faker";
import dotenv from "dotenv"; //env

dotenv.config();
const MONGO_URI = process.env.MONGO_URI;


async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB");

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Company.deleteMany({}),
    Article.deleteMany({}),
    Application.deleteMany({}),
    Job.deleteMany({}),
  ]);
  console.log("Cleared data ");
  // --- INDUSTRY ENUMS ---
  const industries = [
    "Technology",
    "Finance",
    "Healthcare",
    "Education",
    "Retail",
    "Manufacturing",
    "Construction",
    "Transportation",
    "Hospitality",
    "Real Estate",
    "Energy",
    "Telecommunications",
    "Media",
    "Entertainment",
    "Legal",
    "Consulting",
    "Government",
    "Nonprofit",
    "Agriculture",
    "Aerospace",
    "Automotive",
    "Pharmaceutical",
    "Food & Beverage",
    "Insurance",
    "Logistics",
    "Marketing",
    "Advertising",
    "Research",
    "Sports",
    "Travel",
    "Utilities",
    "Other",
  ];

  // Seed Users (increase volume)
  const users = [];
  for (let i = 0; i < 200; i++) {
    const hashedPassword = await bcrypt.hash("Password123!", 10);
    users.push(
      new User({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedPassword,
        role: i < 40 ? "recruiter" : "candidate",
        headline: faker.person.jobTitle(),
        about: faker.lorem.sentences(2),
        location: faker.location.city(),
        skills: faker.helpers
          .shuffle([
            "JavaScript",
            "React",
            "Node.js",
            "Python",
            "MongoDB",
            "AWS",
            "Docker",
            "TypeScript",
            "SQL",
            "C++",
            "Go",
            "Ruby",
            "PHP",
            "Swift",
            "Kotlin",
            "Scala",
            "Rust",
          ])
          .slice(0, 4),
        isOpenToWork: i % 2 === 0,
        social: {
          github: faker.internet.username(),
          linkedin: faker.internet.username(),
          twitter: faker.internet.username(),
          portfolio: faker.internet.url(),
        },
        experience: [
          {
            title: faker.person.jobTitle(),
            company: faker.company.name(),
            startDate: faker.date.past({ years: 5 }),
            endDate: faker.date.recent(),
            description: faker.lorem.sentence(),
          },
        ],
        education: [
          {
            degree: "B.Tech",
            school: faker.company.name() + " University",
            startDate: faker.date.past({ years: 10 }),
            endDate: faker.date.past({ years: 5 }),
            fieldOfStudy: "Computer Science",
          },
        ],
      })
    );
  }
  await User.insertMany(users);
  console.log("✅ Seeded Users");

  // Seed 100 Companies, each with a unique industry (repeat industries if needed)
  const companies = [];
  for (let i = 0; i < 100; i++) {
    const industry = industries[i % industries.length];
    companies.push(
      new Company({
        name: faker.company.name() + " " + i,
        industry,
        description: faker.company.catchPhrase(),
        location: faker.location.city(),
        website: faker.internet.url(),
        size: faker.helpers.arrayElement([
          "1-10",
          "11-50",
          "51-200",
          "201-500",
          "501-1000",
          "1000+",
        ]),
        logo: faker.image.urlPicsumPhotos({ width: 300, height: 300 }),
        admins: [users[i]._id],
        members: [
          {
            user: users[i]._id,
            role: "admin",
          },
        ],
        specialties: faker.helpers.arrayElements(
          [
            "Cloud Computing",
            "AI",
            "ML",
            "Blockchain",
            "IoT",
            "Cybersecurity",
            "E-commerce",
            "Fintech",
            "Edtech",
            "Medtech",
            "SaaS",
            "PaaS",
            "DevOps",
            "Big Data",
            "Analytics",
            "Mobile Apps",
            "Web Apps",
            "AR/VR",
            "Gaming",
            "Robotics",
          ],
          3
        ),
        benefits: faker.helpers.arrayElements(
          [
            "Health Insurance",
            "Remote Work",
            "Flexible Hours",
            "Stock Options",
            "Paid Time Off",
            "Retirement Plan",
            "Wellness Programs",
            "Learning Budget",
          ],
          3
        ),
        socialLinks: {
          linkedin: faker.internet.url(),
          twitter: faker.internet.url(),
          github: faker.internet.url(),
        },
        foundedYear: faker.date.past({ years: 50 }).getFullYear(),
        verified: faker.datatype.boolean(),
      })
    );
  }
  await Company.insertMany(companies);
  console.log("✅ Seeded Companies");

  // Seed Jobs (increase volume)
  const jobs = [];
  for (let i = 0; i < 300; i++) {
    const company = companies[i % companies.length];
    jobs.push(
      new Job({
        title: faker.person.jobTitle(),
        description: faker.lorem.paragraph(),
        requirements: faker.helpers.arrayElements(
          [
            "JavaScript",
            "React",
            "Node.js",
            "MongoDB",
            "AWS",
            "Docker",
            "TypeScript",
            "SQL",
            "C++",
            "Go",
            "Ruby",
            "PHP",
            "Swift",
            "Kotlin",
            "Scala",
            "Rust",
          ],
          4
        ),
        company: company._id,
        companyName: company.name,
        location: faker.location.city(),
        type: faker.helpers.arrayElement([
          "full-time",
          "part-time",
          "internship",
          "contract",
          "freelance",
          "remote",
        ]),
        industry: company.industry,
        postedBy: users[i % users.length]._id,
        status: faker.helpers.arrayElement(["active", "closed", "draft"]),
        salaryRange: {
          min: faker.number.int({ min: 30000, max: 80000 }),
          max: faker.number.int({ min: 80001, max: 200000 }),
        },
        applicationInstructions: faker.lorem.sentence(),
        logoUrl: company.logo,
      })
    );
  }
  await Job.insertMany(jobs);
  console.log("✅ Seeded Jobs");

  // Seed Articles (increase volume)
  const articles = [];
  for (let i = 0; i < 100; i++) {
    const isUserAuthor = faker.datatype.boolean();
    const authorType = isUserAuthor ? "User" : "Company";
    const author =
      authorType === "User"
        ? users[faker.number.int({ min: 0, max: users.length - 1 })]._id
        : companies[faker.number.int({ min: 0, max: companies.length - 1 })]
            ._id;

    articles.push(
      new Article({
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(3),
        category: faker.helpers.arrayElement([
          "Interview Tips",
          "Resume Writing",
          "Career Development",
          "Industry Trends",
          "Job Search",
          "Networking",
          "Professional Skills",
          "Workplace Culture",
          "General",
        ]),
        status: faker.helpers.arrayElement(["draft", "published"]),
        featuredImage: faker.image.url(),
        summary: faker.lorem.sentences(2),
        authorType,
        author,
        tags: faker.helpers.arrayElements(
          ["career", "jobs", "networking", "skills", "growth"],
          3
        ),
      })
    );
  }
  await Article.insertMany(articles);
  console.log("✅ Seeded Articles");

  // Seed Applications (increase volume)
  const applications = [];
  for (let i = 0; i < 500; i++) {
    const user = users[faker.number.int({ min: 0, max: users.length - 1 })];
    const job = jobs[faker.number.int({ min: 0, max: jobs.length - 1 })];
    applications.push(
      new Application({
        job: job._id,
        user: user._id,
        resume: faker.internet.url() + "/resume.pdf",
        coverLetter: faker.lorem.sentences(2),
        status: faker.helpers.arrayElement([
          "applied",
          "reviewed",
          "interview",
          "hired",
          "rejected",
        ]),
      })
    );
  }
  await Application.insertMany(applications);
  console.log("✅ Seeded Applications");

  await mongoose.disconnect();
  console.log("✅ Seeding complete!");
}

seed().catch((err) => {
  console.error("❌ Seeding error:", err);
  process.exit(1);
});
