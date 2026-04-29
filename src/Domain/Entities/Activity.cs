namespace ClubApp.Domain.Entities;

public class Activity : BaseEntity
{

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public int MaxCapacity { get; set; }

    public string Schedule { get; set; } = string.Empty; //Horario

    public bool IsActive { get; set; } = true;


    public virtual ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();

}

