using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TicketSystem.Api.Data;

using TicketSystem.Api.Models;

namespace TicketSystem.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly AppDbContext _db;

        public UsersController(UserManager<ApplicationUser> userManager, AppDbContext db)
        {
            _userManager = userManager;
            _db = db;
        }

       
        public record UserDto(
            string Id,
            string? Email,
            string? FirstName,
            string? LastName,
            string? PhoneNumber,
            string RowVersion);

        
        public record UpdateUserDto(
            string? FirstName,
            string? LastName,
            string? PhoneNumber,
            string RowVersion);

        private static UserDto ToDto(ApplicationUser u) => new(
            u.Id,
            u.Email,
            u.FirstName,
            u.LastName,
            u.PhoneNumber,
            Convert.ToBase64String(u.RowVersion));

        // GET /api/users/me - get own profile
        [HttpGet("me")]
        public async Task<ActionResult<UserDto>> GetMe()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user is null) return NotFound();
            return ToDto(user);
        }

        // PUT /api/users/me - edit own profile
        [HttpPut("me")]
        public async Task<IActionResult> UpdateMe(UpdateUserDto dto)
        {
            var userId = _userManager.GetUserId(User)!;
            return await UpdateUserCore(userId, dto);
        }

        // GET /api/users - admin gets list of all users
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetAll()
        {
            var users = await _userManager.Users.ToListAsync();
            return Ok(users.Select(ToDto));
        }

        // PUT /api/users/{id} - admin edits any user
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateUser(string id, UpdateUserDto dto)
        {
            return await UpdateUserCore(id, dto);
        }

        // DELETE /api/users/{id} - admin deletes a user
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUser(string id, [FromQuery] string rowVersion)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user is null) return NotFound();

            // Concurrency check on delete
            var currentVersion = Convert.ToBase64String(user.RowVersion);
            if (currentVersion != rowVersion)
            {
                return Conflict(new
                {
                    message = "This user was modified by someone else.",
                    current = ToDto(user)
                });
            }

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded) return BadRequest(result.Errors);

            return NoContent();
        }

        // Shared logic for updating a user with concurrency check
        private async Task<IActionResult> UpdateUserCore(string userId, UpdateUserDto dto)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user is null) return NotFound();


            var clientVersion = Convert.FromBase64String(dto.RowVersion);
            _db.Entry(user).Property(u => u.RowVersion).OriginalValue = clientVersion;

            user.FirstName = dto.FirstName;
            user.LastName = dto.LastName;
            user.PhoneNumber = dto.PhoneNumber;

            try
            {
                var result = await _userManager.UpdateAsync(user);
                if (!result.Succeeded) return BadRequest(result.Errors);
                return Ok(ToDto(user));
            }
            catch (DbUpdateConcurrencyException)
            {
                // Someone else saved while this user was editing
                // Reload from DB and tell the client what the current values are
                var fresh = await _userManager.FindByIdAsync(userId);
                return Conflict(new
                {
                    message = "This user was modified by someone else while you were editing.",
                    current = fresh is null ? null : ToDto(fresh)
                });
            }
        }
    }
}