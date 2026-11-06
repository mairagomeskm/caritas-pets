import { spawn } from "child_process";
import fs from "fs";

function startTunnel() {
  console.log("Iniciando conexao com o tunel publico na nuvem...");
  const child = spawn(
    "ssh",
    [
      "-T",
      "-R",
      "80:127.0.0.1:8080",
      "-o",
      "StrictHostKeyChecking=no",
      "-o",
      "ServerAliveInterval=15",
      "-o",
      "ServerAliveCountMax=5",
      "-o",
      "ExitOnForwardFailure=yes",
      "nokey@localhost.run",
    ],
    { stdio: ["pipe", "pipe", "pipe"] },
  );

  const handleOutput = (data) => {
    const text = data.toString();
    const match =
      text.match(/tunneled with tls termination,\s*(https:\/\/[a-zA-Z0-9-]+\.lhr\.life)/i) ||
      (!text.includes("admin.localhost.run") && text.match(/https:\/\/[a-zA-Z0-9-]+\.lhr\.life/));
    if (match) {
      const url = match[1] || match[0];
      fs.writeFileSync("tunnel_url.txt", url);
      console.log("\n==========================================");
      console.log("LINK PUBLICO ATIVO: " + url);
      console.log("==========================================\n");
    }
  };

  child.stdout.on("data", handleOutput);
  child.stderr.on("data", handleOutput);

  child.on("close", (code) => {
    console.log(`Tunel finalizado (codigo ${code}). Reconectando em 3s...`);
    setTimeout(startTunnel, 3000);
  });

  child.on("error", (err) => {
    console.error("Erro no tunel:", err.message);
    setTimeout(startTunnel, 3000);
  });
}

startTunnel();
