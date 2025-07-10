import { useState, useEffect, useRef } from "react"
import Calendar from "react-calendar"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { ScrollArea } from "./components/ui/scroll-area"
import { Badge } from "./components/ui/badge"
import { Separator } from "./components/ui/separator"
import { CalendarDays, MessageCircle, Clock, Plus } from "lucide-react"
import "react-calendar/dist/Calendar.css"

interface Message {
  role: string
  content: string
}
interface Event {
  id: string
  summary: string
  time: string
  description?: string
}
export default function HomeCalendar() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [date, setDate] = useState<Date>(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const getISODateRange = (selectedDate: Date) => {
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
  
    const end = new Date(selectedDate);
    end.setHours(23, 59, 0, 0);
  
    const formatWithOffset = (date: Date) => {
      const year = date.getFullYear();
      const month = `${date.getMonth() + 1}`.padStart(2, "0");
      const day = `${date.getDate()}`.padStart(2, "0");
      const hours = `${date.getHours()}`.padStart(2, "0");
      const minutes = `${date.getMinutes()}`.padStart(2, "0");
      const seconds = `${date.getSeconds()}`.padStart(2, "0");
  
      const offset = -date.getTimezoneOffset();
      const sign = offset >= 0 ? "+" : "-";
      const absOffset = Math.abs(offset);
      const offsetHours = `${Math.floor(absOffset / 60)}`.padStart(2, "0");
      const offsetMinutes = `${absOffset % 60}`.padStart(2, "0");
  
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}:${offsetMinutes}`;
    };
  
    return {
      timeMin: formatWithOffset(start),
      timeMax: formatWithOffset(end),
    };
  };
  
  const fetchEventsForDate = async (selectedDate: Date) => {
  setLoading(true)
  try {
    const { timeMin, timeMax } = getISODateRange(selectedDate);
    console.log(timeMin + "  " + timeMax);
    const res = await fetch("http://localhost:8000/getEventByDate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        start: timeMin,
        end: timeMax,
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    console.log("🎯 API result:", data);
    const mapped: Event[] = data.events.map((event: any) => ({
      id: event.id,
      summary: event.summary,
      description: event.description,
      time: new Date(event.start?.dateTime || event.start?.date).toLocaleString("vi-VN"),
    }));
    setEvents(mapped);
    console.log(mapped)
  } catch (error) {
    console.error("Error fetching events:", error)
    setEvents([])
  } finally {
    setLoading(false)
  }
  }

  const sendMessage = async () => {
    if (!input.trim()) return

    const newMessages = [...messages, { role: "user", content: input }]
    setMessages(newMessages)
    setInput("")

    try {
      const res = await fetch("http://localhost:8000/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      })
      const data = await res.json()
      setMessages([...newMessages, { role: "agent", content: data.reply }])
    } catch (error) {
      console.error("Error sending message:", error)
      setMessages([...newMessages, { role: "agent", content: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại." }])
    }
  }

  const handleDateChange = (value: any) => {
    let selectedDate: Date
    if (value instanceof Date) {
      selectedDate = value
    } else if (Array.isArray(value) && value[0] instanceof Date) {
      selectedDate = value[0]
    } else {
      return
    }

    setDate(selectedDate)
    fetchEventsForDate(selectedDate)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    fetchEventsForDate(date)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Trợ Lý Ảo</h1>
          <p className="text-gray-600">Quản lý lịch trình và trò chuyện thông minh</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar and Events Section */}
          <div className="space-y-6">
            {/* Calendar Card */}
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-blue-600" />
                  Lịch
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="calendar-container">
                  <Calendar onChange={handleDateChange} value={date} className="mx-auto" />
                </div>
                <div className="mt-4 text-center">
                  <Badge variant="outline" className="text-sm">
                    Ngày đã chọn: {date.toLocaleDateString("vi-VN")}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Events Card */}
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  Sự kiện trong ngày
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : events.length > 0 ? (
                    <div className="space-y-3">
                      {events.map((event) => (
                        <div
                          key={event.id}
                          className="p-3 rounded-lg border bg-white hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{event.summary}</h4>
                              <p className="text-sm text-gray-600 mt-1">{event.description || "Không có mô tả"}</p>
                            </div>
                            <Badge className={`ml-2`}>{event.time}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )  : (
                    <div className="text-center py-8 text-gray-500">
                      <Plus className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Không có sự kiện nào trong ngày này</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Chat Section */}
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-purple-600" />
                Trò chuyện để lập lịch
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-96 p-4">
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Bắt đầu cuộc trò chuyện để lập lịch</p>
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl ${
                          msg.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <Separator />

              <div className="p-4">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Nhập yêu cầu lập lịch..."
                    className="flex-1"
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  />
                  <Button onClick={sendMessage} className="bg-blue-600 hover:bg-blue-700">
                    Gửi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
