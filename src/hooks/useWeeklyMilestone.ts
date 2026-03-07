import { useStore } from '../store/useStore';
import dayjs from 'dayjs'

export const MILESTONES = [
  { id: '20', target: 20, rewardTokens: 1 },
  { id: '40', target: 40, rewardTokens: 1 },
  { id: '60', target: 60, rewardTokens: 1 },
  { id: '80', target: 80, rewardTokens: 2 },
];

export function useWeeklyMilestone() {
  const { logs, user, claimMilestone } = useStore()

  // Calculate the Start of the Week (Monday)
  // get current day (0=Sun, 1=Mon, ..., 6=Sat)
  const today = dayjs();
  const dayOfWeek = today.day() === 0 ? 7 : today.day();
  const startOfWeek = today.subtract(dayOfWeek - 1, 'day').startOf('day');
  const startOfWeekStr = startOfWeek.format('YYYY-MM-DD');

  // Aggregate earned magnets this week
  const weeklyEarned = logs.reduce((total, log) => {
    // Only count positive earn types and happening this week
    if (log.amount > 0 && ['earn', 'bonus', 'magnet-moment', 'mood'].includes(log.type)) {
       if (dayjs(log.timestamp).valueOf() >= startOfWeek.valueOf()) {
         return total + log.amount;
       }
    }
    return total;
  }, 0);

  const milestonesWithStatus = MILESTONES.map(m => {
    const uniqueId = `weekly-${startOfWeekStr}-tier-${m.id}`;
    const isReached = weeklyEarned >= m.target;
    // user.claimedMilestones contains strings
    const isClaimed = user.claimedMilestones?.includes(uniqueId) || false;
    return {
      ...m,
      uniqueId,
      isReached,
      isClaimed
    }
  });

  const allClaimed = milestonesWithStatus.every(m => m.isClaimed);
  const nextMilestone = milestonesWithStatus.find(m => !m.isReached);

  const handleClaim = (uniqueId: string, rewardTokens: number) => {
    claimMilestone(uniqueId, rewardTokens);
  };

  return {
    weeklyEarned,
    maxTarget: MILESTONES[MILESTONES.length - 1].target,
    milestones: milestonesWithStatus,
    allClaimed,
    nextMilestone,
    handleClaim
  }
}
