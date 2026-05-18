using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TicketSystem.Api.Models;


namespace TicketSystem.Api.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Cinema> Cinemas => Set<Cinema>();
        public DbSet<Screening> Screenings => Set<Screening>();
        public DbSet<Reservation> Reservations => Set<Reservation>();

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            
            builder.Entity<ApplicationUser>()
                .Property(u => u.RowVersion)
                .IsRowVersion();

           
            builder.Entity<Reservation>()
                .Property(r => r.RowVersion)
                .IsRowVersion();

            // Deleting a Screening deletes all its Reservations
            builder.Entity<Reservation>()
                .HasOne(r => r.Screening)
                .WithMany(s => s.Reservations)
                .HasForeignKey(r => r.ScreeningId)
                .OnDelete(DeleteBehavior.Cascade);

            // No double-booking the same seat (Task 4)
            builder.Entity<Reservation>()
                .HasIndex(r => new { r.ScreeningId, r.RowNumber, r.SeatNumber })
                .IsUnique();

            // Seed the fixed cinemas
            builder.Entity<Cinema>().HasData(
                new Cinema { Id = 1, Name = "Multikino Złote Tarasy", Rows = 10, SeatsPerRow = 15 },
                new Cinema { Id = 2, Name = "Kinoteka", Rows = 8, SeatsPerRow = 12 },
                new Cinema { Id = 3, Name = "Cinema City Arkadia", Rows = 12, SeatsPerRow = 20 }
            );
        }
    }
}