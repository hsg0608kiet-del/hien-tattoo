import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendBookingReminderEmails, BookingReminderPayload } from "@/lib/mailer";

export async function runBookingReminderJob(options?: {
  bookingId?: string;
  hoursAhead?: number;
  force?: boolean;
}) {
  const now = new Date();
  const hoursAhead = options?.hoursAhead || 24;
  const upcomingWindow = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  let bookingsToRemind: any[] = [];

  if (options?.bookingId) {
    const single = await prisma.booking.findUnique({
      where: { id: options.bookingId },
      include: {
        customer: true,
        artist: true,
        portfolioItem: true,
        customRequest: true,
        quote: true,
      },
    });
    if (single) bookingsToRemind = [single];
  } else {
    // Find all upcoming bookings within the next `hoursAhead` hours that haven't been reminded yet
    const allCandidates = await prisma.booking.findMany({
      where: {
        status: {
          in: ["APPROVED", "CONFIRMED", "PENDING_DEPOSIT"],
        },
        startTime: {
          gte: now,
          lte: upcomingWindow,
        },
      },
      include: {
        customer: true,
        artist: true,
        portfolioItem: true,
        customRequest: true,
        quote: true,
      },
      orderBy: { startTime: "asc" },
    });

    bookingsToRemind = options?.force
      ? allCandidates
      : allCandidates.filter((b: any) => !b.reminderSent);
  }

  const results: any[] = [];

  for (const b of bookingsToRemind) {
    const customerEmail =
      b.customer?.email || `${b.customer?.phone || "client"}@hientattoo.vn`;

    const tattooTitle = b.portfolioItem
      ? `Mẫu Portfolio: ${b.portfolioItem.title}`
      : b.customRequest
      ? `Thiết kế Custom riêng (${b.customRequest.placement} - ${b.customRequest.size})`
      : "Dịch vụ Xăm Nghệ Thuật";

    const placement =
      b.portfolioItem?.placement || b.customRequest?.placement || undefined;

    const payload: BookingReminderPayload = {
      bookingId: b.id,
      customerName: b.customer?.name || "Quý khách",
      customerPhone: b.customer?.phone || "Chưa cập nhật",
      customerEmail,
      artistName: b.artist?.name || "Hiển Tattoo (Chủ Studio)",
      tattooTitle,
      placement,
      startTime: b.startTime,
      endTime: b.endTime,
      durationMin: b.durationMin || b.quote?.durationMin || 90,
      totalPrice: b.totalPrice || b.quote?.totalPrice || 1500000,
      depositAmount: b.depositAmount || b.quote?.depositAmount || 375000,
      status: b.status,
      note: b.note,
    };

    const mailRes = await sendBookingReminderEmails(payload);

    // Mark reminder as sent in DB using raw execute so it works even without restarting Prisma DLL
    try {
      await prisma.$executeRawUnsafe(
        `UPDATE "Booking" SET "reminderSent" = 1, "reminderSentAt" = CURRENT_TIMESTAMP WHERE "id" = ?`,
        b.id
      );
    } catch (e) {
      console.error("Failed to mark reminderSent:", e);
    }

    results.push({
      bookingId: b.id,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      startTime: b.startTime,
      customerSent: mailRes.customerSent,
      ownerSent: mailRes.ownerSent,
      previewCustomerHtml: mailRes.customerHtml,
      previewOwnerHtml: mailRes.ownerHtml,
    });
  }

  return {
    checkedAt: now.toISOString(),
    remindedCount: results.length,
    results,
  };
}

// GET /api/cron/reminders -> Used by automatic Cron / Background Scheduler
export async function GET() {
  try {
    const summary = await runBookingReminderJob({ hoursAhead: 24, force: false });
    return NextResponse.json({
      message: `Job nhắc lịch hẹn đã chạy thành công! Đã gửi nhắc lịch cho ${summary.remindedCount} ca xăm sắp tới.`,
      ...summary,
    });
  } catch (error: any) {
    console.error("Cron Reminder Error:", error);
    return NextResponse.json(
      { error: "Lỗi khi chạy Job nhắc lịch hẹn." },
      { status: 500 }
    );
  }
}

// POST /api/cron/reminders -> Used by Admin Dashboard to trigger reminder manually or for a specific booking
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { bookingId, hoursAhead = 48, force = true } = body;

    const summary = await runBookingReminderJob({
      bookingId,
      hoursAhead,
      force,
    });

    return NextResponse.json({
      message:
        summary.remindedCount > 0
          ? `Đã gửi Email HTML nhắc lịch cho Chủ Studio & Khách hàng (${summary.remindedCount} lịch hẹn)!`
          : "Hiện không có lịch hẹn nào sắp diễn ra trong khung giờ tới.",
      ...summary,
    });
  } catch (error: any) {
    console.error("Manual Reminder Error:", error);
    return NextResponse.json(
      { error: "Lỗi khi kích hoạt gửi mail nhắc lịch." },
      { status: 500 }
    );
  }
}
