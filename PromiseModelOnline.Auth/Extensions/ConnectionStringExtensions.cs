public static class ConnectionStringExtensions
{
    public static string ResolveSecrets(this string connectionString)
    {
        if (!connectionString.Contains("Password_FILE="))
            return connectionString;

        var parts = connectionString.Split(';', StringSplitOptions.RemoveEmptyEntries).ToList();

        for (int i = 0; i < parts.Count; i++)
        {
            if (parts[i].StartsWith("Password_FILE="))
            {
                var filePath = parts[i].Substring("Password_FILE=".Length);

                if (File.Exists(filePath))
                {
                    var password = File.ReadAllText(filePath).Trim();
                    parts[i] = $"Password={password}";
                }
            }
        }

        return string.Join(';', parts);
    }
}