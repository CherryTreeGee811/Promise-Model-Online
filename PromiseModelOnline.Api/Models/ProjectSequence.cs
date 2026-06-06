using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PromiseModelOnline.Api.Models;

public class ProjectSequence
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public int ProjectId { get; set; }

    public int NextSequenceNumber { get; set; } = 1;
}
