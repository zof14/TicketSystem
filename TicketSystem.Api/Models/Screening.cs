using TicketSystem.Api.Models;

namespace TicketSystem.Api.Models
{
    public class Screening
    {
        public int Id { get; set; }
        public int CinemaId { get; set; }
        public Cinema Cinema { get; set; } = null!;
        public string FilmTitle { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }

        public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
    }
}