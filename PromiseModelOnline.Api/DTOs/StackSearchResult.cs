namespace PromiseModelOnline.Api.DTOs;

/// <summary>Result item from a hierarchy stack search for the auto-complete UI.</summary>
public record StackSearchResult(string EntityType, int Id, int SequenceNumber, string Statement, string StatusColor);
