import { getIterationsByProject } from '../iterations/api.mjs';
import { getStridesByIteration } from './api.mjs';

export function getStrideOptions(strides = []) {
    return [
        { value: '', label: 'Backlog' },
        ...strides.map(stride => ({
            value: String(stride.id),
            label: stride.name ? `${stride.name}` : `Stride #${stride.id}`,
        })),
    ];
}

export async function loadAvailableStridesForProject(projectId) {
    const iterations = await getIterationsByProject(projectId);
    const strideGroups = await Promise.all(
        (Array.isArray(iterations) ? iterations : []).map(async iteration => ({
            iteration,
            strides: await getStridesByIteration(iteration.id),
        }))
    );

    return strideGroups
        .flatMap(group => (Array.isArray(group.strides) ? group.strides : []))
        .sort((left, right) => {
            const leftStart = new Date(left.startDate ?? 0).getTime();
            const rightStart = new Date(right.startDate ?? 0).getTime();
            if (leftStart !== rightStart) return leftStart - rightStart;
            return Number(left.id) - Number(right.id);
        });
}