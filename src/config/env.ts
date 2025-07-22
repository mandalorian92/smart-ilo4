import dotenv from "dotenv";
dotenv.config();

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
};

export const ILO_HOST = required("ILO_HOST");
export const ILO_USERNAME = required("ILO_USERNAME");
export const ILO_PASSWORD = required("ILO_PASSWORD");
export const PORT = process.env.PORT || "3000";