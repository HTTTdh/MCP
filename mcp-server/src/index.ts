// npm run inspector
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { google } from "googleapis";
import {readFile} from "node:fs/promises";
import * as fs from "fs/promises";

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const SCOPES = process.env.SCOPES;

const TOKEN_PATH = "../mcp-server/token.json";

const CREATE_EVENT: Tool  = {
  name: "create_event",
  description: "Tạo sự kiện Google Calendar",
  inputSchema: {
    type: "object",
    required: ["summary", "startISO", "endISO"],
    properties: {
      summary:     { type: "string" },
      startISO:    { type: "string" },
      endISO:      { type: "string" },
      description: { type: "string" },
      attendees:   {
        type:  "array",
        items: { type: "string", format: "email" },
      },
    },
  },
};

const GET_ACESS_TOKEN: Tool = {
  name: "get_access_token",
  description: "Lấy access token Google Calendar",
  inputSchema: {
    type: "object",
    properties:{}
  }
}

const CREATE_EVENT_QUICK: Tool = {
  name: "create_event_quick",
  description: "Tạo sự kiện Google Calendar nhanh",
  inputSchema: {
    type: "object",
    properties: {
      text: {type: "string"}
    }
  },
  required: ["text"]
}

const GET_EVENT: Tool = {
  name: "get_event",
  description: "Lấy thông tin sự kiện Google Calendar",
  inputSchema: {
    type: "object",
    properties: {
      q: {type: "string"}
    }
  },
  required: ["q"]
}

const UPDATE_EVENT: Tool = {
  name: "update_event",
  description: "Chỉnh sửa thông tin về sự kiện được yêu cầu",
  inputSchema: {
    type: "object",
    properties: {
      id: {type: "string"},
      summary: { type: "string" },
      location: {type: "string"},
      startISO:    { type: "string" },
      endISO:      { type: "string" },
      description: { type: "string" },
      attendees:   {
        type:  "array",
        items: { type: "string", format: "email" },
      },
    }
  },
  required: ["id"]
}

const BUSY: Tool = {
  name: "freeBusy",
  description: "lấy lịch trình trong ngày được yêu cầu",
  inputSchema: {
    type: "object",
    properties: {
      timeMin: { type: "string" },
      timeMax: { type: "string" },
    }
  },
  required: ["timeMax", "timeMin"]
}
const MOVE_EVENT: Tool = {
  name: "move_event",
  description: "thay đổi thời gian của event",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string" },
      timeMin: { type: "string" },
      timeMax: {type: "string"}
    }
  },
  required: ["id"]
}
const TOOLS = [CREATE_EVENT, GET_ACESS_TOKEN, CREATE_EVENT_QUICK, GET_EVENT, UPDATE_EVENT, BUSY, MOVE_EVENT];

