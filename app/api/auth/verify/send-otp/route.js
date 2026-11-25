import { NextResponse } from "next/server";
import otpGenerator from "@/utils/otpGenerator";
import User from "@/lib/models/User";
import { connectMongodb } from "@/lib/db";
import sendMail from "@/utils/email/send";
import otpVerificationEmail from "@/utils/email/templates/otpVerificationEmail";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required!" },
        { status: 400 },
      );
    }

    await connectMongodb();
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        { message: "User not found! Please create an account first." },
        { status: 404 },
      );
    }

    const otp = otpGenerator(6);
    user.verify.otp.code = otp;
    user.verify.otp.expireAt = Date.now() + 10 * 60 * 1000;
    user.verify.status = false;
    await user.save();

    const html = otpVerificationEmail({
      otp,
      name: user.username || "User",
    });

    const emailResult = await sendMail({
      to: normalizedEmail,
      subject: "Your Verification OTP",
      htmlTemplate: html,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { message: "Failed to send verification email." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "Verification email sent successfully!" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error sending verification email:", error);
    return NextResponse.json(
      {
        message: "Error sending verification email",
        error,
      },
      { status: 500 },
    );
  }
}
