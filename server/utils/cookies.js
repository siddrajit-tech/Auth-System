const refreshCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  path: "/auth/refresh",
};

export function sendRefreshToken(res, refreshToken) {
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
}

export function clearRefreshToken(res) {
  res.clearCookie("refreshToken", refreshCookieOptions);
}
