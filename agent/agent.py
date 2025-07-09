# uvicorn agent:app --reload --port 3003
import os
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from jose import jwt
from pydantic import BaseModel
from agents import Agent, Runner
from agents.mcp import MCPServerStdio
from datetime import datetime, timedelta
import pytz
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuth
import logging
logging.basicConfig(level=logging.INFO)
from pathlib import Path
import json, stat

TOKEN_FILE = Path(__file__).with_name("token.js")  
def save_token_js(token_data: dict) -> Path:
    import datetime 
    js_code = (
        f"// Auto‑generated at {datetime.datetime.utcnow().isoformat()}Z\n"
        f"export const token = {json.dumps(token_data, ensure_ascii=False, indent=2)};\n"
    )
    TOKEN_FILE.write_text(js_code, encoding="utf-8")

    TOKEN_FILE.chmod(stat.S_IRUSR | stat.S_IWUSR)
    return TOKEN_FILE

load_dotenv()
app = FastAPI()

def get_current_time_str():
    now = datetime.now(pytz.timezone("Asia/Ho_Chi_Minh"))
    return now.isoformat()

FE_ORIGIN = os.getenv("FRONTEND_URL")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FE_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SECRET_KEY"),
)

oauth = OAuth()
oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile https://www.googleapis.com/auth/calendar.events"},
)

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM  = "HS256"

def create_token(userinfo: dict) -> str:
    payload = {
        "sub": userinfo["email"],
        "name": userinfo["name"],
        "exp": datetime.utcnow() + timedelta(hours=6),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


@app.get("/auth/google")
async def login(request: Request):
    redirect_uri = request.url_for("auth_callback")
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/auth/callback")
async def auth_callback(request: Request):
    token_data = await oauth.google.authorize_access_token(request)
    access_token = token_data["access_token"]
    save_token_js(access_token) 
    resp = await oauth.google.get("https://www.googleapis.com/oauth2/v3/userinfo", token=token_data)
    user = resp.json()
    jwt_token = create_token(user)
    redirect_url = f"{FE_ORIGIN}/login-success?token={jwt_token}"
    return RedirectResponse(url=redirect_url)

class MessageRequest(BaseModel):
    message: str
@app.post("/agent")
async def run_agent(req: MessageRequest):
    message = req.message
    now_str = get_current_time_str()
    full_message = f"Thời gian hiện tại là {now_str}.\n{message}"

    try:
        async with MCPServerStdio(
            name="Agent",
            params={
                "command": "node",
                "args": ["../mcp-server/build/index.js"],
                "options": {
                    "cwd": ".", 
                },
                "env": {
                    "CLIENT_ID": os.getenv("CLIENT_ID"),
                    "CLIENT_SECRET": os.getenv("CLIENT_SECRET"),
                    "REDIRECT_URI": os.getenv("REDIRECT_URI"),
                    "SCOPES": os.getenv("SCOPES"),
                }
            },
        ) as server:
            print("CLIENT_ID =", os.getenv("CLIENT_ID"))
            
            agent = Agent(
                name="Assistant",
                instructions="""
                    You are a personal assistant who helps users in their daily jobs.
                    You can understand and convert natural language time expressions such as "tomorrow at 3pm" or "next Monday morning" into full ISO datetime format.
                    You are provided with the following tools:
                    1. Google Calendar: Leverage multiple tools from the MCP server to create new events, modify existing ones—including rescheduling time, updating details,
                    and managing attendees—and view your calendar seamlessly.
                    2. You must ensure all date/time passed to the tools are in ISO 8601 format with correct timezone.
                    3. Always use the current datetime dynamically using: datetime.now(pytz.timezone("Asia/Ho_Chi_Minh")).
                    Use Vietnamese or English depending on user input.
                """,
                mcp_servers=[server],
                model="gpt-4.1",
            )
        
            result = await Runner.run(starting_agent=agent, input=full_message)
            reply = str(result.final_output)
            return {"reply": reply}

    except Exception as e:
        logging.exception("Agent failed")
        return {"error": str(e)}

# class GetEventRequest(BaseModel):
#     start: str  
#     end: str   
    
# @app.post("/getEventByDate")
# async def get_event(req: GetEventRequest):
#     print("token: " + token)
#     if not token:
#         raise Exception("Unable to get Google access token")

#     url = "https://www.googleapis.com/calendar/v3/freeBusy"
#     headers = {
#         "Content-Type": "application/json",
#         "Authorization": f"Bearer {token}"
#     }
#     body = {
#         "timeMin": req.start,
#         "timeMax": req.end,
#         "timeZone": "Asia/Ho_Chi_Minh",
#         "items": [{"id": "primary"}]
#     }

#     response = requests.post(url, headers=headers, data=json.dumps(body))

#     if not response.ok:
#         raise Exception(f"{response.status_code} : {response.text}")

#     return response.json()

