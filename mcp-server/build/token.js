import { google } from "googleapis";
import fs from "fs/promises";
import readline from "readline/promises";
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const SCOPES = process.env.SCOPES;
const TOKEN_PATH = "../mcp-server/token.json";
async function main() {
    const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    const authUrl = oauth2.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        prompt: "consent",
    });
    console.log("Mở URL sau, đăng nhập và copy mã code:");
    console.log(authUrl, "\n");
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const code = (await rl.question("Paste the code here: ")).trim();
    rl.close();
    const { tokens } = await oauth2.getToken(code);
    await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2), "utf8");
    console.log("Đã lưu token vào", TOKEN_PATH);
}
main().catch(console.error);
