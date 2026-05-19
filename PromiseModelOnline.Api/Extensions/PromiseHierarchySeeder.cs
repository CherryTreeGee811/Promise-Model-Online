using System.Text;
using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Extensions;

public static class PromiseHierarchySeeder
{
    private const string TestUserEmail = "pmo@gmail.com";
    private const string TestUserName = "pmo_test";

    public static async Task SeedAsync(PromiseModelOnlineContext db, string contentRootPath,
        ILogger logger, PromiseModelOnline.Api.DAL.Interfaces.IAuthClient authClient)
    {
        // --- 0. Ensure test user exists in Auth service (optional) ---
        try
        {
            await authClient.EnsureSeedUserAsync(TestUserName, TestUserEmail,
                Convert.ToBase64String(Guid.NewGuid().ToByteArray()) + "!aA1");
        }
        catch (Exception ex)
        {
            logger?.LogWarning(ex, "Could not ensure test user in Auth service – continuing anyway.");
        }

        // --- 1. Ensure test user exists in API database ---
        var owner = await EnsureTestUserAsync(db);
        var pmoPmDir = ResolvePmoPmDirectory(contentRootPath);

        // --- 2. Projects ---
        var projectsCsvPath = Path.Combine(pmoPmDir, "Projects.csv");
        var projectRows = File.Exists(projectsCsvPath) ? ReadCsvRows(projectsCsvPath) : new();
        var projectIdBySourceId = new Dictionary<string, int>();
        Project? linkedProject = null;

        foreach (var prow in projectRows)
        {
            var sourceId = GetValue(prow, "Project ID");
            var name = GetValue(prow, "Project Name");
            var desc = GetValue(prow, "Description");
            var linked = GetValue(prow, "LinkedToSeeder").Equals("yes", StringComparison.OrdinalIgnoreCase);

            var created = await EnsureProjectByNameAsync(db, owner.Id, name, desc);
            projectIdBySourceId[sourceId] = created.Id;
            if (linked) linkedProject = created;
        }

        var project = linkedProject ?? await EnsureProjectAsync(db, owner.Id);
        if (!projectIdBySourceId.ContainsKey("PRJ-001"))
            projectIdBySourceId["PRJ-001"] = project.Id;

        // --- 3. Iterations (predefined IDs) ---
        await SeedIterationsAsync(db, pmoPmDir, projectIdBySourceId);

        // --- 4. Strides (predefined IDs, referencing iterations) ---
        await SeedStridesAsync(db, pmoPmDir);

        // --- 5. Promise hierarchy (Products, Epics, Journeys, Flows) ---
        var productRows = ReadCsvRows(Path.Combine(pmoPmDir, "LinuxMarksmen-Promise_Model_Tracker-Products.csv"));
        var epicRows    = ReadCsvRows(Path.Combine(pmoPmDir, "LinuxMarksmen-Promise_Model_Tracker-Epics.csv"));
        var journeyRows = ReadCsvRows(Path.Combine(pmoPmDir, "LinuxMarksmen-Promise_Model_Tracker-Journeys.csv"));
        var flowRows    = ReadCsvRows(Path.Combine(pmoPmDir, "LinuxMarksmen-Promise_Model_Tracker-Flows.csv"));
        var momentRows  = ReadCsvRows(Path.Combine(pmoPmDir, "LinuxMarksmen-Promise_Model_Tracker-Moments.csv"));

        var productLookup  = await SeedProductsAsync(db, project.Id, productRows);
        var epicLookup     = await SeedEpicsAsync(db, epicRows, productLookup);
        var journeyLookup  = await SeedJourneysAsync(db, journeyRows, epicLookup);
        var flowLookup     = await SeedFlowsAsync(db, flowRows, journeyLookup);
        var (inserted, total) = await SeedMomentsWithIdsAsync(db, momentRows, flowLookup);

        logger?.LogInformation(
            "Promise hierarchy seed complete. ProjectId: {ProjectId}, Products: {ProductsInserted}/{ProductsTotal}, Epics: {EpicsInserted}/{EpicsTotal}, Journeys: {JourneysInserted}/{JourneysTotal}, Flows: {FlowsInserted}/{FlowsTotal}, Moments: {MomentsInserted}/{MomentsTotal}",
            project.Id,
            productLookup.Inserted, productLookup.Total,
            epicLookup.Inserted, epicLookup.Total,
            journeyLookup.Inserted, journeyLookup.Total,
            flowLookup.Inserted, flowLookup.Total,
            inserted, total
        );
    }

