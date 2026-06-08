using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PromiseModelOnline.Api.Models;

public class EntitySequence
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public int ParentId { get; set; }

    [Key]
    [MaxLength(50)]
    public string Scope { get; set; } = null!;

    public int NextSequenceNumber { get; set; } = 1;
}
