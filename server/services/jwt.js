import jwt from "jsonwebtoken";
import { loadEnvFile } from "process";

if (process.env.NODE_ENV !== "production") {
  loadEnvFile();
}
const secret = process.env.JWT_SECRET;

export function setUser(user) {
  try {
    return jwt.sign(user, secret, {expiresIn: "24h"});
  } catch (error) {
    console.error("Error signing JWT:", error);
    return null;
  }
}

export function getUser(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    console.error("Error verifying JWT:", error);
    return null;
  }
}
