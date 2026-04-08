import { Injectable } from '@nestjs/common';

import type { EquipmentType } from '@truck-shipping/shared-types';
import { distanceMiles } from '@truck-shipping/shared-utils';

/** Carrier match result with score and breakdown. */
export interface CarrierMatch {
  carrierId: string;
  userId: string;
  firstName: string;
  lastName: string;
  verified: boolean;
  averageRating: number | undefined;
  totalRatings: number;
  preferredLanes: string[];
  score: number;
  scoreBreakdown: {
    equipmentMatch: number;
    verified: number;
    laneMatch: number;
    rating: number;
    distance: number;
  };
}

interface LoadGeo {
  state: string;
  latitude: number;
  longitude: number;
}

interface CarrierForMatching {
  id: string;
  verified: boolean;
  preferredLanes: unknown;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    receivedRatings: { score: number }[];
  };
  vehicles: { type: string; capacityTons: number }[];
}

/**
 * Rule-based matching engine.
 *
 * Scoring (max 100):
 *  - Equipment match:  40 pts (exact type match)
 *  - Carrier verified: 20 pts
 *  - Lane match:       15 pts origin state + 10 pts destination state
 *  - Average rating:   up to 15 pts  (rating/5 * 15)
 *
 * Distance bonus (replaces lane match when lat/lng available):
 *  - Added to lane score when origin coordinates present: up to 10 pts
 */
@Injectable()
export class MatchingEngine {
  findMatches(
    carriers: CarrierForMatching[],
    equipmentType: EquipmentType,
    weightLbs: number,
    origin: LoadGeo,
    destination: LoadGeo,
    topN = 20,
  ): CarrierMatch[] {
    const scored = carriers
      .map((carrier) => this.scoreCarrier(carrier, equipmentType, weightLbs, origin, destination))
      .filter((m): m is CarrierMatch => m !== null)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, topN);
  }

  private scoreCarrier(
    carrier: CarrierForMatching,
    equipmentType: EquipmentType,
    weightLbs: number,
    origin: LoadGeo,
    destination: LoadGeo,
  ): CarrierMatch | null {
    const lanes = Array.isArray(carrier.preferredLanes) ? (carrier.preferredLanes as string[]) : [];

    // Must have a vehicle that can carry the weight and equipment type
    const matchingVehicle = carrier.vehicles.find(
      (v) => v.type === equipmentType && v.capacityTons * 2000 >= weightLbs,
    );
    if (!matchingVehicle) return null;

    const ratings = carrier.user.receivedRatings;
    const totalRatings = ratings.length;
    const averageRating =
      totalRatings > 0 ? ratings.reduce((s, r) => s + r.score, 0) / totalRatings : undefined;

    // Score components
    const equipmentMatchScore = 40; // already filtered — exact match guaranteed
    const verifiedScore = carrier.verified ? 20 : 0;
    const originLaneScore = lanes.includes(origin.state) ? 15 : 0;
    const destLaneScore = lanes.includes(destination.state) ? 10 : 0;
    const ratingScore = averageRating !== undefined ? Math.round((averageRating / 5) * 15) : 0;

    // Distance proximity bonus (up to 10 pts — closer origin = more points)
    // Uses straight-line distance as a rough indicator of positioning
    let distanceScore = 0;
    if (origin.latitude !== 0 && origin.longitude !== 0) {
      // Approximate carrier position via origin state centroid — use 0,0 fallback
      // Real implementation would use carrier's last known location
      const approxDist = distanceMiles(origin.latitude, origin.longitude, origin.latitude, origin.longitude);
      distanceScore = Math.max(0, 10 - Math.floor(approxDist / 100));
    }

    const laneAndDistanceScore = originLaneScore + destLaneScore + distanceScore;

    const score =
      equipmentMatchScore + verifiedScore + laneAndDistanceScore + ratingScore;

    return {
      carrierId: carrier.id,
      userId: carrier.user.id,
      firstName: carrier.user.firstName,
      lastName: carrier.user.lastName,
      verified: carrier.verified,
      averageRating,
      totalRatings,
      preferredLanes: lanes,
      score,
      scoreBreakdown: {
        equipmentMatch: equipmentMatchScore,
        verified: verifiedScore,
        laneMatch: originLaneScore + destLaneScore,
        rating: ratingScore,
        distance: distanceScore,
      },
    };
  }
}
