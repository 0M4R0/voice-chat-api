import {
  register as authRegister,
  login as authLogin,
  refreshToken as authRefreshToken,
  logout as authLogout,
  getMe as authMe,
} from "../services/auth.service";
import { Request, Response } from "express";

export const registerUser = async (req: Request, res: Response) => {
  try {
    const result = await authRegister(req.body);
    if (result.status) {
      return res.status(result.status).json({ message: result.message });
    }
    res.status(201).json({ message: result.message, user: result.user });
  } catch (error: any) {
    console.error("Registration Error:", error);
    return res.status(500).json({
      message: "An unexpected error occurred",
    });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const result = await authLogin(req.body);
    if (result.status) {
      return res.status(result.status).json({ message: result.message });
    }

    // Create cookie for refresh token
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    // Send access token and user info
    res.status(200).json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error: any) {
    console.error("Login Error:", error);
    return res.status(500).json({
      message: "An unexpected error occurred",
    });
  }
};

export const refreshTokenUser = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(401).json({ message: "Unauthorized" });

    const { accessToken, refreshToken: newRefreshToken } =
      await authRefreshToken(refreshToken);

    // Send access token and user info
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ accessToken });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(401).json({ message: "Unauthorized" });
    const { message } = await authLogout(refreshToken);

    // Clear the refresh token cookie from the client
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    res.status(200).json({ message });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    const user = await authMe(req.userId as string);
    res.status(200).json(user);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message });
  }
};
