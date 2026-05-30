import mongoose from "mongoose";
import { jest } from "@jest/globals";

// Set environment variables for testing
process.env.NODE_ENV = "test";
process.env.PORT = "5001";
process.env.JWT_SECRET_KEY = "test_jwt_secret_key_12345_very_secure_and_long_enough";
process.env.MONGO_URI = process.env.MONGO_URI_TEST || "mongodb://127.0.0.1:27017/careerconnect_test";
process.env.BREVO_API_KEY = "test_brevo_api_key";
process.env.RESEND_API_KEY = "re_test_key";
process.env.CLOUDINARY_CLOUD_NAME = "test_cloud";
process.env.CLOUDINARY_API_KEY = "test_api_key";
process.env.CLOUDINARY_API_SECRET = "test_api_secret";
process.env.FRONTEND_URL = "http://localhost:5173";

// Global mocks
jest.mock("sib-api-v3-sdk", () => {
  const mockSdk = {
    ApiClient: {
      instance: {
        authentications: {
          "api-key": {}
        }
      }
    },
    TransactionalEmailsApi: jest.fn().mockImplementation(() => {
      return {
        sendTransacEmail: jest.fn().mockResolvedValue(true)
      };
    })
  };
  return {
    ...mockSdk,
    default: mockSdk
  };
});

jest.mock("resend", () => {
  return {
    Resend: jest.fn().mockImplementation(() => {
      return {
        emails: {
          send: jest.fn().mockResolvedValue({ id: "test-email-id" })
        }
      };
    })
  };
}, { virtual: true });

jest.mock("cloudinary", () => {
  return {
    v2: {
      config: jest.fn(),
      uploader: {
        upload: jest.fn().mockResolvedValue({
          secure_url: "https://cloudinary.com/test-image.jpg",
          public_id: "test_public_id"
        }),
        destroy: jest.fn().mockResolvedValue({ result: "ok" })
      }
    }
  };
});

jest.mock("multer-storage-cloudinary", () => {
  return {
    CloudinaryStorage: jest.fn().mockImplementation(() => {
      return {};
    })
  };
});

beforeAll(async () => {
  // Silence console.info logs during tests, but keep error logs if needed
  jest.spyOn(console, "log").mockImplementation(() => {});
  
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }

  // Stub startTransaction/commitTransaction to run on standalone MongoDB
  const originalStartSession = mongoose.startSession;
  mongoose.startSession = async function (...args) {
    const session = await originalStartSession.apply(this, args);
    session.startTransaction = function () {};
    session.commitTransaction = function () {};
    session.abortTransaction = function () {};
    return session;
  };
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});
