using System;
using Microsoft.Data.Sqlite;
using System.Linq;

if (args.Length == 0)
{
    Console.WriteLine("Usage: dotnet run -- <path-to-db> [createIndex]");
    return;
}

var dbPath = args[0];
var createIndex = args.Length > 1 && args[1].Equals("createIndex", StringComparison.OrdinalIgnoreCase);
var addColumns = args.Length > 1 && args[1].Equals("addColumns", StringComparison.OrdinalIgnoreCase);
var addColumnsAndCreate = args.Length > 1 && args[1].Equals("addColumnsAndCreate", StringComparison.OrdinalIgnoreCase);
var purgeDeleted = args.Length > 1 && args[1].Equals("purgeDeleted", StringComparison.OrdinalIgnoreCase);

var connString = $"Data Source={dbPath}";

using var conn = new SqliteConnection(connString);
conn.Open();

Console.WriteLine($"Connected to DB: {dbPath}");

// Purge fisico de filas con soft delete (IsDeleted = 1)
if (purgeDeleted)
{
    using (var cmd = conn.CreateCommand())
    {
        cmd.CommandText = "DELETE FROM Users WHERE IsDeleted = 1;";
        var affected = cmd.ExecuteNonQuery();
        Console.WriteLine($"Purgadas {affected} fila(s) con soft delete en Users.");
    }
    return;
}

// Print existing tables/indexes
using (var tcmd = conn.CreateCommand())
{
    tcmd.CommandText = "SELECT name, type FROM sqlite_master WHERE type IN ('table','index') ORDER BY name;";
    using var tr = tcmd.ExecuteReader();
    Console.WriteLine("Existing sqlite_master entries:");
    while (tr.Read())
    {
        Console.WriteLine($" - {tr.GetString(0)} ({tr.GetString(1)})");
    }
}


// List columns of Users
using (var cmd = conn.CreateCommand())
{
    cmd.CommandText = "PRAGMA table_info('Users');";
    using var reader = cmd.ExecuteReader();
    Console.WriteLine("Users table columns:");
    var hasDni = false;
    while (reader.Read())
    {
        var cid = reader.GetInt32(0);
        var name = reader.GetString(1);
        var type = reader.GetString(2);
        var notnull = reader.GetInt32(3) == 1;
        Console.WriteLine($" - {name} ({type}) notnull:{notnull}");
        if (name.Equals("Dni", StringComparison.OrdinalIgnoreCase)) hasDni = true;
    }

    if (!hasDni && !(addColumns || addColumnsAndCreate))
    {
        Console.WriteLine("Column Dni does not exist on Users. Use 'addColumns' or 'addColumnsAndCreate' to add missing columns.");
        return;
    }
}

// Check duplicates in Dni
using (var cmd = conn.CreateCommand())
{
    cmd.CommandText = "SELECT Dni, COUNT(*) as Cnt FROM Users GROUP BY Dni HAVING COUNT(*) > 1;";
    using var reader = cmd.ExecuteReader();
    var duplicates = 0;
    while (reader.Read())
    {
        duplicates++;
        var dni = reader.IsDBNull(0) ? "(NULL)" : reader.GetString(0);
        var cnt = reader.GetInt64(1);
        Console.WriteLine($"Duplicate DNI: {dni} -> {cnt} records");
    }

    if (duplicates > 0)
    {
        Console.WriteLine($"Found {duplicates} duplicate DNI values. Please clean duplicates before creating a unique index.");
        return;
    }
}

// Optionally add missing columns
if (addColumns || addColumnsAndCreate)
{
    // Add Dni if missing
    using (var cmd = conn.CreateCommand())
    {
        cmd.CommandText = "PRAGMA table_info('Users');";
        using var r = cmd.ExecuteReader();
        var cols = new System.Collections.Generic.HashSet<string>(StringComparer.OrdinalIgnoreCase);
        while (r.Read()) cols.Add(r.GetString(1));

        if (!cols.Contains("Dni"))
        {
            Console.WriteLine("Adding column Dni TEXT NOT NULL DEFAULT ''");
            using var add = conn.CreateCommand();
            add.CommandText = "ALTER TABLE Users ADD COLUMN Dni TEXT NOT NULL DEFAULT '';";
            add.ExecuteNonQuery();
        }
        else Console.WriteLine("Column Dni already exists.");

        if (!cols.Contains("Phone"))
        {
            Console.WriteLine("Adding column Phone TEXT NOT NULL DEFAULT ''");
            using var add = conn.CreateCommand();
            add.CommandText = "ALTER TABLE Users ADD COLUMN Phone TEXT NOT NULL DEFAULT '';";
            add.ExecuteNonQuery();
        }
        else Console.WriteLine("Column Phone already exists.");

        if (!cols.Contains("GoogleId"))
        {
            Console.WriteLine("Adding column GoogleId TEXT NULL");
            using var add = conn.CreateCommand();
            add.CommandText = "ALTER TABLE Users ADD COLUMN GoogleId TEXT;";
            add.ExecuteNonQuery();
        }
        else Console.WriteLine("Column GoogleId already exists.");

        if (!cols.Contains("BirthDate"))
        {
            Console.WriteLine("Adding column BirthDate TEXT NULL");
            using var add = conn.CreateCommand();
            add.CommandText = "ALTER TABLE Users ADD COLUMN BirthDate TEXT;";
            add.ExecuteNonQuery();
        }
        else Console.WriteLine("Column BirthDate already exists.");
    }
}

// Check duplicates again
using (var cmd = conn.CreateCommand())
{
    cmd.CommandText = "SELECT Dni, COUNT(*) as Cnt FROM Users GROUP BY Dni HAVING COUNT(*) > 1;";
    using var reader = cmd.ExecuteReader();
    var duplicates = 0;
    while (reader.Read())
    {
        duplicates++;
        var dni = reader.IsDBNull(0) ? "(NULL)" : reader.GetString(0);
        var cnt = reader.GetInt64(1);
        Console.WriteLine($"Duplicate DNI: {dni} -> {cnt} records");
    }

    if (duplicates > 0)
    {
        Console.WriteLine($"Found {duplicates} duplicate DNI values. Please clean duplicates before creating a unique index.");
        return;
    }
}

if (createIndex || addColumnsAndCreate)
{
    using var cmd = conn.CreateCommand();
    cmd.CommandText = "CREATE UNIQUE INDEX IF NOT EXISTS IX_Users_Dni ON Users (Dni);";
    cmd.ExecuteNonQuery();
    Console.WriteLine("CREATE UNIQUE INDEX IF NOT EXISTS IX_Users_Dni ON Users (Dni); executed.");
}
else
{
    Console.WriteLine("No index creation requested. Re-run with 'createIndex' or 'addColumnsAndCreate' to create the index if safe.");
}