async function getAuthClient() {
  const oauth2 = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );

  const token = await fs.readFile(TOKEN_PATH, "utf8");
  oauth2.setCredentials(JSON.parse(token));
  return oauth2;
}
async function createCalendarEvent(input: {
  summary: string;
  startISO: string;
  endISO: string;
  description?: string;
  attendees?: string[];
}) {
  const auth = await getAuthClient();
  const access = await auth.getAccessToken();
  if (!access?.token) throw new Error("Unable to get Google access token");

  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access.token}`,
      },
      body: JSON.stringify({
        summary: input.summary,
        description: input.description,
        start: { dateTime: input.startISO, timeZone: "Asia/Ho_Chi_Minh" },
        end:   { dateTime: input.endISO,   timeZone: "Asia/Ho_Chi_Minh" },
        attendees: input.attendees?.map(email => ({ email })),
        reminders: { useDefault: true },
        conferenceData: {
          createRequest: {
            requestId: crypto.randomUUID(),
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Calendar API error ${res.status}: ${await res.text()}`);
  }

  return await res.json(); // chính là đối tượng Event
}
async function createEventQuick(text: string) {
  const auth = await getAuthClient();
  const access = await auth.getAccessToken();
  if (!access?.token) throw new Error("Unable to get Google access token");
  const respone = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/quickAdd?text=${text}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${access.token}`,
    }
  })
  if (!respone.ok) {
    throw new Error(`${respone.status}`);
  }
  return respone.json();
}
async function searchCalendarEvents(keyword: string, access: string) {
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=2025-01-01T00:00:00Z&timeMax=2025-12-31T23:59:59Z&access_token=${access}`);
  const data = await res.json();

  const results = data.items.filter((event: any) =>
    event.summary?.toLowerCase().includes(keyword.toLowerCase())
  );

  return results;
}
async function getEvent(input: {
  timeMin?: string;
  timeMax?: string;
  q: string;
}) {
  const auth = await getAuthClient();
  const access = await auth.getAccessToken();
  if (!access?.token) throw new Error("Unable to get Google access token");
  return await searchCalendarEvents(input.q, access.token);
}
async function getEventById(id: string) {
  const auth = await getAuthClient();
  const access = await auth.getAccessToken();
  if (!access?.token) throw new Error("Unable to get Google access token");
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${id}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access.token}`,
      }
    }
  )
  const oldEvent = await res.json();
  return oldEvent;
}
async function updateEvent(input: {
  id: string
  summary?: string;
  location?: string;
  startISO?: string;
  endISO?: string;
  description?: string;
  attendees?: string[];
}) {
  const auth = await getAuthClient();
  const access = await auth.getAccessToken();
  if (!access?.token) throw new Error("Unable to get Google access token");
  const oldEvent = await getEventById(input.id);
  const respone = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${input.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access.token}`,
    },
    body: JSON.stringify(
      {
        "summary": input.summary ?? oldEvent.summary,
        "description": input.description ?? oldEvent.description,
        "location": input.location ?? oldEvent.location,
        "start": { dateTime: input.startISO ?? oldEvent.start?.dateTime, timeZone: "Asia/Ho_Chi_Minh" },
        "end": { dateTime: input.endISO ?? oldEvent.end?.dateTime, timeZone: "Asia/Ho_Chi_Minh" },
        "attendees": input.attendees?.map(email => ({ email })) ?? oldEvent.attendees?.map((email: string)=> ({ email })),
      }      
    )
  })
  if (!respone.ok) {
    throw new Error(`${respone.status} : ${await respone.text()}`);
  }
  return respone.json();
}
async function freeBusy(timeMax: string, timeMin: string) {
  const auth = await getAuthClient();
  const access = await auth.getAccessToken();
  if (!access?.token) throw new Error("Unable to get Google access token");
  const res = await fetch(`https://www.googleapis.com/calendar/v3/freeBusy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access.token}`,
    },
    body: JSON.stringify({
      "timeMax": timeMax,
      "timeMin": timeMin,
      "timeZone": "Asia/Ho_Chi_Minh",
      "items": [{ id: "primary" }]
    })
  })
  if (!res.ok) {
    throw new Error(`${res.status} : ${await res.text()}`);
  }
  return await res.json();
}
async function moveEvent(id: string, timeMax?: string, timeMin?: string) {
  const auth = await getAuthClient();
  const access = await auth.getAccessToken();
  const oldEvent = await getEventById(id);
  const respone = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access.token}`,
    },
    body: JSON.stringify({
      "start": {
        "dateTime": timeMin ?? oldEvent.start?.dateTime
      },
      "end": {
        "dateTime": timeMax ?? oldEvent.end?.dateTime
      }
    })
  })
  if (!respone.ok) {
    throw new Error(`${respone.status} : ${await respone.text()}`);
  }
  return await respone.json();
}
const server = new Server(
  { name: "mcp_server", version: "1.0.0" },
  { capabilities: { tools: {} } },      
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  try {
    switch (req.params.name) {
      case "create_event": {
        const ev = await createCalendarEvent(req.params.arguments as any);
        return {
          content: [
            {
              type: "text",
              text: `Event created: ${ev.htmlLink}`,
            },
          ],
        };
      }
      case "get_access_token": {
        const token = await getAuthClient();
        return {
          content: [
            {
              type: "text",
              text: (await token.getAccessToken()).token,
            }
          ]
        }
      }
      case "create_event_quick": {
        const respone = await createEventQuick(req.params.arguments?.text as string)
        return {
          content: [
            {type : "text",
            text: JSON.stringify(respone)}
          ]
        }
      }
      case "get_event": {
        const respone = await getEvent(req.params.arguments as any)
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(respone, null, 2),
            }
          ]
        }
      }
      case "update_event": {
        const respone = await updateEvent(req.params.arguments as any)
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(respone)
            }
          ]
        }
      }
      case "freeBusy": {
        const respone = await freeBusy(req.params.arguments?.timeMax as string, req.params.arguments?.timeMin as string);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(respone),
            }
          ]
        }
      }
      case "move_event": {
        const respone = await moveEvent(req.params.arguments?.id as string, req.params.arguments?.timeMax as string, req.params.arguments?.timeMin as string);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(respone),
            }
          ]
        }
        }
      default:
        throw new Error(`Unknown tool: ${req.params.name}`);
    }
  } catch (err: any) {
    console.error("Tool execution error:", err);
    throw err;
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
