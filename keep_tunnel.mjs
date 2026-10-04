import { spawn } from "child_process";
import fs from "fs";

function startTunnel() {
  console.log("Iniciando conexao com o tunel publico...");
  const child = spawn(
    "ssh",
    [
      "-R", "80:localhost:8080",
      "-o", "StrictHostKeyChecking=no",
      "-o", "ServerAliveInterval=15",
      "-o", "ServerAliveCountMax=5",
      "-o", "ExitOnForwardFailure=yes",
      "nokey@localhost.run"
    ],
    { stdio: ["pipe", "pipe", "pipe"] }
  );

  child.stdout.on("data", (data) => {
    const text = data.toString();
    process.stdout.write(text);
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.lhr\.life/);
    if (match) {
      const url = match[0];
      fs.writeFileSync("tunnel_url.txt", url);
      console.log("\n==========================================");
      console.log("LINK PUBLICO ATIVO: " + url);
      console.log("==========================================\n");
    }
  });

  child.stderr.on("data", (data) => {
    process.stderr.write(data.toString());
  });

  child.on("close", (code) => {
    console.log(`Tunel desconectou (codigo ${code}). Reconectando em 3 segundos...`);
    setTimeout(startTunnel, 3000);
  });

  child.on("error", (err) => {
    console.error("Erro no processo do tunel:", err);
    setTimeout(startTunnel, 3000);
  });
}

startTunnel();
