const WebSocket = require("ws");
const net = require("net");
const http = require("http");

// Helper untuk decode base64 ke host:port
function decodeTarget(path) {
  try {
    const base64 = path.replace("/", "");
    const decoded = Buffer.from(base64, "base64").toString("utf-8");
    if (!decoded.includes(":")) throw new Error("Invalid target format");
    const [host, port] = decoded.split(":");
    return { host, port: parseInt(port) };
  } catch (e) {
    return null;
  }
}

// HTTP server (untuk Koyeb)
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("WebSocket to TCP Proxy");
});

// WebSocket server
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws, req) => {
  const url = req.url;
  const target = decodeTarget(url);

  if (!target) {
    ws.close();
    return;
  }

  const socket = net.createConnection(target.port, target.host);

  socket.on("connect", () => {
    console.log(`[+] Connected to ${target.host}:${target.port}`);
  });

  socket.on("data", (chunk) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(chunk);
    }
  });

  socket.on("error", (err) => {
    console.error(`[TCP] Error: ${err.message}`);
    ws.close();
  });

  socket.on("close", () => {
    ws.close();
  });

  ws.on("message", (message) => {
    if (socket.writable) {
      socket.write(message);
    }
  });

  ws.on("close", () => {
    socket.destroy();
  });

  ws.on("error", () => {
    socket.destroy();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`WebSocket server listening on port ${PORT}`);
});
