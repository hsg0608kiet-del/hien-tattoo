export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const globalForCron = globalThis as unknown as {
      reminderIntervalStarted?: boolean;
    };

    if (!globalForCron.reminderIntervalStarted) {
      globalForCron.reminderIntervalStarted = true;

      console.log("⏰ [CRON JOB] Đã kích hoạt Background Job tự động quét & nhắc lịch hẹn Tattoo (Mỗi 5 phút).");

      // Chạy định kỳ mỗi 5 phút để kiểm tra các ca xăm sắp đến giờ hẹn (trong vòng 24h tới)
      setInterval(async () => {
        try {
          const { runBookingReminderJob } = await import("@/app/api/cron/reminders/route");
          const res = await runBookingReminderJob({ hoursAhead: 24, force: false });
          if (res.remindedCount > 0) {
            console.log(`⏰ [CRON JOB] Đã tự động gửi mail nhắc lịch cho ${res.remindedCount} ca xăm sắp tới!`);
          }
        } catch (err) {
          console.error("⏰ [CRON JOB] Lỗi khi quét nhắc lịch hẹn:", err);
        }
      }, 5 * 60 * 1000);
    }
  }
}
