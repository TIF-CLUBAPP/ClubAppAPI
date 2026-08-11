using System;
using System.Collections.Generic;

namespace ClubApp.Domain.Entities;

public enum UserRole
{
    MEMBER,
    TEACHER,   
    ADMIN,
    SUPERADMIN
}

public class User : BaseEntity
{
    public string BadgeNum { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;

    // Datos personales
    public string Dni { get; set; } = string.Empty; // DNI único (7 u 8 dígitos)
    public string Phone { get; set; } = string.Empty;
    public DateTime? BirthDate { get; set; }
    public string? GoogleId { get; set; } = null;

    public string? PasswordResetToken { get; set; } = null;
    public DateTime? PasswordResetTokenExpiration { get; set; } = null;

    public UserRole Role { get; set; } = UserRole.MEMBER; 
    public DateTime? LastPaymentDate { get; set; }

    public virtual ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();

    // Relación con membresías
    public virtual ICollection<Membership> Memberships { get; set; } = new List<Membership>();

    public string FullName => string.IsNullOrWhiteSpace($"{FirstName} {LastName}") 
        ? Email 
        : $"{FirstName} {LastName}".Trim();

    // 🔐 Métodos de verificación de roles
    public bool IsSuperAdmin() => Role == UserRole.SUPERADMIN;
    public bool IsAdmin() => Role == UserRole.ADMIN || Role == UserRole.SUPERADMIN;
    public bool IsTeacher() => Role == UserRole.TEACHER;
    public bool IsStaff() => Role != UserRole.MEMBER;
}