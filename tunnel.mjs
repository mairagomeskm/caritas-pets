import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const cfCandidates = [
  process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "cloudflared", "cloudflared.exe"),
  "cloudflared.exe",
  "cloudflared",
].filter(Boolean);

const cfBin = cfCandidates.find((p) => p.includes(path.sep) && fs.existsSync(p));

function startCloudflareTunnel(bin) {
  console.log("Iniciando Cloudflare Tunnel de alta velocidade (CDN Brasil)...");
  const child = spawn(bin, ["tunnel", "--no-autoupdate", "--url", "http://127.0.0.1:8080"], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  const handleOutput = (data) => {
    const text = data.toString();
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match) {
      const url = match[0];
      fs.writeFileSync("tunnel_url.txt", url);
      console.log("\n==========================================");
      console.log("LINK PUBLICO CLOUDFLARE ATIVO: " + url);
      console.log("==========================================\n");
    }
  };

  child.stdout.on("data", handleOutput);
  child.stderr.on("data", handleOutput);
  child.on("close", (code) => {
    console.log(`Cloudflare Tunnel finalizado (${code}). Reconectando em 2s...`);
    setTimeout(() => startCloudflareTunnel(bin), 2000);
  });
}

function startSshTunnel() {
  console.log("Iniciando conexao com o tunel publico SSH...");
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
  child.on("close", () => setTimeout(startSshTunnel, 3000));
}

if (cfBin) {
  startCloudflareTunnel(cfBin);
} else {
  startSshTunnel();
}
