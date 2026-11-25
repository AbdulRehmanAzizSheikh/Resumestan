import { NextResponse } from "next/server";
import { connectMongodb } from "@/lib/db";
import User from "@/lib/models/User";
import { generateToken } from "@/utils/jwt";
import bcrypt from "bcrypt";

export async function POST(req) {
  await connectMongodb();
  const body = await req.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { message: "All fields are required!" },
      { status: 400 },
    );
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials!" },
        { status: 404 },
      );
    }
    const checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword) {
      return NextResponse.json(
        { message: "Invalid credentials!" },
        { status: 401 },
      );
    }

    // Block login for users who have not verified their email
    if (!user.verify?.status) {
      const response = NextResponse.json(
        { message: "Please verify your email before logging in.", unverified: true },
        { status: 403 },
      );
      response.cookies.set("verification_email", user.email, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60,
      });
      return response;
    }

    const token = generateToken({ id: user._id });
    const response = NextResponse.json(
      { message: "User login successfully!" },
      { status: 200 },
    );
    response.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { message: "User login failed!", error: error.message },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { message: "User login failed!", error: "Unknown error" },
      { status: 500 },
    );
  }
}
