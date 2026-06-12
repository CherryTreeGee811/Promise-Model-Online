namespace PromiseModelOnline.Auth.Models;

public class RegisterResponse
{
    public bool Created { get; set; }
    public string? UserName { get; set; }
    public string? Email { get; set; }
}
