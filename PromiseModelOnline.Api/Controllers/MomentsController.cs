using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    public class MomentsController : GenericController<Moment, MomentDTO>
    {
        private readonly IMomentService _momentService;

        public MomentsController(
            IMomentService service,
            IGenericMapper<Moment, MomentDTO> mapper)
            : base(service, mapper)
        {
            _momentService = service;
        }

        /// <summary>
        /// Returns moments filtered by optional query parameters:
        /// strideId, flowId, iterationId (with unassigned flag)
        /// </summary>
        [HttpGet]
        public override async Task<ActionResult<IEnumerable<MomentDTO>>> GetAll()
        {
            IEnumerable<Moment> moments;

            var strideIdStr = Request.Query["strideId"];
            var flowIdStr = Request.Query["flowId"];
            var iterationIdStr = Request.Query["iterationId"];
            var unassignedStr = Request.Query["unassigned"];

            if (!string.IsNullOrEmpty(strideIdStr) && int.TryParse(strideIdStr, out int strideId))
            {
                moments = await _momentService.GetMomentsByStrideAsync(strideId);
            }
            else if (!string.IsNullOrEmpty(flowIdStr) && int.TryParse(flowIdStr, out int flowId))
            {
                moments = await _momentService.GetMomentsByFlowAsync(flowId);
            }
            else if (!string.IsNullOrEmpty(iterationIdStr) && int.TryParse(iterationIdStr, out int iterationId))
            {
                bool unassignedOnly = unassignedStr == "true";
                moments = await _momentService.GetMomentsByIterationAsync(iterationId, unassignedOnly);
            }
            else
            {
                moments = await _momentService.GetAllAsync();
            }

            var result = new List<MomentDTO>();
            foreach (var m in moments)
                result.Add(_mapper.Map(m, _service));

            return Ok(result);
        }

        /// <summary>
        /// Assign a moment to a stride or move it to the backlog (strideId = null).
        /// </summary>
        [HttpPut("{id}/stride-assignment")]
        public async Task<ActionResult<MomentDTO>> AssignMomentToStride(
            int id,
            [FromBody] UpdateMomentStrideAssignmentRequest request)
        {
            try
            {
                var moment = await _momentService.AssignMomentToStrideAsync(id, request.StrideId);
                return Ok(_mapper.Map(moment, _service));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Update the status of a moment.
        /// </summary>
        [HttpPut("{id}/status")]
        public async Task<ActionResult<MomentDTO>> UpdateMomentStatus(
            int id,
            [FromBody] UpdateMomentStatusRequest request)
        {
            try
            {
                var moment = await _momentService.UpdateMomentStatusAsync(id, request.NewStatus);
                return Ok(_mapper.Map(moment, _service));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        /// <summary>
        /// Returns moments assigned to the current user. (Not yet implemented)
        /// </summary>
        [HttpGet("assigned-to-me")]
        public ActionResult<IEnumerable<MomentDTO>> GetMyAssignedMoments()
        {
            // Requires user ID mapping; return 501 Not Implemented for now.
            return StatusCode(501, "This endpoint is not yet available.");
        }

        /// <summary>
        /// Updates the T‑shirt size estimate for a moment (partial update).
        /// </summary>
        [HttpPatch("{id}/estimate")]
        public async Task<ActionResult<MomentDTO>> UpdateMomentEstimate(
            int id,
            [FromBody] UpdateMomentEstimateRequest request)
        {
            try
            {
                var moment = await _momentService.UpdateMomentEstimateAsync(id, request.Estimate);
                return Ok(_mapper.Map(moment, _service));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }
    }
}