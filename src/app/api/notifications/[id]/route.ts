import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server";
import { reportError } from "@/lib/report-error";

export async function DELETE(
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
    result = await prisma.userNotification.deleteMany({
      where: { id, userId: session.user.id }
    });
  } catch (e) {
    if (e instanceof Error) {
      reportError(e, { notificationId: id, route: "DELETE /api/notifications/:id" });
      return NextResponse.json(
        { error: "Cannot delete notification" },
        { status: 500 }
      );
    }

    reportError("Unknown error when deleting notification", { notificationId: id, route: "DELETE /api/notifications/:id" });
    return NextResponse.json(
      { error: "Unknown error when deleting notification" },
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
