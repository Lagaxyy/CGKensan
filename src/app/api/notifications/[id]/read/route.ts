import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server";
import { reportError } from "@/lib/report-error";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
      where: { id, userId: session.user.id },
      data: { read: true }
    });
  } catch (e) {
    if (e instanceof Error) {
      reportError(e, { notificationId: id, route: "PATCH /api/notifications/:id/read" });
      return NextResponse.json(
        { error: "Cannot update notification" },
        { status: 500 }
      );
    }

    reportError("Unknown error when updating notification", { notificationId: id, route: "PATCH /api/notifications/:id/read" });
    return NextResponse.json(
      { error: "Unknown error when updating notification" },
      { status: 500 }
    );
  }

  if (result.count === 0) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { success: true },
    { status: 200 }
  );
}
