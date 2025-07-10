# MCP Server & OpenAI Agent Chat Scheduler

## Giới thiệu

Dự án này bao gồm một **MCP Server** và một **Agent sử dụng OpenAI**, nhằm hỗ trợ người dùng tương tác qua trò chuyện và **tự động lập lịch các sự kiện**. Khi người dùng yêu cầu lập lịch thông qua cuộc hội thoại, hệ thống sẽ liên kết với **Google Calendar API** để tạo và quản lý sự kiện theo thời gian thực.

## Tính năng chính

- Giao tiếp tự nhiên với người dùng thông qua OpenAI Chat Agent.
- Xử lý các yêu cầu lập lịch như: đặt lịch họp, nhắc nhở công việc, hẹn giờ sự kiện, v.v.
- Đồng bộ trực tiếp với **Google Calendar** để tạo, cập nhật và xoá sự kiện.
- MCP Server đảm nhận vai trò quản lý, phân phối và xử lý yêu cầu giữa Agent và các dịch vụ bên ngoài.

## Mục tiêu

- Tự động hóa quy trình lên lịch công việc thông qua giao tiếp bằng ngôn ngữ tự nhiên.
- Tích hợp trí tuệ nhân tạo để hiểu và xử lý ngữ cảnh yêu cầu.
- Đồng bộ hóa các hoạt động với hệ thống lịch phổ biến (Google Calendar).

## Công nghệ sử dụng

- OpenAI API (ChatGPT)
- Google Calendar API
- MCP Server (Java/Python/Node.js tuỳ theo phần triển khai)
- OAuth 2.0 cho xác thực Google
- RESTful API

## Cách hoạt động

1. Người dùng gửi yêu cầu qua giao diện chat (ví dụ: “Đặt lịch họp với nhóm vào 10h sáng mai”).
2. Agent xử lý ngữ nghĩa yêu cầu bằng OpenAI và phân tích thời gian, địa điểm, đối tượng liên quan.
3. MCP Server nhận thông tin, xác thực với Google Calendar và thực hiện hành động tương ứng.
4. Phản hồi lại kết quả đã lập lịch hoặc lỗi (nếu có) cho người dùng.

## Ghi chú

- Cần có thông tin xác thực Google (OAuth 2.0) để sử dụng API Calendar.
- Hiện tại chỉ hỗ trợ tích hợp với Google Calendar, các nền tảng khác sẽ được bổ sung trong tương lai.

## Tác giả

Thu Thanh – 2025

