import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyEmailOtp } from "@/lib/mailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, otp, password } = body;

    if (!name || !phone || !email || !otp || !password) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ Họ tên, Số điện thoại, Email, Mã OTP và Mật khẩu!" },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim();
    const cleanEmail = email.trim().toLowerCase();
    const ADMIN_PHONE = process.env.ADMIN_PHONE || "0988888888";

    if (cleanPhone === ADMIN_PHONE) {
      return NextResponse.json(
        { error: "Số điện thoại này thuộc tài khoản Quản trị viên (Admin) duy nhất của Studio. Vui lòng chuyển sang Đăng nhập!" },
        { status: 409 }
      );
    }

    // Verify OTP sent to Email
    const otpVerification = verifyEmailOtp(cleanEmail, String(otp));
    if (!otpVerification.valid) {
      return NextResponse.json(
        { error: otpVerification.reason || "Mã OTP không hợp lệ!" },
        { status: 400 }
      );
    }

    // Check existing phone or email
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ phone: cleanPhone }, { email: cleanEmail }],
      },
    });

    if (existingUser) {
      if (existingUser.phone === cleanPhone) {
        return NextResponse.json(
          { error: "Số điện thoại này đã được đăng ký tài khoản!" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Địa chỉ Email này đã được đăng ký tài khoản!" },
        { status: 409 }
      );
    }

    // All newly registered accounts are strictly CLIENT
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        phone: cleanPhone,
        email: cleanEmail,
        password,
        role: "CLIENT",
      },
    });

    return NextResponse.json(
      {
        message: "Đăng ký tài khoản thành công!",
        user: {
          id: newUser.id,
          name: newUser.name,
          phone: newUser.phone,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi đăng ký tài khoản." },
      { status: 500 }
    );
  }
}
