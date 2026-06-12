using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.DTOs;

public class CreatePermissionRequestDTO
{
<<<<<<< HEAD
    public string Email { get; set; } = string.Empty;
||||||| 1bedf4f
=======
    public string UserEmail { get; set; } = string.Empty;
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
    public int ProjectId { get; set; }
    public PermissionLevel Level { get; set; }
}