using System.Text.Json.Serialization;
using ClubApp.Domain.Entities;

namespace ClubApp.Application.Dtos;

public class CreateNotificationDto
{
    public int? UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public NotificationCategory Category { get; set; } = NotificationCategory.System;

    public string? ReferenceId { get; set; }
}

public class UpdateNotificationDto
{
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}