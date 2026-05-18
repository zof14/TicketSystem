using Microsoft.AspNetCore.Identity;

namespace TicketSystem.Api.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public byte[] RowVersion { get; set; } = Array.Empty<byte>();
    }
}