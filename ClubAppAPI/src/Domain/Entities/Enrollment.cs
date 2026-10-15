using System;

namespace ClubApp.Domain.Entities;

public class Enrollment
{
    public int Id { get; set; }
    
    // Relación con Usuario
    public int UserId { get; set; }
    public User User { get; set; } = null!; 

    // Relacion con Actividad
    public int ActivityId { get; set; }
    public Activity Activity { get; set; } = null!;

    public DateTime EnrollmentDate { get; set; }
    public EnrollmentStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
}