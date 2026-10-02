import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server";
import { publishSocketEvent } from "@/lib/socket";
import { reportError } from "@/lib/report-error";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  let userNotifications;
  try {
    userNotifications = await prisma.userNotification.findMany({
      include: { notification: true },
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50
    });
  } catch (e) {
    if (e instanceof Error) {
      reportError(e, { userId: session.user.id, route: "GET /api/notifications" });
      return NextResponse.json(
        { error: "Cannot retrieve notifications" },
        { status: 500 }
      );
    }

    reportError("Unknown error when retrieving notifications", { route: "GET /api/notifications" });
    return NextResponse.json(
      { error: "Unknown error when retrieving notifications" },
      { status: 500 }
    );
  }

  const mappedUserNotifications = userNotifications.map(userNotification => ({
    id: userNotification.id,
    userId: userNotification.userId,
    notificationId: userNotification.notification.id,
    title: userNotification.notification.title,
    message: userNotification.notification.message,
    type: userNotification.notification.type,
    read: userNotification.read,
    createdAt: userNotification.createdAt.toISOString()
  }));

  return NextResponse.json(
    { notifications: mappedUserNotifications },
    { status: 200 }
  )
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }
  const userId = session.user.id;

  const body = await req.json();
  if (
    typeof body?.title !== "string" || !body.title.length || body.title.length > 200 ||
    (body?.message && typeof body.message !== "string") ||
    (body?.type && (typeof body.type !== "string" || !["info", "error", "warning", "success"].includes(body.type)))
  ) {
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 }
    );
  }

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

      const userNotification = await tx.userNotification.create({
        data: {
          userId,
          notificationId: notification.id
        }
      });

      return { notification, userNotification };
    })
  } catch (e) {
    if (e instanceof Error) {
      reportError(e, { userId, route: "POST /api/notifications" });
      return NextResponse.json(
        { error: "Cannot create notification" },
        { status: 500 }
      )
    }

    reportError("Unknown error when creating notification", { userId, route: "POST /api/notifications" });
    return NextResponse.json(
      { error: "Unknown error when creating notification" },
      { status: 500 }
    )
  }

  await publishSocketEvent({
    channel: "notification",
    room: userId,
    data: {
      id: result.userNotification.id,
      userId: result.userNotification.userId,
      title: result.notification.title,
      message: result.notification.message,
      type: result.notification.type,
      read: false,
      createdAt: result.userNotification.createdAt.toISOString()
    }
  });

  return NextResponse.json(
    { success: true, id: result.userNotification.id },
    { status: 201 }
  );
}
