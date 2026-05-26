using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using System.Net;
using System.Security;

namespace PromiseModelOnline.Api.DAL;

public class AuthClient : IAuthClient
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;

    public AuthClient(HttpClient http, IConfiguration config)
    {
        _http = http;
        _config = config;
    }

    public async Task<TokenResponse> LoginAsync(UserLogin userLogin)
    {
        try
        {
            var response = await _http.PostAsJsonAsync("api/sessions", userLogin);

            if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                throw new UnauthorizedAccessException("Invalid username or password");
            }

            response.EnsureSuccessStatusCode();
            return (await response.Content.ReadFromJsonAsync<TokenResponse>()) ?? new TokenResponse();
        }
        catch (HttpRequestException httpEx)
        {
            Console.WriteLine(httpEx);
            throw new Exception("Error communicating with authentication service.");
        }
    }

    public async Task<RegisterResponse?> RegisterAsync(RegisterRequest request)
    {
        var registrationKey = _config["Auth:RegistrationKey"];
        var message = new HttpRequestMessage(HttpMethod.Post, "api/users")
        {
            Content = JsonContent.Create(request)
        };

        if (!string.IsNullOrEmpty(registrationKey))
        {
            message.Headers.Add("X-Registration-Key", registrationKey);
        }

        try
        {
            var resp = await _http.SendAsync(message);
            if (resp.IsSuccessStatusCode)
            {
                return await resp.Content.ReadFromJsonAsync<RegisterResponse>();
            }

            if (resp.StatusCode == HttpStatusCode.BadRequest)
            {
                throw new ArgumentException("Bad request");
            }

            if (resp.StatusCode == HttpStatusCode.Forbidden)
            {
                throw new SecurityException("Forbidden");
            }

            if (resp.StatusCode == System.Net.HttpStatusCode.Conflict)
            {
                return null;
            }

            resp.EnsureSuccessStatusCode();
            return null;
        }
        catch (HttpRequestException httpEx)
        {
            Console.WriteLine(httpEx);
            throw new Exception("Error communicating with authentication service.");
        }
    }

    public async Task<TokenResponse> RefreshAsync(RefreshRequest request)
    {
        try
        {
            var response = await _http.PostAsJsonAsync("api/access-tokens", request);

            if (response.StatusCode == HttpStatusCode.BadRequest)
            {
                throw new ArgumentException("Bad request");
            }

            if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                throw new UnauthorizedAccessException("Invalid or expired refresh token");
            }

            response.EnsureSuccessStatusCode();
            return (await response.Content.ReadFromJsonAsync<TokenResponse>()) ?? new TokenResponse();
        }
        catch (HttpRequestException httpEx)
        {
            Console.WriteLine(httpEx);
            throw new Exception("Error communicating with authentication service.");
        }
    }

    public async Task LogoutAsync(LogoutRequest? request, string authorizationHeader)
    {
        try
        {
            var message = new HttpRequestMessage(HttpMethod.Delete, "api/sessions/current")
            {
                Content = JsonContent.Create(request)
            };

            message.Headers.TryAddWithoutValidation("Authorization", authorizationHeader);
            var response = await _http.SendAsync(message);

            if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                throw new UnauthorizedAccessException("Unauthorized");
            }

            response.EnsureSuccessStatusCode();
        }
        catch (HttpRequestException httpEx)
        {
            Console.WriteLine(httpEx);
            throw new Exception("Error communicating with authentication service.");
        }
    }

    public async Task ChangePasswordAsync(ChangePasswordRequest request, string authorizationHeader)
    {
        if (string.IsNullOrWhiteSpace(authorizationHeader))
        {
            throw new UnauthorizedAccessException("Unauthorized");
        }

        var message = new HttpRequestMessage(HttpMethod.Patch, "api/users/me")
        {
            Content = JsonContent.Create(request)
        };

        message.Headers.TryAddWithoutValidation("Authorization", authorizationHeader);

        try
        {
            var resp = await _http.SendAsync(message);
            if (resp.StatusCode == HttpStatusCode.Unauthorized)
            {
                throw new UnauthorizedAccessException("Unauthorized");
            }

            if (resp.StatusCode == HttpStatusCode.BadRequest)
            {
                throw new ArgumentException("Bad request");
            }

            resp.EnsureSuccessStatusCode();
        }
        catch (HttpRequestException httpEx)
        {
            Console.WriteLine(httpEx);
            throw new Exception("Error communicating with authentication service.");
        }
    }

    public async Task DeleteAccountAsync(DeleteAccountRequest request, string authorizationHeader)
    {
        if (string.IsNullOrWhiteSpace(authorizationHeader))
        {
            throw new UnauthorizedAccessException("Unauthorized");
        }

        var message = new HttpRequestMessage(HttpMethod.Delete, "api/users/me")
        {
            Content = JsonContent.Create(request)
        };

        message.Headers.TryAddWithoutValidation("Authorization", authorizationHeader);

        try
        {
            var resp = await _http.SendAsync(message);
            if (resp.StatusCode == HttpStatusCode.Unauthorized)
            {
                throw new UnauthorizedAccessException("Unauthorized");
            }

            if (resp.StatusCode == HttpStatusCode.BadRequest)
            {
                throw new ArgumentException("Bad request");
            }

            resp.EnsureSuccessStatusCode();
        }
        catch (HttpRequestException httpEx)
        {
            Console.WriteLine(httpEx);
            throw new Exception("Error communicating with authentication service.");
        }
    }

    public async Task<bool> EnsureSeedUserAsync(string userName, string email, string password)
    {
        var req = new RegisterRequest
        {
            UserName = userName,
            Email = email,
            Password = password
        };

        try
        {
            var result = await RegisterAsync(req);
            return true;
        }
        catch
        {
            return false;
        }
    }
}
