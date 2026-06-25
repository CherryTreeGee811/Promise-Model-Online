# ===============================
# Build stage
# ===============================
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["PromiseModelOnline.BFF/PromiseModelOnline.BFF.csproj", "PromiseModelOnline.BFF/"]
RUN dotnet restore "PromiseModelOnline.BFF/PromiseModelOnline.BFF.csproj"

COPY . .
WORKDIR "/src/PromiseModelOnline.BFF"
RUN dotnet publish -c Release -o /app/publish

# ===============================
# Runtime stage
# ===============================
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
USER root
RUN apt-get update && apt-get install -y --no-install-recommends curl=8.5.0-2ubuntu10.9 \
    && rm -rf /var/lib/apt/lists/*
USER app
COPY --from=build /app/publish .
COPY PromiseModelOnline.BFF/cert.pem /app/cert.pem
COPY PromiseModelOnline.BFF/key.pem /app/key.pem

USER root
RUN chown app:app /app/cert.pem /app/key.pem && chmod 600 /app/cert.pem /app/key.pem && \
    mkdir -p /app/dp-keys && chown app:app /app/dp-keys
USER app

EXPOSE 8010

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD curl -fk https://localhost:8010/health || exit 1

ENTRYPOINT ["dotnet", "PromiseModelOnline.BFF.dll"]
