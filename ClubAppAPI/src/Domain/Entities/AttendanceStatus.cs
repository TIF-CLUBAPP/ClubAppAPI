namespace ClubApp.Domain.Entities;

/// <summary>
/// Estado de asistencia de un alumno en una clase.
/// PRESENT = presente, ABSENT = ausente, JUSTIFIED = ausente justificado.
/// </summary>
public enum AttendanceStatus
{
    PRESENT,
    ABSENT,
    JUSTIFIED
}
