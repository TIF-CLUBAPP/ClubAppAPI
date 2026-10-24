using System.Threading.Tasks;

namespace ClubApp.Application.Interfaces;

public interface IEmailService
{
    Task SendPasswordResetEmailAsync(string toEmail, string resetLink);
    Task SendPasswordResetCodeAsync(string toEmail, string code);
    Task SendEmailAsync(string toEmail, string subject, string body);
}
