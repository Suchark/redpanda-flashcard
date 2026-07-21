# ใช้ .NET SDK สำหรับ Build แอปพลิเคชัน
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# คัดลอกไฟล์โปรเจกต์ทั้งหมดมาวาง
COPY . .
WORKDIR "/src/backend"

# Build และ Publish โปรเจกต์
RUN dotnet publish -c Release -o /app/publish

# ใช้ .NET Runtime สำหรับรันเซิร์ฟเวอร์จริง (ไฟล์เล็กและปลอดภัยกว่า)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# กำหนด Port และคำสั่งรันแอป
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "RedPandaApi.dll"]
