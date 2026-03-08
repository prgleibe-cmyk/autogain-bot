import express from "express";
import cors from "cors";
import { spawn, execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { createServer } from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  transports: ["websocket"]
});

app.use(cors());
app.use(express.json());

const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));

let pythonProcess = null;
let pendingRequests = new Map();
let stdoutBuffer = "";

/* ============================= */
/* INSTALAR DEPENDENCIAS PYTHON  */
/* ============================= */

function installPythonDeps() {

  try {

    console.log("[Server] Instalando dependências Python...");

    execSync("python -m pip install -r requirements.txt", {
      stdio: "inherit",
      cwd: __dirname
    });

    console.log("[Server] Dependências Python OK");

  } catch (err) {

    console.error("[Server] Erro ao instalar dependências Python", err);

  }

}

/* ============================= */
/* INICIAR PYTHON                */
/* ============================= */

function startPython() {

  const bridgePath = path.join(__dirname, "backend", "bridge.py");

  console.log(`[Server] Iniciando Python: ${bridgePath}`);

  pythonProcess = spawn("python", [bridgePath], {
    stdio: ["pipe", "pipe", "pipe"]
  });

  pythonProcess.on("error", (err) => {
    console.error("[Python Spawn Error]", err);
  });

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

      } catch {

        console.log("[Python Log]", line);

      }

    }

  });

  pythonProcess.stderr.on("data", (data) => {

    console.error("[Python Error]", data.toString());

  });

  pythonProcess.on("close", (code) => {

    console.log(`[Python] Encerrado (Code ${code}). Reiniciando em 5s`);

    pythonProcess = null;

    setTimeout(startPython, 5000);

  });

}

/* ============================= */
/* INICIALIZAÇÃO                 */
/* ============================= */

installPythonDeps();
startPython();

/* ============================= */
/* COMUNICAÇÃO PYTHON            */
/* ============================= */

function sendToPython(command) {

  return new Promise((resolve, reject) => {

    if (!pythonProcess || pythonProcess.killed) {

      return reject(new Error("Motor Python offline"));

    }

    const request_id = `${command.type}_${Date.now()}`;

    command.request_id = request_id;

    const timeout = setTimeout(() => {

      pendingRequests.delete(request_id);

      reject(new Error("Timeout Python"));

    }, 120000);

    pendingRequests.set(request_id, { resolve, reject, timeout });

    pythonProcess.stdin.write(JSON.stringify(command) + "\n");

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
      type_acc: req.body.type
    });

    res.json(result);

  } catch (err) {

    console.error(err);

    res.status(500).json({ error: err.message });

  }

});

app.post("/buy", async (req, res) => {

  try {

    const result = await sendToPython({
      type: "ORDER",
      asset: req.body.asset,
      amount: req.body.amount,
      action: req.body.action,
      account_type: req.body.account_type
    });

    res.json(result);

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});

app.get("/balance", async (req, res) => {

  try {

    const result = await sendToPython({ type: "BALANCE" });

    res.json(result);

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});

app.get("/ping", (req, res) => res.json({ status: "online" }));

app.get("*", (req, res) => {

  res.sendFile(path.join(distPath, "index.html"));

});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, "0.0.0.0", () => {

  console.log(`🚀 Server rodando na porta ${PORT}`);

});