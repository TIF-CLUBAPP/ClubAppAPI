using System.Threading.Tasks;

namespace ClubApp.Application.Interfaces;

public interface IEmailService
{
    Task SendPasswordResetEmailAsync(string toEmail, string resetLink);
    Task SendEmailAsync(string toEmail, string subject, string body);
}
