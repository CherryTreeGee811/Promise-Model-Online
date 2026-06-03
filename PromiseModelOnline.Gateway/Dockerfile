FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080/tcp

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["PromiseModelOnline.Gateway/PromiseModelOnline.Gateway.csproj", "PromiseModelOnline.Gateway/"]
RUN dotnet restore "./PromiseModelOnline.Gateway/PromiseModelOnline.Gateway.csproj"
COPY . .
WORKDIR "/src/PromiseModelOnline.Gateway"
RUN dotnet build "./PromiseModelOnline.Gateway.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./PromiseModelOnline.Gateway.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
COPY PromiseModelOnline.Gateway/cert.pem /app/cert.pem
COPY PromiseModelOnline.Gateway/key.pem /app/key.pem
USER root
RUN chown app:app /app/cert.pem /app/key.pem
RUN chmod 600 /app/cert.pem /app/key.pem
USER app
ENTRYPOINT ["dotnet", "PromiseModelOnline.Gateway.dll"]
