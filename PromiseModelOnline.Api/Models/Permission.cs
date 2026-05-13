using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.Models;

public class Permission
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    public int ProjectId { get; set; }

    [Required]
    public PermissionLevel Level { get; set; } = PermissionLevel.View;

    public PermissionStatus Status { get; set; } = PermissionStatus.Pending;

    [ForeignKey("UserId")]
    public User User { get; set; } = null!;

    [ForeignKey("ProjectId")]
    public Project Project { get; set; } = null!;
}