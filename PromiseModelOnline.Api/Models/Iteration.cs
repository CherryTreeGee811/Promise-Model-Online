using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
<<<<<<< HEAD
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace PromiseModelOnline.Api.Models;

public class Iteration
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    public int ProjectId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey(nameof(ProjectId))]
    [ValidateNever]
||||||| 1bedf4f
=======

namespace PromiseModelOnline.Api.Models;

public class Iteration
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    public int ProjectId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey(nameof(ProjectId))]
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
    public Project Project { get; set; } = null!;

    public ICollection<Stride> Strides { get; set; } = new List<Stride>();
}