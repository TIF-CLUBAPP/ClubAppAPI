namespace ClubApp.Domain.Entities;

/// <summary>
/// Relación muchos-a-muchos entre una <see cref="Activity"/> y los usuarios
/// (profesores y administradores) que están a cargo de dictarla.
/// </summary>
public class ActivityInstructor
{
    public int ActivityId { get; set; }
    public virtual Activity Activity { get; set; } = null!;

    public int UserId { get; set; }
    public virtual User User { get; set; } = null!;
}
