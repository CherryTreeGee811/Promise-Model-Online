# ===============================
# Build stage
# ===============================
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["PromiseModelOnline.Gateway/PromiseModelOnline.Gateway.csproj", "PromiseModelOnline.Gateway/"]
RUN dotnet restore "PromiseModelOnline.Gateway/PromiseModelOnline.Gateway.csproj"

COPY . .
WORKDIR "/src/PromiseModelOnline.Gateway"
RUN dotnet publish -c Release -o /app/publish

# ===============================
# Runtime stage
# ===============================
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app

COPY --from=build /app/publish .
COPY PromiseModelOnline.Gateway/cert.pem /app/cert.pem
COPY PromiseModelOnline.Gateway/key.pem /app/key.pem

RUN chown app:app /app/cert.pem /app/key.pem
RUN chmod 600 /app/cert.pem /app/key.pem

# Optional: trust dev cert or skip validation handled in code
EXPOSE 8010

ENTRYPOINT ["dotnet", "PromiseModelOnline.Gateway.dll"]