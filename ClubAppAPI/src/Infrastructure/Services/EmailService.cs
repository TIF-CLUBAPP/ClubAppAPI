using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using ClubApp.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ClubApp.Infrastructure.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendPasswordResetEmailAsync(string toEmail, string resetLink)
        {
            string subject = "Restablecer contraseña - ClubApp";
            string body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #f8fafc; border-radius: 12px;'>
                    <h2 style='color: #10b981; margin-bottom: 16px;'>Recuperación de Contraseña</h2>
                    <p>Hola,</p>
                    <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>ClubApp</strong>.</p>
                    <p>Hacé clic en el siguiente botón para continuar:</p>
                    <div style='margin: 24px 0;'>
                        <a href='{resetLink}' style='background-color: #10b981; color: #090d16; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;'>Restablecer Contraseña</a>
                    </div>
                    <p style='font-size: 12px; color: #94a3b8;'>Si no solicitaste este cambio, podés ignorar este correo de forma segura.</p>
                    <p style='font-size: 12px; color: #94a3b8;'>O copiá este enlace en tu navegador: <br/><a href='{resetLink}' style='color: #34d399;'>{resetLink}</a></p>
                </div>";

            await SendEmailAsync(toEmail, subject, body);
        }

        public async Task SendPasswordResetCodeAsync(string toEmail, string code)
        {
            string subject = "Código de verificación - ClubApp";
            
            // Log code clearly for developers in case SMTP is not configured or fails
            _logger.LogInformation("================================================");
            _logger.LogInformation("CODIGO DE VERIFICACION PARA {ToEmail}: {Code}", toEmail, code);
            _logger.LogInformation("================================================");

            string body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #f8fafc; border-radius: 12px;'>
                    <h2 style='color: #10b981; margin-bottom: 16px;'>Verificación de contraseña</h2>
                    <p>Hola,</p>
                    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>ClubApp</strong>.</p>
                    <p>Usá el siguiente código de verificación para continuar:</p>
                    <div style='margin: 24px 0;'>
                        <span style='font-size: 32px; font-weight: bold; letter-spacing: 12px; color: #090d16; background-color: #10b981; padding: 12px 24px; border-radius: 8px; display: inline-block;'>{code}</span>
                    </div>
                    <p style='font-size: 12px; color: #94a3b8;'>El código vence en 10 minutos. Si no solicitaste este cambio, podés ignorar este correo de forma segura.</p>
                </div>";

            await SendEmailAsync(toEmail, subject, body);
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            var smtpServer = _configuration["Smtp:Server"];
            var portStr = _configuration["Smtp:Port"];
            var username = _configuration["Smtp:Username"];
            var password = _configuration["Smtp:Password"];
            var senderEmail = _configuration["Smtp:SenderEmail"] ?? "no-reply@clubapp.com";
            var senderName = _configuration["Smtp:SenderName"] ?? "ClubApp";

            // If SMTP is not configured, fall back to logger
            if (string.IsNullOrWhiteSpace(smtpServer) || string.IsNullOrWhiteSpace(username))
            {
                _logger.LogInformation("================================================");
                _logger.LogInformation("[DEV EMAIL SERVICE] Envio de email a {ToEmail}", toEmail);
                _logger.LogInformation("Asunto: {Subject}", subject);
                _logger.LogInformation("Cuerpo:\n{Body}", body);
                _logger.LogInformation("================================================");
                return;
            }

            try
            {
                int port = int.TryParse(portStr, out var p) ? p : 587;
                bool enableSsl = bool.TryParse(_configuration["Smtp:EnableSsl"], out var ssl) ? ssl : true;

                using var client = new SmtpClient(smtpServer, port)
                {
                    Credentials = new NetworkCredential(username, password),
                    EnableSsl = enableSsl
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(senderEmail, senderName),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                };
                mailMessage.To.Add(toEmail);

                await client.SendMailAsync(mailMessage);
                _logger.LogInformation("================================================");
                _logger.LogInformation("[SMTP SUCCESS] Correo enviado con éxito a {ToEmail} mediante Brevo (250 OK)", toEmail);
                _logger.LogInformation("================================================");
            }
            catch (SmtpException smtpEx)
            {
                _logger.LogError(smtpEx, "================================================");
                _logger.LogError("[SMTP ERROR] Error SMTP al enviar a {ToEmail}. StatusCode: {StatusCode}, Mensaje: {Message}", toEmail, smtpEx.StatusCode, smtpEx.Message);
                _logger.LogError("================================================");
                _logger.LogInformation("[FALLBACK EMAIL LOG] Destinatario: {ToEmail} | Asunto: {Subject} | Contenido: {Body}", toEmail, subject, body);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "================================================");
                _logger.LogError("[GENERAL SMTP ERROR] Error inesperado al enviar correo a {ToEmail}. Mensaje: {Message}", toEmail, ex.Message);
                _logger.LogError("================================================");
                _logger.LogInformation("[FALLBACK EMAIL LOG] Destinatario: {ToEmail} | Asunto: {Subject} | Contenido: {Body}", toEmail, subject, body);
            }
        }
    }
}
