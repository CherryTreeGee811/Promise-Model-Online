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
RUN apt-get update && apt-get install -y curl \
    && rm -rf /var/lib/apt/lists/*
USER app
COPY --from=build /app/publish .
COPY PromiseModelOnline.BFF/cert.pem /app/cert.pem
COPY PromiseModelOnline.BFF/key.pem /app/key.pem

USER root
RUN chown app:app /app/cert.pem /app/key.pem
RUN chmod 600 /app/cert.pem /app/key.pem
USER app

# Optional: trust dev cert or skip validation handled in code
EXPOSE 8010

ENTRYPOINT ["dotnet", "PromiseModelOnline.BFF.dll"]
