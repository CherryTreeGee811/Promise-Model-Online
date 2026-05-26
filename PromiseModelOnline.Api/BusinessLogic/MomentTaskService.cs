using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PMO.Core.Models;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic
{
    public class MomentTaskService : IMomentTaskService
    {
        private readonly IMomentTaskRepository _taskRepository;

        public MomentTaskService(IMomentTaskRepository taskRepository)
        {
            _taskRepository = taskRepository;
        }

        public async Task<IEnumerable<MomentTask>> GetTasksByMomentAsync(int momentId)
            => await _taskRepository.GetTasksByMomentAsync(momentId);

        public async Task<MomentTask?> GetByIdAsync(int taskId)
            => await _taskRepository.GetByIdAsync(taskId);

        public async Task<MomentTask> CreateAsync(MomentTask task)
        {
            await _taskRepository.AddAsync(task);
            await _taskRepository.SaveChangesAsync();
            return task;
        }

        public async Task<MomentTask> UpdateAsync(MomentTask task)
        {
            _taskRepository.Update(task);
            await _taskRepository.SaveChangesAsync();
            return task;
        }
    }
}