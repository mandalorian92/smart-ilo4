import dotenv from "dotenv";
dotenv.config();

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
};

const optional = (name: string): string | undefined => {
  return process.env[name];
};

// iLO configuration - now optional, can be configured via API
export const ILO_HOST = optional("ILO_HOST");
export const ILO_USERNAME = optional("ILO_USERNAME");
export const ILO_PASSWORD = optional("ILO_PASSWORD");
export const PORT = process.env.PORT || "3000";