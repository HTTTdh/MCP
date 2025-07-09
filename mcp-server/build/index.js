// npm run inspector
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { token } from "../../agent/token.js";
const CREATE_EVENT = {
    name: "create_event",
    description: "Tạo sự kiện Google Calendar",
    inputSchema: {
        type: "object",
        required: ["summary", "startISO", "endISO"],
        properties: {
            summary: { type: "string" },
            startISO: { type: "string" },
            endISO: { type: "string" },
            description: { type: "string" },
            attendees: {
                type: "array",
                items: { type: "string", format: "email" },
            },
        },
    },
};
const CREATE_EVENT_QUICK = {
    name: "create_event_quick",
    description: "Tạo sự kiện Google Calendar nhanh",
    inputSchema: {
        type: "object",
        properties: {
            text: { type: "string" }
        }
    },
    required: ["text"]
};
const GET_EVENT = {
    name: "get_event",
    description: "Lấy thông tin sự kiện Google Calendar",
    inputSchema: {
        type: "object",
        properties: {
            q: { type: "string" }
        }
    },
    required: ["q"]
};
const UPDATE_EVENT = {
    name: "update_event",
    description: "Chỉnh sửa thông tin về sự kiện được yêu cầu",
    inputSchema: {
        type: "object",
        properties: {
            id: { type: "string" },
            summary: { type: "string" },
            location: { type: "string" },
            startISO: { type: "string" },
            endISO: { type: "string" },
            description: { type: "string" },
            attendees: {
                type: "array",
                items: { type: "string", format: "email" },
            },
        }
    },
    required: ["id"]
};
const BUSY = {
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
};
const MOVE_EVENT = {
    name: "move_event",
    description: "thay đổi thời gian của event",
    inputSchema: {
        type: "object",
        properties: {
            id: { type: "string" },
            timeMin: { type: "string" },
            timeMax: { type: "string" }
        }
    },
    required: ["id"]
};
const TOOLS = [CREATE_EVENT, CREATE_EVENT_QUICK, GET_EVENT, UPDATE_EVENT, BUSY, MOVE_EVENT];
async function createCalendarEvent(input) {
    const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            summary: input.summary,
            description: input.description,
            start: { dateTime: input.startISO, timeZone: "Asia/Ho_Chi_Minh" },
            end: { dateTime: input.endISO, timeZone: "Asia/Ho_Chi_Minh" },
            attendees: input.attendees?.map(email => ({ email })),
            reminders: { useDefault: true },
            conferenceData: {
                createRequest: {
                    requestId: crypto.randomUUID(),
                    conferenceSolutionKey: { type: "hangoutsMeet" },
                },
            },
        }),
    });
    if (!res.ok) {
        throw new Error(`Calendar API error ${res.status}: ${await res.text()}`);
    }
    return await res.json();
}
async function createEventQuick(text) {
    const respone = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/quickAdd?text=${text}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        }
    });
    if (!respone.ok) {
        throw new Error(`${respone.status}` + `${token}`);
    }
    return respone.json();
}
async function searchCalendarEvents(keyword, access) {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=2025-01-01T00:00:00Z&timeMax=2025-12-31T23:59:59Z&access_token=${access}`);
    const data = await res.json();
    const results = data.items.filter((event) => event.summary?.toLowerCase().includes(keyword.toLowerCase()));
    return results;
}
async function getEvent(input) {
    return await searchCalendarEvents(input.q, token);
}
async function getEventById(id) {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${id}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        }
    });
    const oldEvent = await res.json();
    return oldEvent;
}
async function updateEvent(input) {
    const oldEvent = await getEventById(input.id);
    const respone = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${input.id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            "summary": input.summary ?? oldEvent.summary,
            "description": input.description ?? oldEvent.description,
            "location": input.location ?? oldEvent.location,
            "start": { dateTime: input.startISO ?? oldEvent.start?.dateTime, timeZone: "Asia/Ho_Chi_Minh" },
            "end": { dateTime: input.endISO ?? oldEvent.end?.dateTime, timeZone: "Asia/Ho_Chi_Minh" },
            "attendees": input.attendees?.map(email => ({ email })) ?? oldEvent.attendees?.map((email) => ({ email })),
        })
    });
    if (!respone.ok) {
        throw new Error(`${respone.status} : ${await respone.text()}`);
    }
    return respone.json();
}
async function freeBusy(timeMax, timeMin) {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/freeBusy`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            "timeMax": timeMax,
            "timeMin": timeMin,
            "timeZone": "Asia/Ho_Chi_Minh",
            "items": [{ id: "primary" }]
        })
    });
    if (!res.ok) {
        throw new Error(`${res.status} : ${await res.text()}`);
    }
    return await res.json();
}
async function moveEvent(id, timeMax, timeMin) {
    const oldEvent = await getEventById(id);
    const respone = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            "start": {
                "dateTime": timeMin ?? oldEvent.start?.dateTime
            },
            "end": {
                "dateTime": timeMax ?? oldEvent.end?.dateTime
            }
        })
    });
    if (!respone.ok) {
        throw new Error(`${respone.status} : ${await respone.text()}`);
    }
    return await respone.json();
}
const server = new Server({ name: "mcp_server", version: "1.0.0" }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
}));
server.setRequestHandler(CallToolRequestSchema, async (req) => {
    try {
        switch (req.params.name) {
            case "create_event": {
                const ev = await createCalendarEvent(req.params.arguments);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Event created: ${ev.htmlLink}`,
                        },
                    ],
                };
            }
            case "create_event_quick": {
                const respone = await createEventQuick(req.params.arguments?.text);
                return {
                    content: [
                        { type: "text",
                            text: JSON.stringify(respone) }
                    ]
                };
            }
            case "get_event": {
                const respone = await getEvent(req.params.arguments);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(respone, null, 2),
                        }
                    ]
                };
            }
            case "update_event": {
                const respone = await updateEvent(req.params.arguments);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(respone)
                        }
                    ]
                };
            }
            case "freeBusy": {
                const respone = await freeBusy(req.params.arguments?.timeMax, req.params.arguments?.timeMin);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(respone),
                        }
                    ]
                };
            }
            case "move_event": {
                const respone = await moveEvent(req.params.arguments?.id, req.params.arguments?.timeMax, req.params.arguments?.timeMin);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(respone),
                        }
                    ]
                };
            }
            default:
                throw new Error(`Unknown tool: ${req.params.name}`);
        }
    }
    catch (err) {
        console.error("Tool execution error:", err);
        throw err;
    }
});
const transport = new StdioServerTransport();
await server.connect(transport);
