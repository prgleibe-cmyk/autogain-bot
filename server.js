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
  },
  pingInterval: 25000,
  pingTimeout: 60000,
  transports: ["websocket"],
  reconnection: true
});

app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do frontend (Vite build)
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));

let pythonProcess = null;
let pendingRequests = new Map();
let stdoutBuffer = "";

/* ============================= */
/* INICIAR PYTHON                */
/* ============================= */

function startPython() {
  const bridgePath = path.join(__dirname, "backend", "bridge.py");

  stdoutBuffer = "";
  pendingRequests.forEach(({ timeout, reject }) => {
    clearTimeout(timeout);
    reject(new Error("Python process restarted"));
  });
  pendingRequests.clear();

  console.log(`[Server] Tentando iniciar Bridge Python em: ${bridgePath}`);
  
  // Tenta python3, se falhar tenta python
  try {
    pythonProcess = spawn("python3", [bridgePath]);
    
    pythonProcess.on("error", (err) => {
      if (err.code === 'ENOENT') {
        console.log("[Server] python3 não encontrado, tentando 'python'...");
        pythonProcess = spawn("python", [bridgePath]);
        setupPythonListeners();
      } else {
        console.error("[Python-Process-Fatal Error]", err);
      }
    });

    setupPythonListeners();
  } catch (e) {
    console.error("[Server] Erro crítico ao tentar iniciar Python:", e.message);
  }
}

function setupPythonListeners() {
  if (!pythonProcess) return;

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

  pythonProcess.on("close", (code) => {
    console.log(`[Python] Encerrado (Code: ${code}). Reiniciando em 5s...`);
    pythonProcess = null;
    setTimeout(startPython, 5000);
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
        reject(new Error(`Timeout Python (${request_id})`));
      }
    }, 120000);

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

/* 🔥 CORREÇÃO CRÍTICA AQUI */
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

io.on("connection", (socket) => {
  console.log("[Socket] Novo cliente conectado:", socket.id);

  socket.on("GET_MARKET_DATA", (data) => {
    sendToPython({
      type: "MARKET_DATA",
      assets: data.assets || [],
      request_id: data.request_id
    }).catch((err) => console.error("[Socket GET_MARKET_DATA Error]", err.message));
  });

  socket.on("MARKET_DATA", (data) => {
    sendToPython({
      type: "MARKET_DATA",
      assets: data.assets || [],
      request_id: data.request_id
    }).catch((err) => console.error("[Socket MARKET_DATA Error]", err.message));
  });

  socket.on("disconnect", () => {
    console.log("[Socket] Cliente desconectado:", socket.id);
  });
});

// Rota curinga para o SPA (Single Page Application)
app.get("*", (req, res) => {
  const indexPath = path.join(__dirname, "dist", "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error("[Server] Erro ao enviar index.html. O build foi feito? Caminho:", indexPath);
      res.status(500).send("Erro interno: O frontend não foi construído corretamente. Verifique os logs do servidor.");
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor rodando em http://0.0.0.0:${PORT}`);
  console.log(`[Server] NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`[Server] Servindo arquivos de: ${distPath}`);
});
