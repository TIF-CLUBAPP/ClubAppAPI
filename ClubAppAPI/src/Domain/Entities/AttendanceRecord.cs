using System;

namespace ClubApp.Domain.Entities;

public class AttendanceRecord : BaseEntity
{
    public int ActivityScheduleId { get; set; }
    public virtual ActivitySchedule ActivitySchedule { get; set; } = null!;

    public int UserId { get; set; }
    public virtual User User { get; set; } = null!;

    /// <summary>Fecha de la clase (solo fecha, sin hora).</summary>
    public DateTime Date { get; set; }

    /// <summary>true = Presente, false = Ausente.</summary>
    public bool Present { get; set; }
}