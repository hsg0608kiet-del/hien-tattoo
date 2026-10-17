import nodemailer from "nodemailer";

interface OtpEntry {
  otp: string;
  expiresAt: number;
}

const globalForOtp = globalThis as unknown as {
  emailOtpStore: Map<string, OtpEntry> | undefined;
};

const emailOtpStore = globalForOtp.emailOtpStore ?? new Map<string, OtpEntry>();
if (process.env.NODE_ENV !== "production") {
  globalForOtp.emailOtpStore = emailOtpStore;
}

export function generateAndSaveEmailOtp(email: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  emailOtpStore.set(normalizedEmail, { otp, expiresAt });
  return otp;
}

export function verifyEmailOtp(email: string, otpInput: string): { valid: boolean; reason?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const cleanOtp = otpInput.trim();

  const record = emailOtpStore.get(normalizedEmail);
  if (!record) {
    return {
      valid: false,
      reason: "Chưa có mã OTP nào được gửi tới email này. Vui lòng bấm 'Gửi OTP Qua Email' trước!",
    };
  }

  if (Date.now() > record.expiresAt) {
    emailOtpStore.delete(normalizedEmail);
    return {
      valid: false,
      reason: "Mã OTP đã hết hạn (quá 5 phút). Vui lòng bấm gửi lại mã OTP mới!",
    };
  }

  if (record.otp !== cleanOtp) {
    return {
      valid: false,
      reason: "Mã OTP không chính xác. Vui lòng kiểm tra lại hộp thư Email của bạn!",
    };
  }

  emailOtpStore.delete(normalizedEmail);
  return { valid: true };
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM || `"HIỂN TATTOO STUDIO" <${user || "no-reply@hientattoo.vn"}>`;
  const adminEmail = process.env.ADMIN_EMAIL?.trim() || user || "admin@hientattoo.vn";
  return { host, port, user, pass, from, adminEmail };
}

async function sendSmtpMail(options: { to: string; subject: string; html: string }) {
  const { host, port, user, pass, from } = getSmtpConfig();

  if (!user || !pass) {
    console.log("==================================================");
    console.log(`[SMTP DEMO LOG] To: ${options.to} | Subject: ${options.subject}`);
    console.log("Hãy điền SMTP_USER và SMTP_PASS trong file .env để gửi email thật.");
    console.log("==================================================");
    return {
      sentViaSmtp: false,
      error: "Chưa cấu hình SMTP_USER / SMTP_PASS trong file .env",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to: options.to.trim(),
      subject: options.subject,
      html: options.html,
    });

    return { sentViaSmtp: true };
  } catch (err: any) {
    console.error("SMTP Send Error:", err);
    return {
      sentViaSmtp: false,
      error: err?.message || "Không thể kết nối máy chủ SMTP.",
    };
  }
}

