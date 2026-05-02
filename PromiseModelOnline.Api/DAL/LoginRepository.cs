using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.DAL
{
    public class LoginRepository : ILoginRepository
    {
        private readonly HttpClient _httpClient;

        public LoginRepository(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<TokenResponse> LoginAsync(UserLogin userLogin)
        {
            try
            {
                var response = await _httpClient.PostAsJsonAsync("auth/login", userLogin);
                response.EnsureSuccessStatusCode();
                var tokenResponse = await response.Content.ReadFromJsonAsync<TokenResponse>();
                return tokenResponse ?? new TokenResponse();
            }
            catch (HttpRequestException httpEx)
            {
                Console.WriteLine(httpEx);
                throw new Exception("Error communicating with authentication service.");
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                throw;
            }
        }
    }
}