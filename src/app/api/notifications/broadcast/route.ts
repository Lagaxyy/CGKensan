import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server";
import { publishSocketEvent } from "@/lib/socket";
import { reportError } from "@/lib/report-error";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id || !session?.user?.role || session.user.role !== "admin") {
    reportError("Unauthorized broadcast attempt", { userId: session?.user?.id, role: session?.user?.role });
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json();
  if (
    typeof body?.title !== "string" || !body.title.length || body.title.length > 200 ||
    (body?.message && typeof body.message !== "string") ||
    (body?.type && (typeof body.type !== "string" || !["info", "error", "warning", "success"].includes(body.type))) ||
    typeof body?.userIds !== "object" || !body.userIds.every((userId: string) => userId.length > 0)
  ) {
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 }
    );
  }

  const uniqueUserIds = [...new Set(body.userIds as string[])];
  // const existingUsers = await prisma.user.findMany({
  //   where: { id: { in: uniqueUserIds } },
  //   select: { id: true }
  // });
  // if (existingUsers.length !== uniqueUserIds.length) {
  //   return NextResponse.json(
  //     { error: "One or more recipients do not exist" },
  //     { status: 400 }
  //   );
  // }

  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
      const notification = await tx.notification.create({
        data: {
          title: body.title,
          message: body?.message,
          type: body?.type
        }
      });

      const userNotifications = await Promise.all(
        uniqueUserIds.map(uid =>
          tx.userNotification.create({
            data: {
              userId: uid,
              notificationId: notification.id
            }
          })
        )
      );

      return {
        notificationId: notification.id,
        data: {
          title: notification.title,
          message: notification.message,
          type: notification.type
        },
        userNotifications
      };
    })
  } catch (e) {
    if (e instanceof Error) {
      reportError(e, { route: "POST /api/notifications/broadcast" });
      return NextResponse.json(
        { error: "Cannot create notifications" },
        { status: 500 }
      );
    }

    reportError("Unknown error when creating notifications", { route: "POST /api/notifications/broadcast" });
    return NextResponse.json(
      { error: "Unknown error when creating notifications" },
      { status: 500 }
    );
  }

  for (const userNotification of result.userNotifications) {
    await publishSocketEvent({
      channel: "notification",
      room: userNotification.userId,
      data: {
        id: userNotification.id,
        userId: userNotification.userId,
        title: result.data.title,
        message: result.data.message,
        type: result.data.type,
        read: false,
        createdAt: userNotification.createdAt.toISOString()
      }
    });
  }

  return NextResponse.json(
    { count: result.userNotifications.length, notificationId: result.notificationId },
    { status: 201 }
  )
}
