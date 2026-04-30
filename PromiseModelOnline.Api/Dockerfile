# See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

# This stage is used when running from VS in fast mode (Default for Debug configuration)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8000/tcp

# This stage is used to build the service project
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["PromiseModelOnline.Api/PromiseModelOnline.Api.csproj", "PromiseModelOnline.Api/"]
RUN dotnet restore "./PromiseModelOnline.Api/PromiseModelOnline.Api.csproj"
COPY . .
WORKDIR "/src/PromiseModelOnline.Api"
RUN dotnet build "./PromiseModelOnline.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

# This stage is used to publish the service project to be copied to the final stage
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./PromiseModelOnline.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# This stage is used in production or when running from VS in regular mode (Default when not using the Debug configuration)
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
# Copy CSV seed data into the runtime image so the seeder can find `pmo_pm`
COPY --from=build /src/pmo_pm /app/pmo_pm
# Ensure files are readable by the app user
USER root
RUN chown -R app:app /app/pmo_pm || true
USER app
# Copy SSL certificate and key into the image
COPY PromiseModelOnline.Api/cert.pem /app/cert.pem
COPY PromiseModelOnline.Api/key.pem /app/key.pem
USER root
RUN chown app:app /app/cert.pem /app/key.pem
RUN chmod 600 /app/cert.pem /app/key.pem
USER app
ENTRYPOINT ["dotnet", "PromiseModelOnline.Api.dll"]
