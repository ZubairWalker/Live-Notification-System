import { Router } from "express";
import { UserModel } from "../models/User.js";
import { signToken } from "../utils/jwt.js";

export const authRouter = Router();

async function findOrCreateUser(username: string) {
  try {
    return await UserModel.findOneAndUpdate(
      { username },
      { $setOnInsert: { username } },
      { new: true, upsert: true, runValidators: true },
    );
  } catch (error: unknown) {
    // A parallel first login may win the unique-index race. Fetch its user instead.
    if ((error as { code?: number }).code === 11000) {
      const user = await UserModel.findOne({ username });
      if (user) return user;
    }
    throw error;
  }
}

authRouter.post("/login", async (req, res, next) => {
  try {
    const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
    if (!username || username.length > 50) {
      res.status(400).json({ message: "username must be between 1 and 50 characters" });
      return;
    }

    const user = await findOrCreateUser(username);

    const publicUser = { id: user._id.toString(), username: user.username };
    res.json({ token: signToken({ userId: publicUser.id, username: publicUser.username }), user: publicUser });
  } catch (error) {
    next(error);
  }
});
