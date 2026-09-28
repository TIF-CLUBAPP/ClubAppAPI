using System;

namespace ClubApp.Domain.Entities;

public class ActivitySchedule : BaseEntity
{
    public int ActivityId { get; set; }
    public virtual Activity Activity { get; set; } = null!;

    /// <summary>Día de la semana: 0 = Domingo ... 6 = Sábado.</summary>
    public int DayOfWeek { get; set; }

    /// <summary>Hora de inicio (time of day).</summary>
    public TimeSpan StartTime { get; set; }

    /// <summary>Hora de fin (time of day).</summary>
    public TimeSpan EndTime { get; set; }

    public virtual ICollection<AttendanceRecord> AttendanceRecords { get; set; } = new List<AttendanceRecord>();
}