import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, password, email, role } = body;

    if (!name || !phone || !password) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ Họ tên, Số điện thoại và Mật khẩu/OTP." },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim();

    // Check existing phone
    const existingUser = await prisma.user.findUnique({
      where: { phone: cleanPhone },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Số điện thoại này đã được đăng ký tài khoản!" },
        { status: 409 }
      );
    }

    const validRole = role === "ADMIN" ? "ADMIN" : "CLIENT";

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        phone: cleanPhone,
        email: email?.trim() || `${cleanPhone}@hientattoo.vn`,
        password,
        role: validRole,
      },
    });

    return NextResponse.json(
      {
        message: "Đăng ký tài khoản thành công!",
        user: {
          id: newUser.id,
          name: newUser.name,
          phone: newUser.phone,
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
