namespace TicketSystem.Api.Models
{
    public class Cinema
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Rows { get; set; }
        public int SeatsPerRow { get; set; }

        public ICollection<Screening> Screenings { get; set; } = new List<Screening>();
    }
}
