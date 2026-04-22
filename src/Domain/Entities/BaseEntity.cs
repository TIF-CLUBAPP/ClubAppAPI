using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ClubApp.Domain.Entities
{
    public abstract class BaseEntity
    {
        public int Id { get; set;}

        public DateTime DateTime{ get; set; } = DateTime.UtcNow;


    }
}