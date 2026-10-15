namespace ClubApp.Application.Dtos;

/// <summary>
/// Filtros para listar pagos (GET /api/payments)
/// </summary>
public class PaymentFilterDto
{
    public string? Status { get; set; } // Pending, Paid, Overdue, Exempt
    public string? Search { get; set; } // Búsqueda por nombre, email, DNI
    public string? Period { get; set; } // MM/yyyy
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

/// <summary>
/// Respuesta paginada de pagos
/// </summary>
public class PagedPaymentsResponseDto
{
    public List<PaymentDto> Payments { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}

/// <summary>
/// DTO para registrar pago manual (POST /api/payments/register)
/// </summary>
public class RegisterPaymentDto
{
    public int UserId { get; set; }
    public string Period { get; set; } = string.Empty; // MM/yyyy
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty; // Efectivo, Transferencia, MercadoPago, etc.
    public string? Notes { get; set; }
}