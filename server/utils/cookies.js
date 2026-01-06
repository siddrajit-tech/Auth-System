import jwt from "jsonwebtoken";

const refreshCookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: "strict",
  path: "/",
};

export function sendRefreshToken(res, refreshToken) {
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
}

export function clearRefreshToken(res) {
  res.clearCookie("refreshToken", refreshCookieOptions);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
}
