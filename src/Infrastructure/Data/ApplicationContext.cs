using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ClubApp.Domain.Entities;

namespace Infrastructure.Data
{
    public class ApplicationContext : DbContext
    {
        public DbSet<Activity> Activities { get; set; }

        public ApplicationContext(DbContextOptions<ApplicationContext> options) : base(options)
        {
            
        }
    }

}