import { NextResponse } from "next/server";
import User from "@/lib/models/User";
import { connectMongodb } from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(req) {
  await connectMongodb();
  const body = await req.json();
  const { username, email, password } = body;

  if (!username || !email || !password) {
    return NextResponse.json(
      { message: "All fields are required!" },
      { status: 400 },
    );
  }
  try {
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists!" },
        { status: 400 },
      );
    }
    const hashedPassword = await bcrypt.hash(
      password,
      Number(process.env.BCRYPT_SALT_ROUNDS || 10),
    );
    const user = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
    });
    // Never return the hash or sensitive fields to the client
    const safeUser = {
      _id: user._id,
      username: user.username,
      email: user.email,
      verify: user.verify,
    };
    return NextResponse.json(
      {
        registeration: {
          success: true,
          user: safeUser,
        },
        message: "User registered successfully!",
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        registeration: { success: false },
        message: "User registration failed!",
        error: error?.message,
      },
      { status: 500 },
    );
  }
}
