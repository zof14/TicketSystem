using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TicketSystem.Api.Data;
using TicketSystem.Api.Models;


namespace TicketSystem.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ScreeningsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ScreeningsController(AppDbContext db)
        {
            _db = db;
        }

        public record ScreeningDto(
            int Id,
            int CinemaId,
            string CinemaName,
            int CinemaRows,
            int CinemaSeatsPerRow,
            string FilmTitle,
            DateTime StartTime);

        public record CreateScreeningDto(
            int CinemaId,
            string FilmTitle,
            DateTime StartTime);

        // GET /api/screenings 
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ScreeningDto>>> GetAll()
        {
            var screenings = await _db.Screenings
                .Include(s => s.Cinema)
                .OrderBy(s => s.StartTime)
                .Select(s => new ScreeningDto(
                    s.Id,
                    s.CinemaId,
                    s.Cinema.Name,
                    s.Cinema.Rows,
                    s.Cinema.SeatsPerRow,
                    s.FilmTitle,
                    s.StartTime))
                .ToListAsync();

            return Ok(screenings);
        }

        // GET /api/screenings/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<ScreeningDto>> GetById(int id)
        {
            var s = await _db.Screenings
                .Include(s => s.Cinema)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (s is null) return NotFound();

            return new ScreeningDto(
                s.Id,
                s.CinemaId,
                s.Cinema.Name,
                s.Cinema.Rows,
                s.Cinema.SeatsPerRow,
                s.FilmTitle,
                s.StartTime);
        }

        // GET /api/cinemas 
        [HttpGet("/api/cinemas")]
        public async Task<IActionResult> GetCinemas()
        {
            var cinemas = await _db.Cinemas
                .Select(c => new { c.Id, c.Name, c.Rows, c.SeatsPerRow })
                .ToListAsync();
            return Ok(cinemas);
        }

        // POST /api/screenings 
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ScreeningDto>> Create(CreateScreeningDto dto)
        {
            var cinema = await _db.Cinemas.FindAsync(dto.CinemaId);
            if (cinema is null)
                return BadRequest(new { message = "Cinema not found." });

            var screening = new Screening
            {
                CinemaId = dto.CinemaId,
                FilmTitle = dto.FilmTitle,
                StartTime = dto.StartTime
            };

            _db.Screenings.Add(screening);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = screening.Id },
                new ScreeningDto(
                    screening.Id,
                    cinema.Id,
                    cinema.Name,
                    cinema.Rows,
                    cinema.SeatsPerRow,
                    screening.FilmTitle,
                    screening.StartTime));
        }

        // DELETE /api/screenings/{id} 
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var screening = await _db.Screenings.FindAsync(id);
            if (screening is null) return NotFound();

            _db.Screenings.Remove(screening);
            await _db.SaveChangesAsync();

            return NoContent();
        }
    }
}