# See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

# This stage is used when running from VS in fast mode (Default for Debug configuration)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER 1654
WORKDIR /app
EXPOSE 8060/tcp

# This stage is used to build the service project
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["PromiseModelOnline.Auth/PromiseModelOnline.Auth.csproj", "PromiseModelOnline.Auth/"]
RUN dotnet restore "./PromiseModelOnline.Auth/PromiseModelOnline.Auth.csproj"
COPY . .
WORKDIR "/src/PromiseModelOnline.Auth"
RUN dotnet build "./PromiseModelOnline.Auth.csproj" -c $BUILD_CONFIGURATION -o /app/build

# This stage is used to publish the service project to be copied to the final stage
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./PromiseModelOnline.Auth.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# This stage is used in production or when running from VS in regular mode (Default when not using the Debug configuration)
FROM base AS final
WORKDIR /app
USER 0
# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
USER 1654
COPY --from=publish /app/publish .
# Copy static files (CSS, JS, images)
COPY PromiseModelOnline.Auth/wwwroot /app/wwwroot
USER 0
RUN mkdir -p /app/dp-keys && chown app:app /app/dp-keys
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD ["curl", "-fk", "https://localhost:8060/health"]

USER 1654
ENTRYPOINT ["dotnet", "PromiseModelOnline.Auth.dll"]
