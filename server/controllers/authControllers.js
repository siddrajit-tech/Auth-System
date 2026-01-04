import bcrypt from "bcrypt";
import { User } from "../models/User.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import { clearRefreshToken, sendRefreshToken } from "../utils/cookies.js";

export async function register(req, res) {
  const { username, email, password } = req.body;

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
}
export async function login(req, res) {
  const { email, password } = req.body;

  //check if email is valid
  const user = await User.findOne({ email });
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
}
export async function logout(req, res) {
  const token = req.cookies.refreshToken;

  //check if user with token exists and delete token in db
  if (token) {
    await User.findOneAndUpdate(
      { refreshToken: token },
      { refreshToken: null }
    );
  }

  clearRefreshToken(res);
  res.sendStatus(204);
}

export async function refresh() {}
