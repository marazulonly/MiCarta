import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { RestaurantBranding } from '../types';

export interface RestaurantCard {
  id: string;
  restaurantId: string;
  restaurantSlug: string;
  branding: RestaurantBranding;
  canvasElements: any[];
  canvasConfig: any;
  logoUrl?: string;
  headerImageUrl?: string;
  backgroundImageUrl?: string;
  version: number;
  lastModified: string;
  publishedAt?: string;
  isPublished: boolean;
}

/**
 * Saves or updates an individual restaurant card in Firestore collection 'restaurant_cards'
 */
export const saveRestaurantCard = async (
  restaurantId: string,
  cardData: Partial<RestaurantCard>
): Promise<boolean> => {
  if (!db) {
    console.warn('[CardService] Firestore db not initialized, saving to localStorage');
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(`restaurant_card_${restaurantId}`, JSON.stringify(cardData));
    }
    return true;
  }

  try {
    const docRef = doc(db, 'restaurant_cards', restaurantId);
    await setDoc(docRef, {
      ...cardData,
      restaurantId,
      lastModified: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (e) {
    console.error('[CardService] Error saving restaurant card to Firestore:', e);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(`restaurant_card_${restaurantId}`, JSON.stringify(cardData));
    }
    return false;
  }
};

/**
 * Loads a restaurant card by its ID
 */
export const loadRestaurantCard = async (
  restaurantId: string
): Promise<RestaurantCard | null> => {
  if (!db) {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(`restaurant_card_${restaurantId}`);
      if (raw) return JSON.parse(raw);
    }
    return null;
  }

  try {
    const docRef = doc(db, 'restaurant_cards', restaurantId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as RestaurantCard;
    }
  } catch (e) {
    console.warn('[CardService] Error loading restaurant card from Firestore:', e);
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    const raw = localStorage.getItem(`restaurant_card_${restaurantId}`);
    if (raw) return JSON.parse(raw);
  }

  return null;
};

/**
 * Loads a restaurant card by its slug for public view
 */
export const loadRestaurantCardBySlug = async (
  slug: string
): Promise<RestaurantCard | null> => {
  if (!slug) return null;

  if (db) {
    try {
      const q = query(
        collection(db, 'restaurant_cards'),
        where('restaurantSlug', '==', slug)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data() as RestaurantCard;
      }
    } catch (e) {
      console.warn('[CardService] Error querying restaurant card by slug:', e);
    }
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('restaurant_card_')) {
        try {
          const card = JSON.parse(localStorage.getItem(key) || '');
          if (card && (card.restaurantSlug === slug || card.slug === slug)) {
            return card;
          }
        } catch {}
      }
    }
  }

  return null;
};
