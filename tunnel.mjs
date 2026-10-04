import localtunnel from "localtunnel";
import fs from "fs";

async function main() {
  try {
    const tunnel = await localtunnel({ port: 8080 });
    console.log("=========================================");
    console.log("SEU LINK PUBLICO ESTA PRONTO:");
    console.log(tunnel.url);
    console.log("=========================================");
    fs.writeFileSync("tunnel_url.txt", tunnel.url);

    tunnel.on("close", () => {
      console.log("Tunnel closed");
    });
    tunnel.on("error", (err) => {
      console.error("Tunnel error:", err);
    });
  } catch (err) {
    console.error("Erro ao criar tunnel:", err);
  }
}

main();
