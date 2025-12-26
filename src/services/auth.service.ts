import { User } from "../models/User";
import { generateDiscriminator } from "../utils/generateDiscriminator";
import bcryptjs from "bcryptjs";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";

const MAX_ATTEMPTS: number = Number(process.env.MAX_LOGIN_ATTEMPTS);
const LOCK_DURATION: number = Number(process.env.LOCK_MINUTES) * 60 * 1000;

export async function register(data: any) {
  const { username, email, password } = data;

  // Validate input
  if (!username || !email || !password) {
    return {
      status: 400,
      message: "Username, email and password are required",
    };
  }

  // Check if username is valid (length)
  if (username.trim().length < 3 || username.trim().length > 20) {
    return {
      status: 400,
      message: "Username must be between 3 and 20 characters",
    };
  }

  // Check if username is valid (special characters)
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return {
      status: 400,
      message: "Username can only contain letters, numbers and underscores",
    };
  }

  // Email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      status: 400,
      message: "Please enter a valid email address",
    };
  }

  // Check length
  if (password.length < 6) {
    return {
      status: 400,
      message: "Password must be at least 6 characters",
    };
  }

  // Check if the user exists by email
  const existsByEmail = await User.exists({ email: email.toLowerCase() });
  if (existsByEmail)
    return { status: 400, message: "Email already registered" };

  // Generate discriminator
  const discriminatorRegistered = await generateDiscriminator(username.trim());
  const hashed = bcryptjs.hashSync(password, 12);

  // Create user
  const user = await User.create({
    username: username.trim(),
    email: email.toLowerCase(),
    discriminator: discriminatorRegistered,
    password: hashed,
    refreshTokens: [],
  });

  return {
    user: {
      id: user._id,
      username: user.username,
      discriminator: user.discriminator,
      email: user.email,
    },
    message: "Account created successfully",
  };
}

export async function login(data: any) {
  const { email, password } = data;
  if (!email || !password)
    return { status: 400, message: "Missing credentials" };

  // Look for user by email
  const user = await User.findOne({ email: email.toLowerCase() });

  // Avoid timing attacks
  if (!user) {
    await bcryptjs.compare(password, "$2b$10$fakehashavoidstimingattacks");
    return { status: 404, message: "Invalid credentials" };
  }

  // Check account lock status
  if (user.lockUntil && user.lockUntil > new Date()) {
    return {
      status: 429,
      message: "Account locked. Try again later.",
    };
  }

  // Check password match
  const isMatch: boolean = await bcryptjs.compare(password, user.password);

  if (!isMatch) {
    user.failedLoginAttempts++;

    if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_DURATION);
    }

    await user.save();
    return { status: 401, message: "Invalid credentials" };
  }

  // tokens
  const accessToken: string = generateAccessToken(user._id.toString());
  const refreshToken: string = generateRefreshToken(user._id.toString());

  // Remove expired tokens & limit to 5 tokens
  const now = new Date();
  const validTokens = user.refreshTokens
    .filter((rt) => rt.expiresAt > now)
    .slice(-4); // Leave space for the new token

  user.refreshTokens = [
    ...validTokens,
    {
      token: refreshToken,
      expiresAt: expirationDate(),
      createdAt: now,
    },
  ];

  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      username: user.username,
      discriminator: user.discriminator,
    },
  };
}

/**
 * Refresh token service
 * Receives a refresh token and returns a new access token and refresh token.
 */
export async function refreshToken(refreshToken: string) {
  if (!refreshToken) return { status: 401, message: "Unauthorized" };

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    return { status: 403, message: "Invalid token" };
  }

  const user = await User.findById(payload.userId);
  if (!user) return { status: 403, message: "User not found" };

  const validToken = user.refreshTokens.find(
    (rt) => rt.token === refreshToken && rt.expiresAt > new Date(),
  );

  if (!validToken) {
    user.refreshTokens = [];
    await user.save();
    return { status: 403, message: "Invalid token" };
  }

  user.refreshTokens = user.refreshTokens.filter(
    (rt) => rt.token !== refreshToken,
  );

  // Generate new access and refresh token
  const newRefreshToken: string = generateRefreshToken(user._id.toString());
  const newAccessToken: string = generateAccessToken(user._id.toString());

  // Save new tokens to user's refreshTokens array
  user.refreshTokens.push({
    token: newRefreshToken,
    expiresAt: expirationDate(),
    createdAt: new Date(),
  });

  await user.save();

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logout(refreshToken: string) {
  if (refreshToken) {
    // Delete token from user's refreshTokens array
    await User.updateOne(
      { "refreshTokens.token": refreshToken },
      { $pull: { refreshTokens: { token: refreshToken } } },
    );
  }

  return { message: "Logged out" };
}

export async function getMe(userId: string) {
  const user = await User.findById(userId).select("-password -refreshTokens");
  return user;
}

// Expiration date for refresh tokens
// 30 days
function expirationDate(): Date {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}