    // -----------------------------------------------
    //  Seed iterations with predefined IDs
    // -----------------------------------------------
    private static async Task SeedIterationsAsync(PromiseModelOnlineContext db, string pmoPmDir,
        Dictionary<string, int> projectIdBySourceId)
    {
        var path = Path.Combine(pmoPmDir, "Iterations.csv");
        if (!File.Exists(path)) return;

        var rows = ReadCsvRows(path);
        foreach (var row in rows)
        {
            var iterationId = int.Parse(GetValue(row, "Iteration ID"));
            var projectSourceId = GetValue(row, "Project Source ID");
            var name = GetValue(row, "Iteration Name");

            if (!projectIdBySourceId.TryGetValue(projectSourceId, out var projectId)) continue;
            if (await db.Iterations.AnyAsync(i => i.Id == iterationId)) continue;

            var sql = @"
                SET IDENTITY_INSERT Iterations ON;
                INSERT INTO Iterations (Id, Name, ProjectId, CreatedAt)
                VALUES ({0}, {1}, {2}, {3});
                SET IDENTITY_INSERT Iterations OFF;";

            await db.Database.ExecuteSqlRawAsync(sql,
                iterationId,
                name,
                projectId,
                DateTime.UtcNow);
        }
    }

    // -----------------------------------------------
    //  Seed strides with predefined IDs
    // -----------------------------------------------
    private static async Task SeedStridesAsync(PromiseModelOnlineContext db, string pmoPmDir)
    {
        var path = Path.Combine(pmoPmDir, "Strides.csv");
        if (!File.Exists(path)) return;

        var rows = ReadCsvRows(path);
        foreach (var row in rows)
        {
            var strideId = int.Parse(GetValue(row, "Stride ID"));
            var name = GetValue(row, "Stride Name");
            var iterationId = int.Parse(GetValue(row, "Iteration ID"));
            var offsetStr = GetValue(row, "Start Date Offset");
            var durationStr = GetValue(row, "Duration Days");

            if (await db.Strides.AnyAsync(s => s.Id == strideId)) continue;

            var offset = int.TryParse(offsetStr, out var o) ? o : 0;
            var duration = int.TryParse(durationStr, out var d) ? d : 14;
            var startDate = DateTime.UtcNow.AddDays(offset);
            var endDate = startDate.AddDays(duration);
            var isActive = offset == 0;

            var sql = @"
                SET IDENTITY_INSERT Strides ON;
                INSERT INTO Strides (Id, Name, IterationId, StartDate, EndDate, DurationDays, IsActive, CreatedAt)
                VALUES ({0}, {1}, {2}, {3}, {4}, {5}, {6}, {7});
                SET IDENTITY_INSERT Strides OFF;";

            await db.Database.ExecuteSqlRawAsync(sql,
                strideId,
                name,
                iterationId,
                startDate,
                endDate,
                duration,
                isActive,
                DateTime.UtcNow);
        }
    }

    // -----------------------------------------------
    //  Seed moments with predefined IDs + stride assignment
    // -----------------------------------------------
    private static async Task<(int Inserted, int Total)> SeedMomentsWithIdsAsync(
        PromiseModelOnlineContext db,
        IReadOnlyList<Dictionary<string, string>> rows,
        SeedLookup flows)
    {
        var validRows = rows
            .Where(r => !string.IsNullOrWhiteSpace(GetValue(r, "Moment Promise ID"))
                    && !string.IsNullOrWhiteSpace(GetValue(r, "Parent Flow ID"))
                    && !string.IsNullOrWhiteSpace(GetValue(r, "Moment Promise Statement")))
            .ToList();

        var inserted = 0;
        foreach (var row in validRows)
        {
            var momentId = int.Parse(GetValue(row, "Moment ID"));
            if (await db.Moments.AnyAsync(m => m.Id == momentId)) continue;

            var flowSourceId = GetValue(row, "Parent Flow ID");
            if (!flows.IdBySourceId.TryGetValue(flowSourceId, out var flowId)) continue;

            var statement = GetValue(row, "Moment Promise Statement");
            var strideIdStr = GetValue(row, "Assigned Stride ID");

            int? strideId = null;
            if (!string.IsNullOrWhiteSpace(strideIdStr) &&
                int.TryParse(strideIdStr, out var parsedStrideId))
            {
                strideId = parsedStrideId;
            }

            var sql = @"
                SET IDENTITY_INSERT Moments ON;
                INSERT INTO Moments (Id, FlowId, Statement, Type, Status, DisplayOrder, CreatedAt, AssignedStrideId, StatusColor, IsZombie)
                VALUES ({0}, {1}, {2}, {3}, {4}, {5}, {6}, {7}, {8}, 0);
                SET IDENTITY_INSERT Moments OFF;";

            object? strideParam = strideId;

            var parameters = new object[]
            {
                momentId,
                flowId,
                statement,
                (int)MomentType.Story,
                (int)MomentStatus.Todo,
                momentId,
                DateTime.UtcNow,
                strideParam,
                "red"
            };
            await db.Database.ExecuteSqlRawAsync(sql, parameters);

            inserted++;
        }
        return (inserted, validRows.Count);
    }

