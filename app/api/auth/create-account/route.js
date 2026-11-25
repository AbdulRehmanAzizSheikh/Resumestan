import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import User from "@/lib/models/User";
import { connectMongodb } from "@/lib/db";

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, email, password } = body || {};

    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "All fields are required!" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long." },
        { status: 400 },
      );
    }

    await connectMongodb();
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

    const response = NextResponse.json(
      { registration: { success: true }, message: "Account created successfully!" },
      { status: 201 },
    );
    response.cookies.set("verification_email", user.email, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        registration: { success: false },
        message: "User registration failed!",
        error,
      },
      { status: 500 },
    );
  }
}
