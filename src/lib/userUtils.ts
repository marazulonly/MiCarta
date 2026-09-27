import { User } from '../types';

/**
 * Deduplicates user records by DNI (or fallback to email/id).
 * Preserves exact role hierarchy (ADMIN > OWNER > RESTAURANT_MANAGER > KITCHEN > WAITER > DELIVERY > CUSTOMER).
 * Merges restaurantIds across duplicate records so permissions are preserved.
 * NEVER deletes or alters restaurants, categories, menu items, or orders.
 */
export function deduplicateUsers(users: User[]): User[] {
  if (!Array.isArray(users)) return [];

  const rolePriority: Record<string, number> = {
    ADMIN: 7,
    OWNER: 6,
    RESTAURANT_MANAGER: 5,
    KITCHEN: 4,
    WAITER: 3,
    DELIVERY: 2,
    CUSTOMER: 1,
  };

  const grouped = new Map<string, User[]>();

  users.forEach(u => {
    if (!u) return;
    const rawDni = u.dni ? u.dni.trim() : '';
    const rawEmail = u.email ? u.email.trim().toLowerCase() : '';
    const key = rawDni.length === 8 ? `dni-${rawDni}` : rawEmail ? `email-${rawEmail}` : `id-${u.id}`;

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(u);
  });

  const deduplicatedList: User[] = [];

  grouped.forEach((records) => {
    if (records.length === 1) {
      deduplicatedList.push(records[0]);
      return;
    }

    // Sort duplicate records to pick the primary user record
    records.sort((a, b) => {
      const pA = rolePriority[a.role] || 0;
      const pB = rolePriority[b.role] || 0;
      if (pA !== pB) return pB - pA; // Higher role first

      // Prefer record with valid avatar or custom details
      const hasAvatarA = Boolean(a.avatar && !a.avatar.includes('placeholder'));
      const hasAvatarB = Boolean(b.avatar && !b.avatar.includes('placeholder'));
      if (hasAvatarA !== hasAvatarB) return hasAvatarB ? 1 : -1;

      return 0;
    });

    const winner = { ...records[0] };

    // Merge restaurantIds from all duplicate user entries
    const allRestIds = new Set<string>();
    records.forEach(r => {
      if (Array.isArray(r.restaurantIds)) {
        r.restaurantIds.forEach(id => allRestIds.add(id));
      }
    });

    if (winner.role === 'ADMIN') {
      winner.restaurantIds = allRestIds.has('all') ? ['all'] : Array.from(allRestIds);
    } else {
      winner.restaurantIds = Array.from(allRestIds).filter(id => id !== 'all');
    }

    deduplicatedList.push(winner);
  });

  return deduplicatedList;
}

/**
 * Checks if a DNI is already used by another user in the list.
 */
export function isDniDuplicate(users: User[], dni: string, excludeUserId?: string): boolean {
  const cleanDni = dni.trim();
  if (!cleanDni) return false;
  return users.some(u => u.dni && u.dni.trim() === cleanDni && u.id !== excludeUserId);
}
