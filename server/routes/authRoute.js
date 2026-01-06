import { Router } from "express";
import {
  register,
  login,
  logout,
  refresh,
} from "../controllers/authControllers.js";
const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/refresh", refresh);

export default router;
