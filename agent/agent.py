# uvicorn agent:app --reload --port 3003
import json
import os
from typing import Any
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from google.oauth2.service_account import Credentials
from pydantic import BaseModel
from agents import Agent, Runner
from agents.mcp import MCPServerStdio
from datetime import datetime
import pytz
from fastapi.middleware.cors import CORSMiddleware
import requests
load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
def get_current_time_str():
    now = datetime.now(pytz.timezone("Asia/Ho_Chi_Minh"))
    return now.isoformat()

class MessageRequest(BaseModel):
    message: str

import logging
logging.basicConfig(level=logging.INFO)

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

class GetEventRequest(BaseModel):
    start: str  
    end: str   
    
@app.post("/getEventByDate")
async def get_event(req: GetEventRequest):
    print("token: " + token)
    if not token:
        raise Exception("Unable to get Google access token")

    url = "https://www.googleapis.com/calendar/v3/freeBusy"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    body = {
        "timeMin": req.start,
        "timeMax": req.end,
        "timeZone": "Asia/Ho_Chi_Minh",
        "items": [{"id": "primary"}]
    }

    response = requests.post(url, headers=headers, data=json.dumps(body))

    if not response.ok:
        raise Exception(f"{response.status_code} : {response.text}")

    return response.json()