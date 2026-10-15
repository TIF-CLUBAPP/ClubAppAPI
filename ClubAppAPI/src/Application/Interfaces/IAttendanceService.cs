using ClubApp.Application.Dtos;

namespace ClubApp.Application.Interfaces;

public interface IAttendanceService
{
    /// <summary>Clases del día de un profesor con sus alumnos inscriptos.</summary>
    Task<List<TeacherClassDto>> GetTeacherClassesAsync(int teacherId, DateTime date);

    /// <summary>Registra/actualiza la asistencia de una clase.</summary>
    Task<bool> MarkAttendanceAsync(int teacherId, MarkAttendanceRequest request);
}