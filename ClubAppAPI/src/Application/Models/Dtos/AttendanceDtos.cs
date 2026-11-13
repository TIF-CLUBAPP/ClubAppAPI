using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
using ClubApp.Domain.Entities;

namespace ClubApp.Application.Dtos;

/// <summary>Asistencia de un único alumno dentro de la planilla.</summary>
public class AttendanceItemDto
{
    public int UserId { get; set; }

    /// <summary>PRESENT / ABSENT / JUSTIFIED.</summary>
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public AttendanceStatus Status { get; set; }
}

/// <summary>Entrada para registrar asistencia (POST /api/attendance/mark).</summary>
public class MarkAttendanceRequest
{
    public int ActivityScheduleId { get; set; }
    public DateTime Date { get; set; }
    public List<AttendanceItemDto> Attendances { get; set; } = new();
}

/// <summary>Alumno inscripto en la clase del profesor.</summary>
public class ClassStudentDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    /// <summary>PRESENT / ABSENT / JUSTIFIED (asistencia del día seleccionado).</summary>
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public AttendanceStatus Status { get; set; }

    /// <summary>Fecha en la que el alumno se inscribió a la actividad (UTC).</summary>
    public DateTime? EnrollmentDate { get; set; }

    /// <summary>Estado actual de la inscripción: "ACTIVE" / "CANCELED".</summary>
    public string EnrollmentStatus { get; set; } = string.Empty;

    /// <summary>Resumen histórico de asistencia del alumno en esta clase/schedule.</summary>
    public int TotalClasses { get; set; }
    public int Presents { get; set; }
    public int Absents { get; set; }
    public int Justified { get; set; }
}

/// <summary>Clase del día de un profesor con sus alumnos (GET /api/attendance/classes).</summary>
public class TeacherClassDto
{
    public int ActivityId { get; set; }
    public string ActivityName { get; set; } = string.Empty;
    public int ActivityScheduleId { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public List<ClassStudentDto> Students { get; set; } = new();
}