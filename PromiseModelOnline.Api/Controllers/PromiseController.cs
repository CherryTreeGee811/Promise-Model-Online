using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Controllers;

public class PromiseController
{
    private readonly ApplicationDbContext _context;

    public PromiseController(ApplicationDbContext context)
    {
        _context = context;
    }
}