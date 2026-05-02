using PromiseModelOnline.Api.DAL.Interfaces;
using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;

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

    public async Task<bool> EnsureSeedUserAsync(string userName, string email, string password)
    {
        var req = new
        {
            UserName = userName,
            Email = email,
            Password = password
        };

        var registrationKey = _config["Auth:RegistrationKey"];
        var message = new HttpRequestMessage(HttpMethod.Post, "auth/register")
        {
            Content = JsonContent.Create(req)
        };

        if (!string.IsNullOrEmpty(registrationKey))
        {
            message.Headers.Add("X-Registration-Key", registrationKey);
        }

        var resp = await _http.SendAsync(message);
        if (resp.IsSuccessStatusCode)
        {
            return true;
        }

        // 409 Conflict means already exists
        if (resp.StatusCode == System.Net.HttpStatusCode.Conflict)
        {
            return true;
        }

        return false;
    }
}