export function buildOtpEmailHtml(otp: string, recipientName?: string): string {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:linear-gradient(145deg,#141417,#0d0d10);border:1px solid #27272a;border-radius:24px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.7);">
          <!-- Header Banner -->
          <tr>
            <td style="padding:32px 32px 24px 32px;text-align:center;border-bottom:1px solid #27272a;background:radial-gradient(circle at top,#27272a 0%,#141417 70%);">
              <div style="display:inline-block;padding:5px 14px;border-radius:999px;background:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.35);color:#fbbf24;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;">
                XÁC THỰC TÀI KHOẢN KHÁCH HÀNG
              </div>
              <h1 style="margin:0;font-size:26px;letter-spacing:3px;color:#ffffff;font-weight:800;">
                HIỂN <span style="font-weight:300;color:#a1a1aa;">TATTOO</span>
              </h1>
              <p style="margin:6px 0 0 0;font-size:12px;color:#71717a;letter-spacing:0.5px;">
                Cyberpunk &bull; Fine Line &bull; Dark Art Studio
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px 0;font-size:15px;color:#e4e4e7;line-height:1.6;">
                Xin chào <strong style="color:#ffffff;">${recipientName || "Quý khách"}</strong>,
              </p>
              <p style="margin:0 0 24px 0;font-size:14px;color:#a1a1aa;line-height:1.6;">
                Cảm ơn bạn đã đăng ký tài khoản tại <strong>Hiển Tattoo Studio</strong>. Vui lòng sử dụng mã xác thực OTP gồm 6 chữ số dưới đây để hoàn tất kích hoạt tài khoản của bạn:
              </p>

              <!-- OTP Box -->
              <div style="background:#09090b;border:1px solid #3f3f46;border-radius:18px;padding:24px;text-align:center;margin:0 0 24px 0;">
                <div style="font-size:11px;color:#a1a1aa;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">
                  MÃ XÁC THỰC OTP CỦA BẠN
                </div>
                <div style="font-size:38px;font-weight:800;letter-spacing:10px;color:#34d399;font-family:'Courier New',monospace;">
                  ${otp}
                </div>
                <div style="margin-top:12px;font-size:12px;color:#fbbf24;">
                  ⏱ Mã có hiệu lực trong vòng <strong>05 phút</strong>
                </div>
              </div>

              <p style="margin:0;font-size:12px;color:#71717a;line-height:1.6;text-align:center;">
                Tuyệt đối không chia sẻ mã này cho bất kỳ ai. Nếu bạn không thực hiện yêu cầu đăng ký này, vui lòng bỏ qua email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background:#09090b;border-top:1px solid #27272a;text-align:center;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                &copy; ${new Date().getFullYear()} <strong>HIỂN TATTOO STUDIO</strong> &bull; Hệ thống Đặt lịch &amp; Quản trị Tự động
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export async function sendRegistrationOtpEmail(
  toEmail: string,
  otp: string,
  recipientName?: string
): Promise<{ sentViaSmtp: boolean; error?: string }> {
  const html = buildOtpEmailHtml(otp, recipientName);
  return sendSmtpMail({
    to: toEmail,
    subject: `[HIỂN TATTOO] Mã xác thực OTP đăng ký tài khoản: ${otp}`,
    html,
  });
}

export interface BookingReminderPayload {
  bookingId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  artistName: string;
  tattooTitle: string;
  tattooStyle?: string;
  placement?: string;
  startTime: Date;
  endTime: Date;
  durationMin: number;
  totalPrice: number;
  depositAmount: number;
  status: string;
  note?: string | null;
}

export function buildCustomerReminderHtml(data: BookingReminderPayload): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const startFormatted = new Date(data.startTime).toLocaleString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const endFormatted = new Date(data.endTime).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:linear-gradient(145deg,#141417,#0d0d10);border:1px solid #27272a;border-radius:24px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,0.8);">
          <!-- Top Header -->
          <tr>
            <td style="padding:36px 32px 24px 32px;text-align:center;border-bottom:1px solid #27272a;background:radial-gradient(circle at top,#1f2937 0%,#141417 75%);">
              <div style="display:inline-block;padding:6px 16px;border-radius:999px;background:rgba(52,211,153,0.15);border:1px solid rgba(52,211,153,0.4);color:#34d399;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:14px;">
                🔔 NHẮC LỊCH HẸN XĂM HÌNH SẮP TỚI
              </div>
              <h1 style="margin:0;font-size:28px;letter-spacing:3px;color:#ffffff;font-weight:800;">
                HIỂN <span style="font-weight:300;color:#a1a1aa;">TATTOO STUDIO</span>
              </h1>
              <p style="margin:8px 0 0 0;font-size:13px;color:#a1a1aa;">
                Phiếu Hẹn Điện Tử Chính Thức &bull; Mã đơn <strong style="color:#fbbf24;">#${data.bookingId.slice(0, 8).toUpperCase()}</strong>
              </p>
            </td>
          </tr>

          <!-- Greeting & Details -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 12px 0;font-size:16px;color:#ffffff;">
                Xin chào <strong>${data.customerName}</strong>,
              </p>
              <p style="margin:0 0 24px 0;font-size:14px;color:#a1a1aa;line-height:1.6;">
                Hệ thống <strong>Hiển Tattoo Studio</strong> xin gửi lời nhắc lịch hẹn xăm hình sắp tới của bạn. Nghệ sĩ và phòng xăm vô trùng đã sẵn sàng đón tiếp bạn!
              </p>

              <!-- Appointment Ticket Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;border:1px solid #3f3f46;border-radius:18px;padding:24px;margin-bottom:24px;">
                <tr>
                  <td colspan="2" style="padding-bottom:14px;border-bottom:1px dashed #27272a;">
                    <div style="font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:1px;">Tác phẩm / Dịch vụ</div>
                    <div style="font-size:18px;font-weight:700;color:#ffffff;margin-top:4px;">${data.tattooTitle}</div>
                    ${data.placement ? `<div style="font-size:12px;color:#a1a1aa;margin-top:2px;">Vị trí / Phong cách: ${data.placement}</div>` : ""}
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 0;border-bottom:1px solid #18181b;color:#a1a1aa;font-size:13px;">🕒 Thời gian hẹn:</td>
                  <td style="padding:14px 0;border-bottom:1px solid #18181b;color:#34d399;font-size:14px;font-weight:700;text-align:right;">
                    ${startFormatted} - ${endFormatted}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #18181b;color:#a1a1aa;font-size:13px;">⏱ Thời lượng dự kiến:</td>
                  <td style="padding:12px 0;border-bottom:1px solid #18181b;color:#ffffff;font-size:13px;font-weight:600;text-align:right;">
                    ${data.durationMin} phút
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #18181b;color:#a1a1aa;font-size:13px;">🎨 Nghệ sĩ thực hiện:</td>
                  <td style="padding:12px 0;border-bottom:1px solid #18181b;color:#ffffff;font-size:13px;font-weight:600;text-align:right;">
                    ${data.artistName}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #18181b;color:#a1a1aa;font-size:13px;">💰 Tổng chi phí dự kiến:</td>
                  <td style="padding:12px 0;border-bottom:1px solid #18181b;color:#fbbf24;font-size:15px;font-weight:700;text-align:right;">
                    ${data.totalPrice.toLocaleString("vi-VN")} ₫
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0 0 0;color:#a1a1aa;font-size:13px;">🛡️ Tiền cọc giữ lịch (25%):</td>
                  <td style="padding:12px 0 0 0;color:#e4e4e7;font-size:13px;font-weight:600;text-align:right;">
                    ${data.depositAmount.toLocaleString("vi-VN")} ₫
                  </td>
                </tr>
              </table>

              <!-- Preparation Tips Box -->
              <div style="background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.25);border-radius:16px;padding:18px 20px;margin-bottom:28px;">
                <div style="font-size:13px;font-weight:700;color:#fbbf24;margin-bottom:8px;">
                  ✨ Lưu ý quan trọng trước giờ xăm:
                </div>
                <ul style="margin:0;padding-left:18px;font-size:13px;color:#d4d4d8;line-height:1.7;">
                  <li>Ăn no và ngủ đủ giấc trước buổi hẹn ít nhất 1 - 2 tiếng.</li>
                  <li>Không sử dụng rượu bia, đồ uống có cồn hoặc chất kích thích trong 24h trước khi xăm.</li>
                  <li>Mặc trang phục rộng rãi, thoải mái tại vị trí cần xăm.</li>
                  <li>Vui lòng có mặt đúng giờ (hoặc sớm hơn 10 phút) để Artist chuẩn bị scan hình.</li>
                </ul>
              </div>

              <!-- CTA Button -->
              <div style="text-align:center;">
                <a href="${appUrl}/my-bookings" style="display:inline-block;padding:14px 32px;background:#ffffff;color:#000000;font-weight:700;font-size:14px;text-decoration:none;border-radius:999px;">
                  Xem Lịch Hẹn Của Tôi &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background:#09090b;border-top:1px solid #27272a;text-align:center;">
              <p style="margin:0;font-size:12px;color:#71717a;">
                <strong>HIỂN TATTOO STUDIO</strong> &bull; Hotline/Zalo: 0988.888.888
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export function buildOwnerReminderHtml(data: BookingReminderPayload): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const startFormatted = new Date(data.startTime).toLocaleString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const endFormatted = new Date(data.endTime).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:linear-gradient(145deg,#181424,#0d0d12);border:1px solid #3b2d54;border-radius:24px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,0.8);">
          <!-- Header -->
          <tr>
            <td style="padding:32px;text-align:center;border-bottom:1px solid #2e2440;background:radial-gradient(circle at top,#3b1d5e 0%,#141417 75%);">
              <div style="display:inline-block;padding:6px 16px;border-radius:999px;background:rgba(168,85,247,0.2);border:1px solid rgba(168,85,247,0.45);color:#d8b4fe;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;">
                ⚡ THÔNG BÁO CHO CHỦ STUDIO / ARTIST
              </div>
              <h1 style="margin:0;font-size:24px;letter-spacing:1px;color:#ffffff;font-weight:800;">
                CA XĂM SẮP BẮT ĐẦU
              </h1>
              <p style="margin:6px 0 0 0;font-size:13px;color:#c4b5fd;">
                Mã đơn: <strong>#${data.bookingId.slice(0, 8).toUpperCase()}</strong> &bull; Trạng thái: <strong>${data.status}</strong>
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 20px 0;font-size:14px;color:#d4d4d8;line-height:1.6;">
                Xin chào <strong>Chủ Studio (${data.artistName})</strong>, bạn có một ca xăm sắp tới giờ hẹn. Dưới đây là hồ sơ khách hàng và chi tiết ca làm việc:
              </p>

              <!-- Info Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;border:1px solid #3f3f46;border-radius:18px;padding:22px;margin-bottom:24px;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #18181b;color:#a1a1aa;font-size:13px;">👤 Khách hàng:</td>
                  <td style="padding:10px 0;border-bottom:1px solid #18181b;color:#ffffff;font-size:14px;font-weight:700;text-align:right;">
                    ${data.customerName}
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #18181b;color:#a1a1aa;font-size:13px;">📞 Số điện thoại khách:</td>
                  <td style="padding:10px 0;border-bottom:1px solid #18181b;color:#34d399;font-size:14px;font-weight:700;text-align:right;">
                    ${data.customerPhone}
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #18181b;color:#a1a1aa;font-size:13px;">✉️ Email khách:</td>
                  <td style="padding:10px 0;border-bottom:1px solid #18181b;color:#e4e4e7;font-size:13px;text-align:right;">
                    ${data.customerEmail}
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #18181b;color:#a1a1aa;font-size:13px;">🖋️ Mẫu / Dịch vụ:</td>
                  <td style="padding:10px 0;border-bottom:1px solid #18181b;color:#fbbf24;font-size:14px;font-weight:700;text-align:right;">
                    ${data.tattooTitle}
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #18181b;color:#a1a1aa;font-size:13px;">🕒 Khung giờ ca xăm:</td>
                  <td style="padding:10px 0;border-bottom:1px solid #18181b;color:#34d399;font-size:13px;font-weight:700;text-align:right;">
                    ${startFormatted} - ${endFormatted} (${data.durationMin} phút)
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;color:#a1a1aa;font-size:13px;">💵 Tổng thu / Tiền cọc:</td>
                  <td style="padding:10px 0;color:#ffffff;font-size:13px;font-weight:600;text-align:right;">
                    ${data.totalPrice.toLocaleString("vi-VN")} ₫ (Cọc: ${data.depositAmount.toLocaleString("vi-VN")} ₫)
                  </td>
                </tr>
                ${
                  data.note
                    ? `
                <tr>
                  <td colspan="2" style="padding-top:12px;border-top:1px dashed #27272a;color:#fbbf24;font-size:12px;">
                    <strong>📝 Ghi chú từ khách:</strong> ${data.note}
                  </td>
                </tr>`
                    : ""
                }
              </table>

              <div style="text-align:center;">
                <a href="${appUrl}/dashboard/admin" style="display:inline-block;padding:14px 32px;background:#a855f7;color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;border-radius:999px;">
                  Mở Bảng Điều Khiển Admin &rarr;
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export async function sendBookingReminderEmails(payload: BookingReminderPayload) {
  const { adminEmail } = getSmtpConfig();

  const customerHtml = buildCustomerReminderHtml(payload);
  const ownerHtml = buildOwnerReminderHtml(payload);

  const [customerResult, ownerResult] = await Promise.all([
    sendSmtpMail({
      to: payload.customerEmail,
      subject: `🔔 [HIỂN TATTOO] Nhắc lịch hẹn xăm hình của bạn vào lúc ${new Date(
        payload.startTime
      ).toLocaleString("vi-VN")}`,
      html: customerHtml,
    }),
    sendSmtpMail({
      to: adminEmail,
      subject: `⚡ [ADMIN STUDIO] Nhắc ca xăm sắp tới: Khách ${payload.customerName} (${payload.customerPhone})`,
      html: ownerHtml,
    }),
  ]);

  return {
    customerSent: customerResult.sentViaSmtp,
    ownerSent: ownerResult.sentViaSmtp,
    customerHtml,
    ownerHtml,
  };
}
