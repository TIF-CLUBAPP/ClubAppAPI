using System.Collections.Generic;

namespace ClubApp.Domain.Entities;

// Definimos el Enum aquí arriba para que esté disponible en todo el namespace
public enum UserRole
{
    MEMBER,
    ADMIN,
    SUPERADMIN
}

public class User : BaseEntity
{
    // Campos extraídos exactamente de la "Base Class" de tu imagen
    public string BadgeNum { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;

    // El Rol que define qué puede hacer este usuario
    public UserRole Role { get; set; } = UserRole.MEMBER;

    // Campo de la clase MemberUser (ahora integrado aquí)
    public DateTime? LastPaymentDate { get; set; }

    // Relación con Enrollment (Un usuario tiene muchas inscripciones)
    public virtual ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();

    // Métodos lógicos que aparecían en tu diagrama (opcionales para el Entity)
    public bool IsAdmin() => Role == UserRole.ADMIN || Role == UserRole.SUPERADMIN;
}