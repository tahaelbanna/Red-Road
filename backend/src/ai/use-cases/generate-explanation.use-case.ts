import { Injectable } from '@nestjs/common';
import { Priorities, RouteMetrics } from '../../route/interfaces/index.js';
import { RouteExplanation } from '../interfaces/index.js';
import { MissionType } from '../../route/enums/index.js';

interface PriorityDescriptor {
    key: keyof Priorities;
    label: string;
    effect: string;
}

const PRIORITY_DESCRIPTORS: PriorityDescriptor[] = [
    {
        key: 'safety',
        label: 'Safety',
        effect: 'route through cells with lower hazard values',
    },
    {
        key: 'science',
        label: 'Science',
        effect: 'route closer to scientific targets',
    },
    {
        key: 'slope',
        label: 'Slope',
        effect: 'route through gentler inclines',
    },
    {
        key: 'distance',
        label: 'Distance',
        effect: 'find a shorter path',
    },
];

@Injectable()
export class GenerateExplanationUseCase {
    execute(
        mission: MissionType,
        priorities: Priorities,
        metrics: RouteMetrics,
    ): RouteExplanation {
        const pct = {
            safety: Math.round(priorities.safety * 100),
            science: Math.round(priorities.science * 100),
            slope: Math.round(priorities.slope * 100),
            distance: Math.round(priorities.distance * 100),
        };

        const maxWeight = Math.max(
            priorities.safety,
            priorities.slope,
            priorities.distance,
            priorities.science,
        );

        const dominant =
            PRIORITY_DESCRIPTORS.find((d) => priorities[d.key] === maxWeight) ??
            PRIORITY_DESCRIPTORS[3];

        const summary = `${dominant.label} has the highest weighting in this route plan.`;
        const priorityExplanation = `${dominant.label} is weighted at ${pct[dominant.key]}%, which influences the algorithm to ${dominant.effect}.`;

        const distKm = (metrics.distanceMeters / 1000).toFixed(2);
        const keyFactors: string[] = [
            `Route Distance: ${distKm} km`,
            `Elevation Change: ${metrics.elevationChangeMeters.toFixed(0)} m`,
            `Maximum Slope: ${metrics.maxSlopeDeg.toFixed(1)}°`,
            `Hazard Segments: ${metrics.hazardSegments}`,
            `Scientific Targets: ${metrics.scientificTargetsNearRoute.length}`,
        ];

        const tradeoffs: string[] = [];
        if (priorities.safety >= 0.5) {
            tradeoffs.push(
                `With a safety weighting of ${pct.safety}%, the route encompasses a distance of ${distKm} km and passes through ${metrics.hazardSegments} hazard segment(s).`,
            );
        }
        if (priorities.science >= 0.5) {
            tradeoffs.push(
                `With a science weighting of ${pct.science}%, the route encompasses a distance of ${distKm} km and passes near ${metrics.scientificTargetsNearRoute.length} scientific target(s).`,
            );
        }
        if (tradeoffs.length === 0) {
            tradeoffs.push(
                `The route balances the current priorities (Safety: ${pct.safety}%, Science: ${pct.science}%, Slope: ${pct.slope}%, Distance: ${pct.distance}%).`,
            );
        }

        tradeoffs.push(
            `Note: The actual route distance is ${distKm} km. Changes in priorities will cause the distance, elevation profile, and hazard encounters to vary.`,
        );

        const safetyNote = `The route passes through ${metrics.hazardSegments} hazard segment(s).`;
        const scienceNote = `The route passes near ${metrics.scientificTargetsNearRoute.length} scientific target(s) while the current safety weighting is ${pct.safety}%.`;

        return {
            summary,
            keyFactors,
            tradeoffs,
            safetyNote,
            scienceNote,
            priorityExplanation,
        };
    }
}