    // ======================== Existing Promise Hierarchy Seeders =========================

    private static async Task<SeedLookup> SeedProductsAsync(PromiseModelOnlineContext db, int projectId, IReadOnlyList<Dictionary<string, string>> rows)
    {
        var seededRows = rows
            .Where(r => !string.IsNullOrWhiteSpace(GetValue(r, "Product Promise ID")) && !string.IsNullOrWhiteSpace(GetValue(r, "Product Promise Statement")))
            .OrderBy(r => GetValue(r, "Product Promise ID"), StringComparer.Ordinal)
            .ToList();

        var existing = await db.Promises
            .Where(p => p.ProjectId == projectId)
            .ToListAsync();

        var existingByStatementAndOrder = existing
            .GroupBy(p => new StatementOrder(p.Statement, p.DisplayOrder))
            .ToDictionary(g => g.Key, g => g.OrderBy(x => x.Id).First());

        var inserted = 0;
        var idMap = new Dictionary<string, int>(StringComparer.Ordinal);

        for (var i = 0; i < seededRows.Count; i++)
        {
            var row = seededRows[i];
            var sourceId = GetValue(row, "Product Promise ID");
            var statement = GetValue(row, "Product Promise Statement");
            var key = new StatementOrder(statement, i + 1);

            if (!existingByStatementAndOrder.TryGetValue(key, out var promise))
            {
                promise = new Promise
                {
                    Statement = statement,
                    ProjectId = projectId,
                    DisplayOrder = i + 1,
                    CreatedAt = DateTime.UtcNow
                };

                db.Promises.Add(promise);
                await db.SaveChangesAsync();
                inserted++;
                existingByStatementAndOrder[key] = promise;
            }

            idMap[sourceId] = promise.Id;
        }

        return new SeedLookup(idMap, inserted, seededRows.Count);
    }

    private static async Task<SeedLookup> SeedEpicsAsync(PromiseModelOnlineContext db, IReadOnlyList<Dictionary<string, string>> rows, SeedLookup products)
    {
        var seededRows = rows
            .Where(r => !string.IsNullOrWhiteSpace(GetValue(r, "Epic Promise ID"))
                && !string.IsNullOrWhiteSpace(GetValue(r, "Parent Product ID"))
                && !string.IsNullOrWhiteSpace(GetValue(r, "Epic Promise Statement")))
            .OrderBy(r => GetValue(r, "Epic Promise ID"), StringComparer.Ordinal)
            .ToList();

        var validRows = seededRows
            .Where(r => products.IdBySourceId.ContainsKey(GetValue(r, "Parent Product ID")))
            .ToList();

        var productIds = products.IdBySourceId.Values.ToHashSet();

        var existing = await db.Epics
            .Where(e => productIds.Contains(e.ProductPromiseId))
            .ToListAsync();

        var existingByParentAndStatement = existing
            .GroupBy(e => new ParentStatement(e.ProductPromiseId, e.Statement, e.DisplayOrder))
            .ToDictionary(g => g.Key, g => g.OrderBy(x => x.Id).First());

        var inserted = 0;
        var idMap = new Dictionary<string, int>(StringComparer.Ordinal);

        for (var i = 0; i < validRows.Count; i++)
        {
            var row = validRows[i];
            var sourceId = GetValue(row, "Epic Promise ID");
            var parentSourceId = GetValue(row, "Parent Product ID");
            var statement = GetValue(row, "Epic Promise Statement");

            var productId = products.IdBySourceId[parentSourceId];
            var key = new ParentStatement(productId, statement, i + 1);

            if (!existingByParentAndStatement.TryGetValue(key, out var epic))
            {
                epic = new Epic
                {
                    ProductPromiseId = productId,
                    Statement = statement,
                    DisplayOrder = i + 1,
                    CreatedAt = DateTime.UtcNow
                };

                db.Epics.Add(epic);
                await db.SaveChangesAsync();
                inserted++;
                existingByParentAndStatement[key] = epic;
            }

            idMap[sourceId] = epic.Id;
        }

        return new SeedLookup(idMap, inserted, validRows.Count);
    }

