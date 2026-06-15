namespace PromiseModelOnline.Api.Models;

/// <summary>DTO for registration responses returned to the client.</summary>
/// <remarks>
///   Indicates whether the registration was successful (new user created) and the resulting
///   user's name and email.
/// </remarks>
public class RegisterResponse
{
    /// <summary><c>true</c> if a new user was created; <c>false</c> if the user already existed.</summary>
    public bool Created { get; set; }
    
    /// <summary>The user's display name.</summary>
    public string? UserName { get; set; }
    
    /// <summary>The user's email address.</summary>
    public string? Email { get; set; }
}
