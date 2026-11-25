import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeToken } from "@/utils/jwt";
import { connectMongodb } from "@/lib/db";
import User from "@/lib/models/User";

export async function POST(req) {
  try {
    const cookie = await cookies();
    const token = cookie.get("token");
    if (!token) {
      return NextResponse.json({ isLoggedIn: false }, { status: 401 });
    }const decodedToken = await decodeToken(token.value);
    if (!decodedToken) {
      return NextResponse.json({ isLoggedIn: false }, { status: 401 });
    }
    await connectMongodb();
    const user = await User.findOne({ _id: decodedToken.id });
    if (!user) {
      return NextResponse.json({ isLoggedIn: false }, { status: 200 });
    }
    return NextResponse.json({ isLoggedIn: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ isLoggedIn: false }, { status: 200 });
  }
}
