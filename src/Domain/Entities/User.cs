using System.Collections.Generic;

namespace ClubApp.Domain.Entities;

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

    public UserRole Role { get; set; } = UserRole.MEMBER; 
    public DateTime? LastPaymentDate { get; set; }

    public virtual ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();

    public bool IsAdmin() => Role == UserRole.ADMIN || Role == UserRole.SUPERADMIN; //OJO MIRA ESTO EN EL FUTURO
}