    private static async Task<SeedLookup> SeedJourneysAsync(PromiseModelOnlineContext db, IReadOnlyList<Dictionary<string, string>> rows, SeedLookup epics)
    {
        var seededRows = rows
            .Where(r => !string.IsNullOrWhiteSpace(GetValue(r, "Journey Promise ID"))
                && !string.IsNullOrWhiteSpace(GetValue(r, "Parent Epic ID"))
                && !string.IsNullOrWhiteSpace(GetValue(r, "Journey Promise Statement")))
            .OrderBy(r => GetValue(r, "Journey Promise ID"), StringComparer.Ordinal)
            .ToList();

        var validRows = seededRows
            .Where(r => epics.IdBySourceId.ContainsKey(GetValue(r, "Parent Epic ID")))
            .ToList();

        var epicIds = epics.IdBySourceId.Values.ToHashSet();

        var existing = await db.Journeys
            .Where(j => epicIds.Contains(j.EpicId))
            .ToListAsync();

        var existingByParentAndStatement = existing
            .GroupBy(j => new ParentStatement(j.EpicId, j.Statement, j.DisplayOrder))
            .ToDictionary(g => g.Key, g => g.OrderBy(x => x.Id).First());

        var inserted = 0;
        var idMap = new Dictionary<string, int>(StringComparer.Ordinal);

        for (var i = 0; i < validRows.Count; i++)
        {
            var row = validRows[i];
            var sourceId = GetValue(row, "Journey Promise ID");
            var parentSourceId = GetValue(row, "Parent Epic ID");
            var statement = GetValue(row, "Journey Promise Statement");

            var epicId = epics.IdBySourceId[parentSourceId];
            var key = new ParentStatement(epicId, statement, i + 1);

            if (!existingByParentAndStatement.TryGetValue(key, out var journey))
            {
                journey = new Journey
                {
                    EpicId = epicId,
                    Statement = statement,
                    DisplayOrder = i + 1,
                    CreatedAt = DateTime.UtcNow
                };

                db.Journeys.Add(journey);
                await db.SaveChangesAsync();
                inserted++;
                existingByParentAndStatement[key] = journey;
            }

            idMap[sourceId] = journey.Id;
        }

        return new SeedLookup(idMap, inserted, validRows.Count);
    }

    private static async Task<SeedLookup> SeedFlowsAsync(PromiseModelOnlineContext db, IReadOnlyList<Dictionary<string, string>> rows, SeedLookup journeys)
    {
        var seededRows = rows
            .Where(r => !string.IsNullOrWhiteSpace(GetValue(r, "Flow Promise ID"))
                && !string.IsNullOrWhiteSpace(GetValue(r, "Parent Journey ID"))
                && !string.IsNullOrWhiteSpace(GetValue(r, "Flow Promise Statement")))
            .OrderBy(r => GetValue(r, "Flow Promise ID"), StringComparer.Ordinal)
            .ToList();

        var validRows = seededRows
            .Where(r => journeys.IdBySourceId.ContainsKey(GetValue(r, "Parent Journey ID")))
            .ToList();

        var journeyIds = journeys.IdBySourceId.Values.ToHashSet();

        var existing = await db.Flows
            .Where(f => journeyIds.Contains(f.JourneyId))
            .ToListAsync();

        var existingByParentAndStatement = existing
            .GroupBy(f => new ParentStatement(f.JourneyId, f.Statement, f.DisplayOrder))
            .ToDictionary(g => g.Key, g => g.OrderBy(x => x.Id).First());

        var inserted = 0;
        var idMap = new Dictionary<string, int>(StringComparer.Ordinal);

        for (var i = 0; i < validRows.Count; i++)
        {
            var row = validRows[i];
            var sourceId = GetValue(row, "Flow Promise ID");
            var parentSourceId = GetValue(row, "Parent Journey ID");
            var statement = GetValue(row, "Flow Promise Statement");

            var journeyId = journeys.IdBySourceId[parentSourceId];
            var key = new ParentStatement(journeyId, statement, i + 1);

            if (!existingByParentAndStatement.TryGetValue(key, out var flow))
            {
                flow = new Flow
                {
                    JourneyId = journeyId,
                    Statement = statement,
                    DisplayOrder = i + 1,
                    CreatedAt = DateTime.UtcNow
                };

                db.Flows.Add(flow);
                await db.SaveChangesAsync();
                inserted++;
                existingByParentAndStatement[key] = flow;
            }

            idMap[sourceId] = flow.Id;
        }

        return new SeedLookup(idMap, inserted, validRows.Count);
    }

