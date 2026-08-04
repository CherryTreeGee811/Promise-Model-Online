namespace PromiseModelOnline.Auth.Attributes;

[AttributeUsage(AttributeTargets.Property | AttributeTargets.Parameter)]
public sealed class DoNotSanitizeAttribute : Attribute;
