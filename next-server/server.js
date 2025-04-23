const express = require("express");
const next = require("next");
const cors = require("cors");
require("dotenv").config(); // 환경변수 로딩

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST || "localhost";
const port = parseInt(process.env.PORT, 10) || 3001;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  // ✅ CORS 설정 추가
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_SOCKET_SERVER_URL, // socket-server 주소
    "http://localhost:3001",                  // 로컬 프론트 주소
    "https://www.devsonghee.com",             // 실제 배포 주소 (원하면 추가)
  ];

  server.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
  }));
  
  // Next.js 페이지 및 API 라우트 핸들링
  server.all("*", (req, res) => {
    return handle(req, res);
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`> Server running on http://${hostname}:${port}`);
  });
});
