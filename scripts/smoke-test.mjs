import http from "node:http";
import { spawn } from "node:child_process";

const port = 18080;

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/openai/v1/chat/completions") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ choices: [{ message: { content: "pong" } }] }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: { message: "not found" } }));
});

await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));

const env = {
  ...process.env,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "smoke-test-key",
  OPENAI_BASE_URL: `http://127.0.0.1:${port}/openai/v1`,
};

const cliArgs = ["./dist/cli.js", "test", "--model", "glm-5.1", "--base-url", env.OPENAI_BASE_URL];
const child = spawn(process.execPath, cliArgs, { stdio: "inherit", env });

const code = await new Promise((resolve) => child.on("exit", resolve));
await new Promise((resolve) => server.close(resolve));

process.exit(code ?? 1);
