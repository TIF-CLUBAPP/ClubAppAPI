namespace ClubApp.Application.DTOs
{
    /// <summary>
    /// Petición para bloquear o desbloquear la cuenta de un usuario.
    /// </summary>
    public class UpdateUserStatusDto
    {
        /// <summary>
        /// true = Activo, false = Bloqueado.
        /// </summary>
        public bool IsActive { get; set; }
    }
}
