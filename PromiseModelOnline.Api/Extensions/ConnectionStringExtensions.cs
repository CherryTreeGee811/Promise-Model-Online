namespace PromiseModelOnline.Api.Extensions;

/// <summary>Resolves Docker secrets in connection strings by replacing <c>Password_FILE=</c> with the file contents.</summary>
/// <remarks>
///   Looks for <c>Password_FILE=/run/secrets/...</c> in the connection string and replaces it with
///   <c>Password=</c> using the contents of the referenced file. Supports Docker Swarm secrets.
///   Throws if the secret file does not exist or is empty.
/// </remarks>
public static class ConnectionStringExtensions
{
    /// <summary>Resolve any <c>Password_FILE</c> references in the connection string to their actual values.</summary>
    /// <param name="connectionString">The raw connection string, possibly containing <c>Password_FILE=</c> entries.</param>
    /// <returns>The resolved connection string with passwords inlined.</returns>
    /// <exception cref="InvalidOperationException">The secret file is not found or is empty.</exception>
    public static string ResolveSecrets(this string connectionString)
    {
        if (!connectionString.Contains("Password_FILE="))
            return connectionString;

        var parts = connectionString.Split(';', StringSplitOptions.RemoveEmptyEntries).ToList();

        for (int i = 0; i < parts.Count; i++)
        {
            if (parts[i].StartsWith("Password_FILE="))
            {
                var filePath = parts[i]["Password_FILE=".Length..];

                if (!File.Exists(filePath))
                    throw new InvalidOperationException(
                        $"Secret file '{filePath}' not found. Mount a Docker secret at this path.");

                var password = File.ReadAllText(filePath).Trim();

                if (string.IsNullOrEmpty(password))
                    throw new InvalidOperationException(
                        $"Secret file '{filePath}' is empty. Populate it with a password.");

                parts[i] = $"Password={password}";
            }
        }

        return string.Join(';', parts);
    }
}