    // ======================== Helpers =============================

    private static async Task<User> EnsureTestUserAsync(PromiseModelOnlineContext db)
    {
        var existing = await db.Users.FirstOrDefaultAsync(u => u.Email == TestUserEmail);
        if (existing != null) return existing;

        var user = new User
        {
            Email = TestUserEmail,
            Name = TestUserName,
            Role = UserRole.Professional,
            CreatedAt = DateTime.UtcNow
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user;
    }

    private static async Task<Project> EnsureProjectAsync(PromiseModelOnlineContext db, int ownerId)
    {
        var existing = await db.Projects.FirstOrDefaultAsync(p => p.Name == "Promise Model Online");
        if (existing != null)
        {
            if (existing.OwnerId != ownerId)
            {
                existing.OwnerId = ownerId;
                await db.SaveChangesAsync();
            }
            return existing;
        }

        var project = new Project
        {
            Name = "Promise Model Online",
            Description = "Seeded from Promise Model tracker CSV sheets.",
            OwnerId = ownerId,
            CreatedAt = DateTime.UtcNow
        };
        db.Projects.Add(project);
        await db.SaveChangesAsync();
        return project;
    }

    private static async Task<Project> EnsureProjectByNameAsync(PromiseModelOnlineContext db, int ownerId, string name, string? description)
    {
        var existing = await db.Projects.FirstOrDefaultAsync(p => p.Name == name);
        if (existing != null)
        {
            if (existing.OwnerId != ownerId || existing.Description != description)
            {
                existing.OwnerId = ownerId;
                existing.Description = description ?? existing.Description;
                await db.SaveChangesAsync();
            }
            return existing;
        }

        var project = new Project
        {
            Name = name,
            Description = description ?? string.Empty,
            OwnerId = ownerId,
            CreatedAt = DateTime.UtcNow
        };
        db.Projects.Add(project);
        await db.SaveChangesAsync();
        return project;
    }

    private static string ResolvePmoPmDirectory(string contentRootPath)
    {
        var direct = Path.Combine(contentRootPath, "pmo_pm");
        if (Directory.Exists(direct)) return direct;

        var sibling = Path.Combine(contentRootPath, "..", "pmo_pm");
        if (Directory.Exists(sibling)) return Path.GetFullPath(sibling);

        var current = new DirectoryInfo(contentRootPath);
        while (current != null)
        {
            var candidate = Path.Combine(current.FullName, "pmo_pm");
            if (Directory.Exists(candidate)) return candidate;
            current = current.Parent;
        }

        throw new DirectoryNotFoundException("Could not locate pmo_pm directory containing Promise CSV files.");
    }

    private static List<Dictionary<string, string>> ReadCsvRows(string path)
    {
        var lines = File.ReadAllLines(path);
        if (lines.Length == 0) return new();

        var headers = ParseCsvLine(lines[0]);
        var rows = new List<Dictionary<string, string>>();

        for (var i = 1; i < lines.Length; i++)
        {
            if (string.IsNullOrWhiteSpace(lines[i])) continue;
            var fields = ParseCsvLine(lines[i]);
            var row = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            for (var c = 0; c < headers.Count; c++)
                row[headers[c]] = c < fields.Count ? fields[c] : string.Empty;
            rows.Add(row);
        }
        return rows;
    }

    private static List<string> ParseCsvLine(string line)
    {
        var values = new List<string>();
        var sb = new StringBuilder();
        var inQuotes = false;

        for (var i = 0; i < line.Length; i++)
        {
            var ch = line[i];
            if (ch == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    sb.Append('"');
                    i++;
                    continue;
                }
                inQuotes = !inQuotes;
                continue;
            }
            if (ch == ',' && !inQuotes)
            {
                values.Add(sb.ToString());
                sb.Clear();
                continue;
            }
            sb.Append(ch);
        }
        values.Add(sb.ToString());
        return values;
    }

    private static string GetValue(IReadOnlyDictionary<string, string> row, string key)
        => row.TryGetValue(key, out var value) ? value : string.Empty;

    private readonly record struct StatementOrder(string Statement, int DisplayOrder);
    private readonly record struct ParentStatement(int ParentId, string Statement, int DisplayOrder);
    private readonly record struct SeedLookup(Dictionary<string, int> IdBySourceId, int Inserted, int Total);
}