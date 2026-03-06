import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { createServer } from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

io.on("connection", (socket) => {
  console.log("[Socket] Novo cliente conectado:", socket.id);

  socket.on("GET_MARKET_DATA", async (data) => {
    try {
      await sendToPython({
        type: "DATA",
        assets: data.assets,
        request_id: data.request_id
      });
    } catch (e) {
      console.error("[Socket GET_MARKET_DATA] Error:", e.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("[Socket] Cliente desconectado:", socket.id);
  });
});

let pythonProcess = null;
let pendingRequests = new Map();
let stdoutBuffer = "";
let timeoutCount = 0;

/* ============================= */
/* INICIAR PYTHON                */
/* ============================= */

function startPython() {
  const bridgePath = path.join(__dirname, "backend", "bridge.py");

  stdoutBuffer = "";
  timeoutCount = 0;
  pendingRequests.forEach(({ timeout, reject }) => {
    clearTimeout(timeout);
    reject(new Error("Python process restarted"));
  });
  pendingRequests.clear();

  console.log(`[Server] Iniciando Bridge Python 3.10 em: ${bridgePath}`);

  // 🔥 FORÇA USAR PYTHON 3.10
  pythonProcess = spawn("py", ["-3.10", bridgePath]);

  pythonProcess.stdout.on("data", (data) => {
    stdoutBuffer += data.toString();
    const lines = stdoutBuffer.split("\n");
    stdoutBuffer = lines.pop();

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const msg = JSON.parse(line);

        if (msg.request_id && pendingRequests.has(msg.request_id)) {
          const { resolve, timeout } = pendingRequests.get(msg.request_id);
          clearTimeout(timeout);
          pendingRequests.delete(msg.request_id);
          timeoutCount = 0;
          resolve(msg);
        }

        io.emit("stats_update", msg);

      } catch (e) {
        console.log("[Python Log]", line);
      }
    }
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error("[Python-Error]", data.toString());
  });

  pythonProcess.on("error", (err) => {
    console.error("[Python-Process-Fatal]", err);
  });

  pythonProcess.on("close", (code) => {
    console.log(`[Python] Encerrado (Code: ${code}). Reiniciando em 2s...`);
    pythonProcess = null;
    setTimeout(startPython, 2000);
  });
}

startPython();

/* ============================= */
/* ENVIO PADRÃO PARA PYTHON      */
/* ============================= */

function sendToPython(command) {
  return new Promise((resolve, reject) => {
    if (!pythonProcess || !pythonProcess.stdin || pythonProcess.killed) {
      return reject(new Error("Conexão com motor Python perdida."));
    }

    const request_id =
      command.request_id ||
      `${command.type}_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 6)}`;

    command.request_id = request_id;

    const timeout = setTimeout(() => {
      if (pendingRequests.has(request_id)) {
        pendingRequests.delete(request_id);
        timeoutCount++;
        console.error(`[Server] Timeout Python (${request_id}). Total: ${timeoutCount}`);
        
        if (timeoutCount >= 5) {
            console.error("[Server] WATCHDOG: Muitos timeouts. Reiniciando Python...");
            if (pythonProcess) pythonProcess.kill();
        }
        
        reject(new Error(`Timeout Python (${request_id})`));
      }
    }, 60000);

    pendingRequests.set(request_id, { resolve, reject, timeout });

    try {
      pythonProcess.stdin.write(JSON.stringify(command) + "\n");
    } catch (e) {
      clearTimeout(timeout);
      pendingRequests.delete(request_id);
      reject(new Error(`Falha ao escrever no Python: ${e.message}`));
    }
  });
}

/* ============================= */
/* ROTAS                         */
/* ============================= */

app.post("/connect", async (req, res) => {
  try {
    const result = await sendToPython({
      type: "LOGIN",
      email: req.body.email,
      password: req.body.password,
      type_acc: req.body.type || req.body.type_acc,
    });
    return res.json(result);
  } catch (err) {
    console.error("[Route /connect] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.post("/buy", (req, res) => {
  if (!pythonProcess || !pythonProcess.stdin || pythonProcess.killed) {
    return res.status(500).json({ error: "Conexão com motor Python perdida." });
  }

  const request_id = `ORDER_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  sendToPython({
    request_id,
    type: "ORDER",
    asset: req.body.asset,
    amount: Number(req.body.amount),
    action: req.body.action,
    account_type: req.body.account_type,
  }).catch((err) => console.error("[Background Order Error]", err.message));

  return res.json({
    id: request_id,
    status: "OPEN"
  });
});

app.get("/balance", async (req, res) => {
  try {
    const result = await sendToPython({ type: "BALANCE" });
    return res.json(result);
  } catch (err) {
    console.error("[Route GET /balance] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.post("/market_data", async (req, res) => {
  try {
    const result = await sendToPython({
      type: "DATA",
      assets: req.body.assets || [],
    });
    return res.json(result);
  } catch (err) {
    console.error("[Route POST /market_data] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.get("/assets", async (req, res) => {
  try {
    const result = await sendToPython({ type: "GET_ASSETS" });
    return res.json(result);
  } catch (err) {
    console.error("[Route GET /assets] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.get("/ping", (req, res) => res.json({ status: "online" }));

app.post("/switch_account", async (req, res) => {
  try {
    const result = await sendToPython({
      type: "SWITCH",
      type_acc: req.body.type
    });
    return res.json(result);
  } catch (err) {
    console.error("[Route /switch_account] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

httpServer.listen(5000, "0.0.0.0", () => {
  console.log("🚀 Backend Express + Socket.IO rodando em http://0.0.0.0:5000");
});