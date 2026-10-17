import { NextResponse } from "next/server";
import https from "https";

// Enrich common Vietnamese tattoo concepts into English so Pollinations Flux/Sana models understand accurately
function enrichVietnameseTattooPrompt(input: string): string {
  const lower = input.toLowerCase();
  const mappings: Array<[RegExp, string]> = [
    [/akatsuki/i, "Akatsuki iconic cloud emblem symbol from Naruto anime, stylized Japanese cloud with bold black outline"],
    [/sharingan/i, "Uchiha Sharingan eye symbol from Naruto, symmetrical black line art"],
    [/naruto/i, "Naruto anime symbol motif"],
    [/rồng.*kiếm|kiếm.*rồng/i, "Japanese dragon coiling around a katana sword"],
    [/rồng/i, "traditional Asian dragon"],
    [/phượng hoàng/i, "mythical phoenix bird with flowing tail feathers"],
    [/hoa sen/i, "sacred lotus flower"],
    [/trăng|mặt trăng/i, "crescent moon"],
    [/hồ ly|cửu vĩ/i, "nine-tailed kitsune fox"],
    [/cá chép/i, "Japanese koi fish"],
    [/mặt quỷ|oni|hannya/i, "Japanese Hannya Oni demon mask"],
    [/la bàn/i, "vintage nautical compass"],
    [/đồng hồ/i, "vintage pocket watch"],
    [/hổ|cọp/i, "fierce tiger"],
    [/sói/i, "howling wolf"],
    [/rắn/i, "coiling serpent snake"],
    [/hoa hồng/i, "blooming rose flower"],
    [/bướm/i, "delicate butterfly"],
    [/nhật cổ/i, "traditional Japanese irezumi style"],
    [/nét mảnh/i, "minimalist fine line style"],
  ];

  const extras: string[] = [];
  for (const [regex, eng] of mappings) {
    if (regex.test(lower)) {
      extras.push(eng);
    }
  }

  return extras.length > 0 ? `${input} (${extras.join(", ")})` : input;
}

function fetchPollinationsImageIPv4(url: string): Promise<{
  statusCode: number;
  contentType: string;
  retryAfter: number;
  buffer: Buffer;
}> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        family: 4, // Force IPv4 to avoid Node v24 IPv6 ConnectTimeoutError on Windows
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json, image/*",
        },
        timeout: 30000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        res.on("end", () => {
          const buffer = Buffer.concat(chunks);
          const statusCode = res.statusCode || 500;
          const contentType = String(res.headers["content-type"] || "");
          const retryAfter = Number(res.headers["retry-after"] || 0);
          resolve({ statusCode, contentType, retryAfter, buffer });
        });
      }
    );

    req.on("timeout", () => {
      req.destroy(new Error("Request timed out"));
    });
    req.on("error", (err) => reject(err));
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawPrompt = (body?.prompt || "").trim();

    if (!rawPrompt) {
      return NextResponse.json(
        { error: "Vui lòng nhập mô tả ý tưởng hình xăm để AI phác thảo!" },
        { status: 400 }
      );
    }

    const randomSeed = Math.floor(100000 + Math.random() * 9000000);
    const enrichedSubject = enrichVietnameseTattooPrompt(rawPrompt);

    // Prompt Engineering specialized for clean black-and-white tattoo stencil / flash line art
    const engineeredPrompt = `A clean tattoo stencil design, ${enrichedSubject}, sharp black line art, high contrast, isolated on a pure solid white background, flash tattoo style, no shadows, no skin`;

    const encodedPrompt = encodeURIComponent(engineeredPrompt);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux&width=1024&height=1024&seed=${randomSeed}&nologo=true`;

    // Fetch ONCE from backend via IPv4 and return Base64 Data URL so the browser does NOT make a 2nd request
    // (Making 2 requests from the same IP within 45s triggers Pollinations' "Free limit reached" banner!)
    let result = await fetchPollinationsImageIPv4(pollinationsUrl);

    // If Pollinations returns 402/429 with a short Retry-After (<= 18s), wait automatically and retry once
    if ((result.statusCode === 402 || result.statusCode === 429) && result.retryAfter > 0 && result.retryAfter <= 18) {
      await sleep((result.retryAfter + 1) * 1000);
      result = await fetchPollinationsImageIPv4(pollinationsUrl);
    }

    if (result.statusCode === 402 || result.statusCode === 429) {
      const waitSec = result.retryAfter || 30;
      return NextResponse.json(
        {
          error: `Pollinations.AI (Gói Miễn Phí) giới hạn tạo 1 ảnh mỗi 45 giây trên cùng 1 IP. Vui lòng chờ ${waitSec} giây rồi bấm lại nhé!`,
          retryAfter: waitSec,
        },
        { status: 429 }
      );
    }

    if (result.statusCode === 200 && result.contentType.includes("image")) {
      const base64DataUrl = `data:${result.contentType};base64,${result.buffer.toString("base64")}`;
      return NextResponse.json({
        imageUrl: base64DataUrl,
        sourceUrl: pollinationsUrl,
        seed: randomSeed,
        engineeredPrompt,
      });
    }

    return NextResponse.json(
      { error: "Dịch vụ AI đang bận, vui lòng thử lại sau ít giây!" },
      { status: 502 }
    );
  } catch (error: any) {
    console.error("AI Sketch Generation Error:", error);
    return NextResponse.json(
      { error: "Không thể kết nối tới Pollinations.AI lúc này. Vui lòng thử lại!" },
      { status: 500 }
    );
  }
}
