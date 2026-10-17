import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateAndSaveEmailOtp, sendRegistrationOtpEmail } from "@/lib/mailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, phone, name } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Vui lòng nhập địa chỉ Email hợp lệ để nhận mã OTP!" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone?.trim();
    const ADMIN_PHONE = process.env.ADMIN_PHONE || "0988888888";

    if (cleanPhone && cleanPhone === ADMIN_PHONE) {
      return NextResponse.json(
        { error: "Số điện thoại này thuộc tài khoản Admin duy nhất của Studio. Vui lòng chuyển sang Đăng nhập!" },
        { status: 409 }
      );
    }

    // Check if phone or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
          { email: cleanEmail },
        ],
      },
    });

    if (existingUser) {
      if (cleanPhone && existingUser.phone === cleanPhone) {
        return NextResponse.json(
          { error: "Số điện thoại này đã được đăng ký tài khoản!" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Địa chỉ Email này đã được sử dụng cho một tài khoản khác!" },
        { status: 409 }
      );
    }

    const otp = generateAndSaveEmailOtp(cleanEmail);
    const mailResult = await sendRegistrationOtpEmail(cleanEmail, otp, name);

    if (mailResult.sentViaSmtp) {
      return NextResponse.json({
        success: true,
        sentViaSmtp: true,
        message: `Đã gửi mã OTP (6 số) tới hộp thư ${cleanEmail}. Vui lòng kiểm tra Email (kể cả mục Spam/Thư rác)!`,
      });
    }

    // Fallback when SMTP_USER / SMTP_PASS is not yet configured in .env
    return NextResponse.json({
      success: true,
      sentViaSmtp: false,
      devOtp: otp,
      message: `Đã tạo mã OTP cho ${cleanEmail}. (Lưu ý: Bạn chưa điền SMTP_USER/SMTP_PASS trong .env nên hệ thống hiển thị mã OTP tạm thời để test: ${otp})`,
    });
  } catch (error: any) {
    console.error("Send OTP Error:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi gửi mã OTP qua Email." },
      { status: 500 }
    );
  }
}
