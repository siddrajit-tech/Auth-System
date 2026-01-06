import bcrypt from "bcrypt";
import { User } from "../models/User.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import {
  clearRefreshToken,
  sendRefreshToken,
  verifyRefreshToken,
} from "../utils/cookies.js";

export async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    // Check if both email and pwd is entered
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Enter all fields",
      });
    }

    //Check is user exists
    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });

    //Hash password and create new user in db
    const hashedPwd = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPwd,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Registraion error", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during registration",
    });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Check if fields are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    //check if email is valid
    const user = await User.findOne({ email }).select("+password");
    if (!user)
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });

    //check if password is valid
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });

    //generate both tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    //save refresh token in db
    user.refreshToken = refreshToken;
    await user.save();

    //send access token via json and refresh token via cookie
    sendRefreshToken(res, refreshToken);
    res.json({
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during login",
    });
  }
}

export async function logout(req, res) {
  try {
    const token = req.cookies.refreshToken;

    //check if user with token exists and delete token in db
    try {
      if (token) {
        await User.findOneAndUpdate(
          { refreshToken: token },
          { refreshToken: null }
        );
      }
    } catch (error) {
      console.log("Invalid refresh token during logout");
    }

    clearRefreshToken(res);
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Login error", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during logout",
    });
  }
}

export async function refresh(req, res) {
  try {
    // Extract refresh token from cookie
    const token = req.cookies.refreshToken;
    console.log("1. Token from cookie:", token);

    if (!token)
      return res.status(401).json({
        success: false,
        message: "Refresh token required",
      });

    // Verify the token signature and expiration
    let payload;
    try {
      payload = verifyRefreshToken(token);
      console.log("2. Token verified! Payload:", payload);
    } catch (error) {
      console.log("2. Token verification FAILED:", error.message);
      // clear expired refresh token
      clearRefreshToken(res);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    //Find teh current user and validate
    const user = await User.findById(payload.userId);
    console.log("3. User found:", user ? "YES" : "NO");
    console.log("4. User ID:", user?._id);
    console.log("5. Token in DB:", user?.refreshToken);
    console.log("6. Token from request:", token);
    console.log("7. Tokens match:", user?.refreshToken === token);

    if (!user || user.refreshToken !== token) {
      clearRefreshToken(res);
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Geberate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    //  Save new refresh token (old one is now invalid)
    user.refreshToken = newRefreshToken;
    await user.save();

    // Send both tokens back
    sendRefreshToken(res, newRefreshToken); // Cookie
    res.json({
      success: true,
      accessToken: newAccessToken, // JSON response
    });
  } catch (error) {
    console.error("Refresh error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during token refresh",
    });
  }
}
