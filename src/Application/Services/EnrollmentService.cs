using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;
using ClubApp.Domain.Interfaces;
using ClubApp.Domain.Exceptions; 

namespace ClubApp.Application.Services;

public class EnrollmentService : IEnrollmentService
{
    private readonly IEnrollmentRepository _enrollmentRepository;

    public EnrollmentService(IEnrollmentRepository enrollmentRepository)
    {
        _enrollmentRepository = enrollmentRepository;
    }

    public async Task<IEnumerable<EnrollmentDto>> GetAllEnrollmentsAsync()
    {
        var enrollments = await _enrollmentRepository.GetAllAsync();
        return enrollments.Select(e => new EnrollmentDto
        {
            Id = e.Id,
            UserId = e.UserId,
            ActivityId = e.ActivityId,
            EnrollmentDate = e.EnrollmentDate,
            Status = e.Status.ToString()
        }).ToList();
    }

    public async Task<bool> CreateEnrollmentAsync(EnrollmentDto enrollmentDto)
    {   
        var newEnrollment = new Enrollment
        {
            UserId = enrollmentDto.UserId,
            ActivityId = enrollmentDto.ActivityId,
            EnrollmentDate = enrollmentDto.EnrollmentDate != default ? enrollmentDto.EnrollmentDate : DateTime.Now,
            Status = EnrollmentStatus.Active
        };

        await _enrollmentRepository.AddAsync(newEnrollment);
        return true;
    }

    public async Task<bool> UpdateEnrollmentAsync(int enrollmentId, EnrollmentDto enrollmentDto)
    {
        var existing = await _enrollmentRepository.GetByIdAsync(enrollmentId);
        
        // REGLA: Si no existe la inscripcion, tiramos 404 custom
        if (existing == null)
        {
            throw new NotFoundException("Enrollment", enrollmentId);
        }

        existing.UserId = enrollmentDto.UserId;
        existing.ActivityId = enrollmentDto.ActivityId;
        existing.EnrollmentDate = enrollmentDto.EnrollmentDate;
        
        if (Enum.TryParse<EnrollmentStatus>(enrollmentDto.Status, out var status))
        {
            existing.Status = status;
        }

        await _enrollmentRepository.UpdateAsync(existing);
        return true;
    }

    public async Task<bool> DeleteEnrollmentAsync(int enrollmentId)
    {
        var enrollment = await _enrollmentRepository.GetByIdAsync(enrollmentId);
        
        // REGLA: Si no se encuentra la entidad fisica, excepción directa
        if (enrollment == null)
        {
            throw new NotFoundException("Enrollment", enrollmentId);
        }

        await _enrollmentRepository.DeleteAsync(enrollmentId);
        return true;
    }

    public async Task<bool> CancelEnrollmentAsync(int enrollmentId)
    {
        var enrollment = await _enrollmentRepository.GetByIdAsync(enrollmentId);
        
        // REGLA: Validacion de existencia
        if (enrollment == null)
        {
            throw new NotFoundException("Enrollment", enrollmentId);
        }

        // REGLA DE NEGOCIO: No podes cancelar una inscripcion que ya fue cancelada previamente
        if (enrollment.Status == EnrollmentStatus.Cancelled)
        {
            throw new AppValidationException("Esta inscripción ya se encuentra cancelada.");
        }
 
        enrollment.Status = EnrollmentStatus.Cancelled;
        await _enrollmentRepository.UpdateAsync(enrollment);
        return true;
    }
}