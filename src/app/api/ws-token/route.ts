import { auth } from "@/lib/auth";
import { SignJWT } from "jose";
import { NextResponse } from "next/server";

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET);

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const token = await new SignJWT({})
  .setProtectedHeader({ alg: "HS256" })
  .setSubject(session.user.id)
  .setAudience("socket")
  .setIssuedAt()
  .setExpirationTime("15m")
  .sign(secret());

  return NextResponse.json({ token });
}
