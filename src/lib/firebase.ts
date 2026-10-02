import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  writeBatch, 
  onSnapshot, 
  setDoc,
  deleteDoc,
  Firestore
} from 'firebase/firestore';
import config from '../../firebase-applet-config.json';
import { MeasurementPoint, MaterialItem, CostCategory, JunctionBox } from '../types';

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(config) : getApp();

// Initialize Firestore with specific database ID if provided in config
export const db: Firestore = config.firestoreDatabaseId 
  ? getFirestore(app, config.firestoreDatabaseId) 
  : getFirestore(app);

// Helper to remove undefined fields which Firestore rejects
export function cleanForFirestore<T extends Record<string, any>>(obj: T): T {
  const cleaned: any = Array.isArray(obj) ? [] : {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val === undefined) {
      continue;
    } else if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
      cleaned[key] = cleanForFirestore(val);
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

// -------------------------------------------------------------
// Points API
// -------------------------------------------------------------
export const saveAllPointsToFirebase = async (points: MeasurementPoint[]): Promise<void> => {
  // Firestore batches limit is 500 operations per batch
  const chunkSize = 400;
  for (let i = 0; i < points.length; i += chunkSize) {
    const chunk = points.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach(point => {
      const docRef = doc(db, 'points', point.id);
      batch.set(docRef, cleanForFirestore(point), { merge: true });
    });
    await batch.commit();
  }

  // Update sync metadata
  await setDoc(doc(db, 'project_meta', 'sync'), {
    lastSynced: new Date().toISOString(),
    totalPoints: points.length
  }, { merge: true });
};

export const saveSinglePointToFirebase = async (point: MeasurementPoint): Promise<void> => {
  const docRef = doc(db, 'points', point.id);
  await setDoc(docRef, cleanForFirestore(point), { merge: true });
  await setDoc(doc(db, 'project_meta', 'sync'), {
    lastSynced: new Date().toISOString()
  }, { merge: true });
};

export const deletePointFromFirebase = async (pointId: string): Promise<void> => {
  const docRef = doc(db, 'points', pointId);
  await deleteDoc(docRef);
};

export const deleteMultiplePointsFromFirebase = async (pointIds: string[]): Promise<void> => {
  const chunkSize = 400;
  for (let i = 0; i < pointIds.length; i += chunkSize) {
    const chunk = pointIds.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach(id => {
      const docRef = doc(db, 'points', id);
      batch.delete(docRef);
    });
    await batch.commit();
  }
};

export const loadPointsFromFirebase = async (): Promise<MeasurementPoint[] | null> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'points'));
    if (querySnapshot.empty) {
      return null;
    }
    const points: MeasurementPoint[] = [];
    querySnapshot.forEach(docSnap => {
      points.push(docSnap.data() as MeasurementPoint);
    });
    return points;
  } catch (error) {
    console.error('Error reading points from Firebase:', error);
    return null;
  }
};

// -------------------------------------------------------------
// Materials API
// -------------------------------------------------------------
export const saveAllMaterialsToFirebase = async (materials: MaterialItem[]): Promise<void> => {
  const batch = writeBatch(db);
  materials.forEach(mat => {
    const docRef = doc(db, 'materials', mat.id);
    batch.set(docRef, cleanForFirestore(mat), { merge: true });
  });
  await batch.commit();
};

export const loadMaterialsFromFirebase = async (): Promise<MaterialItem[] | null> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'materials'));
    if (querySnapshot.empty) {
      return null;
    }
    const materials: MaterialItem[] = [];
    querySnapshot.forEach(docSnap => {
      materials.push(docSnap.data() as MaterialItem);
    });
    return materials;
  } catch (error) {
    console.error('Error reading materials from Firebase:', error);
    return null;
  }
};

// -------------------------------------------------------------
// Costs API
// -------------------------------------------------------------
export const saveAllCostsToFirebase = async (costs: CostCategory[]): Promise<void> => {
  const batch = writeBatch(db);
  costs.forEach(cost => {
    const docRef = doc(db, 'costs', cost.id);
    batch.set(docRef, cleanForFirestore(cost), { merge: true });
  });
  await batch.commit();
};

export const loadCostsFromFirebase = async (): Promise<CostCategory[] | null> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'costs'));
    if (querySnapshot.empty) {
      return null;
    }
    const costs: CostCategory[] = [];
    querySnapshot.forEach(docSnap => {
      costs.push(docSnap.data() as CostCategory);
    });
    return costs;
  } catch (error) {
    console.error('Error reading costs from Firebase:', error);
    return null;
  }
};

// -------------------------------------------------------------
// Junction Boxes API
// -------------------------------------------------------------
export const saveAllBoxesToFirebase = async (boxes: JunctionBox[]): Promise<void> => {
  const batch = writeBatch(db);
  boxes.forEach(box => {
    const docRef = doc(db, 'junction_boxes', box.id);
    batch.set(docRef, cleanForFirestore(box), { merge: true });
  });
  await batch.commit();
};

export const loadBoxesFromFirebase = async (): Promise<JunctionBox[] | null> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'junction_boxes'));
    if (querySnapshot.empty) {
      return null;
    }
    const boxes: JunctionBox[] = [];
    querySnapshot.forEach(docSnap => {
      boxes.push(docSnap.data() as JunctionBox);
    });
    return boxes;
  } catch (error) {
    console.error('Error reading junction boxes from Firebase:', error);
    return null;
  }
};

// -------------------------------------------------------------
// Real-time synchronization listeners
// -------------------------------------------------------------
export const subscribeToPoints = (callback: (points: MeasurementPoint[]) => void) => {
  return onSnapshot(collection(db, 'points'), (snapshot) => {
    if (!snapshot.empty) {
      const items: MeasurementPoint[] = [];
      snapshot.forEach(docSnap => {
        items.push(docSnap.data() as MeasurementPoint);
      });
      callback(items);
    }
  }, (error) => {
    console.warn('Real-time points sync error:', error);
  });
};
