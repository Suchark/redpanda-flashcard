# ใช้ .NET SDK สำหรับ Build แอปพลิเคชัน
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# คัดลอกไฟล์ทั้งหมดจาก GitHub เข้ามา
COPY . .

# เจาะลึกเข้าไปในเส้นทางที่ถูกต้อง (backend/RedPandaApi)
WORKDIR /src/backend/RedPandaApi

# Build และ Publish โปรเจกต์
RUN dotnet publish RedPandaApi.csproj -c Release -o /app/publish

# ใช้ .NET Runtime สำหรับรันเซิร์ฟเวอร์จริง
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# กำหนด Port และคำสั่งรันแอป
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "RedPandaApi.dll"]
