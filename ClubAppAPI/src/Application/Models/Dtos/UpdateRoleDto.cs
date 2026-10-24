namespace ClubApp.Application.DTOs
{
    public class UpdateRoleDto
    {
        public int NewRole { get; set; }
    }

    public class UpdateTeacherTypeDto
    {
        public string TipoProfesor { get; set; } = "CLUB";
    }
}