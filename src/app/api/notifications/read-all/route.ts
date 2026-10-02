import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server";
import { reportError } from "@/lib/report-error";

export async function PATCH() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  let result;
  try {
    result = await prisma.userNotification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true }
    });
  } catch (e) {
    if (e instanceof Error) {
      reportError(e, { route: "PATCH /api/notifications/read-all" });
      return NextResponse.json(
        { error: "Cannot update all notifications" },
        { status: 500 }
      );
    }

    reportError("Unknown error when updating all notifications", { route: "PATCH /api/notifications/read-all" });
    return NextResponse.json(
      { error: "Unknown error when updating all notifications" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: true, count: result.count },
    { status: 200 }
  );
}
