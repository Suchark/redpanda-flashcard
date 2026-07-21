# ใช้ .NET SDK สำหรับ Build แอปพลิเคชัน
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# คัดลอกไฟล์ทั้งหมดมาวาง
COPY . .

# เจาะลึกเข้าไปในโฟลเดอร์โปรเจกต์จริง
WORKDIR /src/backend/RedPandaApi
RUN dotnet publish RedPandaApi.csproj -c Release -o /app/publish

# ใช้ .NET Runtime สำหรับรันเซิร์ฟเวอร์จริง
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# ตั้งค่าให้เป็น Production และปิดการใช้งาน inotify ที่ทำให้เกิด error 139
ENV ASPNETCORE_ENVIRONMENT=Production
ENV DOTNET_USE_POLLING_FILE_WATCHER=true

# กำหนด Port และคำสั่งรันแอป
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "RedPandaApi.dll"]
