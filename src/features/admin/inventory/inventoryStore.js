/**
 * Data store for Equipment Inventory and Loans.
 * Communicates directly with Cloud Firestore and Firebase Storage through the compat SDK.
 *
 * Requirements:
 * - Real-time subscriptions with live updates.
 * - Client-side ID generation before photo upload (doc(collection(...)).id).
 * - Photo upload FIRST to assets/{id}/<timestamp>.jpg, then write doc.
 * - On doc-write failure, delete orphan photo.
 * - Replacing photo: upload new file, update doc, then delete old file (paths never overwritten).
 * - Check-out & Check-in: atomic runTransaction updating loan doc and asset quantityAvailable/status/currentLoan.
 */

import { compressAssetPhoto } from './imageCompress.js';

export const ASSET_CATEGORIES = [
  'electronics',
  'robotics',
  'lab',
  'maker_tools',
  'computers',
  'av',
  'sports',
  'art',
  'furniture',
  'books',
  'other'
];

export const ASSET_STATUSES = ['available', 'in_use', 'needs_repair', 'retired'];
export const ASSET_CONDITIONS = ['new', 'good', 'fair', 'poor'];

/**
 * Returns the global Firebase instances.
 */
function getFirebase() {
  if (typeof window === 'undefined' || !window.firebase) {
    throw new Error('Firebase SDK is not available.');
  }
  const db = window.firebase.firestore();
  const storage = window.firebase.storage();
  const auth = window.firebase.auth();
  return { db, storage, auth, FieldValue: window.firebase.firestore.FieldValue };
}

/**
 * Subscribes to the assets collection.
 *
 * @param {function(Array<object>): void} onData
 * @param {function(Error): void} onError
 * @returns {function(): void} Unsubscribe function
 */
export function subscribeAssets(onData, onError) {
  const { db } = getFirebase();
  return db.collection('assets').onSnapshot(
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onData(items);
    },
    (err) => {
      console.error('[Inventory] Error subscribing to assets:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Fetches a single asset document by ID.
 *
 * @param {string} assetId
 * @returns {Promise<object>}
 */
export async function getAsset(assetId) {
  const { db } = getFirebase();
  const snap = await db.collection('assets').doc(assetId).get();
  if (!snap.exists) throw new Error(`Asset not found: ${assetId}`);
  return { id: snap.id, ...snap.data() };
}

/**
 * Subscribes to the loan history of a specific asset.
 *
 * @param {string} assetId
 * @param {function(Array<object>): void} onData
 * @param {function(Error): void} onError
 * @returns {function(): void}
 */
export function subscribeLoans(assetId, onData, onError) {
  const { db } = getFirebase();
  return db
    .collection('assets')
    .doc(assetId)
    .collection('loans')
    .orderBy('outAt', 'desc')
    .onSnapshot(
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        onData(items);
      },
      (err) => {
        console.error(`[Inventory] Error fetching loans for ${assetId}:`, err);
        if (onError) onError(err);
      }
    );
}

/**
 * Uploads a photo to Storage at assets/{assetId}/{timestamp}.jpg.
 *
 * @param {string} assetId
 * @param {File|Blob} file
 * @param {function(number): void} [onProgress]
 * @returns {Promise<{ path: string, url: string, contentType: string, width: number, height: number, bytes: number }>}
 */
export async function uploadAssetPhoto(assetId, file, onProgress) {
  const { storage } = getFirebase();
  const compressed = await compressAssetPhoto(file);

  const filename = `${Date.now()}.jpg`;
  const path = `assets/${assetId}/${filename}`;
  const fileRef = storage.ref(path);

  const uploadTask = fileRef.put(compressed.blob, {
    contentType: compressed.contentType
  });

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(pct);
        }
      },
      (err) => {
        reject(err);
      },
      async () => {
        try {
          const url = await fileRef.getDownloadURL();
          resolve({
            path,
            url,
            contentType: compressed.contentType,
            width: compressed.width,
            height: compressed.height,
            bytes: compressed.bytes
          });
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}

/**
 * Deletes a photo file from Storage by path.
 *
 * @param {string} path
 * @returns {Promise<void>}
 */
export async function deleteAssetPhoto(path) {
  if (!path) return;
  try {
    const { storage } = getFirebase();
    await storage.ref(path).delete();
  } catch (err) {
    console.warn('[Inventory] Failed to delete photo at path:', path, err);
  }
}

/**
 * Creates a new asset document.
 * Follows the pattern: generate ID -> upload photo -> write Firestore doc -> clean up photo on error.
 *
 * @param {object} assetInput
 * @param {File} [photoFile]
 * @param {function(number): void} [onProgress]
 * @returns {Promise<string>} Created asset ID
 */
export async function createAsset(assetInput, photoFile = null, onProgress = null) {
  const { db, auth, FieldValue } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('You must be signed in as an administrator to create an asset.');

  const assetRef = db.collection('assets').doc();
  const assetId = assetRef.id;

  let photoMeta = null;
  if (photoFile) {
    photoMeta = await uploadAssetPhoto(assetId, photoFile, onProgress);
  }

  const quantity = Math.max(1, parseInt(assetInput.quantity, 10) || 1);
  const quantityAvailable = assetInput.quantityAvailable !== undefined
    ? Math.max(0, parseInt(assetInput.quantityAvailable, 10))
    : quantity;

  const docData = {
    name: String(assetInput.name || '').trim().slice(0, 120),
    category: assetInput.category || 'other',
    quantity,
    quantityAvailable,
    assetTag: assetInput.assetTag ? String(assetInput.assetTag).trim().slice(0, 40) : null,
    serial: assetInput.serial ? String(assetInput.serial).trim().slice(0, 80) : null,
    location: assetInput.location ? String(assetInput.location).trim().slice(0, 80) : 'General Storage',
    siteId: assetInput.siteId ? String(assetInput.siteId).trim().slice(0, 50) : null,
    condition: assetInput.condition || 'good',
    status: assetInput.status || 'available',
    purchaseDate: assetInput.purchaseDate && /^\d{4}-\d{2}-\d{2}$/.test(assetInput.purchaseDate)
      ? assetInput.purchaseDate
      : null,
    purchaseValue: assetInput.purchaseValue !== undefined && assetInput.purchaseValue !== '' && !isNaN(Number(assetInput.purchaseValue))
      ? Math.max(0, Number(assetInput.purchaseValue))
      : null,
    currency: assetInput.currency ? String(assetInput.currency).trim().toUpperCase().slice(0, 10) : 'USD',
    notes: assetInput.notes ? String(assetInput.notes).trim().slice(0, 500) : '',
    photo: photoMeta,
    currentLoan: null,
    createdBy: uid,
    updatedBy: uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  };

  try {
    await assetRef.set(docData);
    return assetId;
  } catch (err) {
    if (photoMeta?.path) {
      await deleteAssetPhoto(photoMeta.path);
    }
    throw err;
  }
}

/**
 * Updates an existing asset.
 * If a new photo is provided, uploads it first, writes the doc, and removes the old photo.
 *
 * @param {string} assetId
 * @param {object} existingAsset
 * @param {object} changes
 * @param {File} [newPhotoFile]
 * @param {function(number): void} [onProgress]
 * @returns {Promise<void>}
 */
export async function updateAsset(assetId, existingAsset, changes, newPhotoFile = null, onProgress = null) {
  const { db, auth, FieldValue } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('You must be signed in as an administrator.');

  let newPhotoMeta = null;
  if (newPhotoFile) {
    newPhotoMeta = await uploadAssetPhoto(assetId, newPhotoFile, onProgress);
  }

  const quantity = changes.quantity !== undefined
    ? Math.max(1, parseInt(changes.quantity, 10) || 1)
    : existingAsset.quantity;

  const quantityAvailable = changes.quantityAvailable !== undefined
    ? Math.max(0, Math.min(quantity, parseInt(changes.quantityAvailable, 10) || 0))
    : Math.min(quantity, existingAsset.quantityAvailable);

  const updatedData = {
    ...existingAsset,
    ...changes,
    name: changes.name !== undefined ? String(changes.name).trim().slice(0, 120) : existingAsset.name,
    category: changes.category || existingAsset.category,
    quantity,
    quantityAvailable,
    assetTag: changes.assetTag !== undefined ? (changes.assetTag ? String(changes.assetTag).trim().slice(0, 40) : null) : existingAsset.assetTag,
    serial: changes.serial !== undefined ? (changes.serial ? String(changes.serial).trim().slice(0, 80) : null) : existingAsset.serial,
    location: changes.location !== undefined ? String(changes.location).trim().slice(0, 80) : existingAsset.location,
    condition: changes.condition || existingAsset.condition,
    status: changes.status || existingAsset.status,
    purchaseDate: changes.purchaseDate !== undefined ? (changes.purchaseDate ? String(changes.purchaseDate).trim() : null) : existingAsset.purchaseDate,
    purchaseValue: changes.purchaseValue !== undefined && changes.purchaseValue !== '' && !isNaN(Number(changes.purchaseValue))
      ? Math.max(0, Number(changes.purchaseValue))
      : existingAsset.purchaseValue,
    currency: changes.currency !== undefined ? (changes.currency ? String(changes.currency).trim().toUpperCase().slice(0, 10) : null) : existingAsset.currency,
    notes: changes.notes !== undefined ? (changes.notes ? String(changes.notes).trim().slice(0, 500) : '') : existingAsset.notes,
    photo: newPhotoMeta || existingAsset.photo || null,
    updatedBy: uid,
    updatedAt: FieldValue.serverTimestamp()
  };

  delete updatedData.id;

  try {
    await db.collection('assets').doc(assetId).update(updatedData);
    if (newPhotoMeta && existingAsset.photo?.path && existingAsset.photo.path !== newPhotoMeta.path) {
      await deleteAssetPhoto(existingAsset.photo.path);
    }
  } catch (err) {
    if (newPhotoMeta?.path) {
      await deleteAssetPhoto(newPhotoMeta.path);
    }
    throw err;
  }
}

/**
 * Soft-retires an asset by setting status: 'retired'.
 *
 * @param {string} assetId
 * @returns {Promise<void>}
 */
export async function retireAsset(assetId) {
  const { db, auth, FieldValue } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Signed in admin required.');

  await db.collection('assets').doc(assetId).update({
    status: 'retired',
    updatedBy: uid,
    updatedAt: FieldValue.serverTimestamp()
  });
}

/**
 * Checks out equipment in an atomic transaction.
 * Creates an append-only loan record and updates the parent asset's available quantity and status.
 *
 * @param {string} assetId
 * @param {object} loanDetails
 * @returns {Promise<string>} Created loanId
 */
export async function checkOutAsset(assetId, { borrowerType, borrowerId, borrowerName, quantity = 1, dueDate = null, note = '' }) {
  const { db, auth, FieldValue } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Administrator sign-in required to issue a loan.');

  const loanQty = Math.max(1, parseInt(quantity, 10) || 1);
  const assetRef = db.collection('assets').doc(assetId);
  const loanRef = assetRef.collection('loans').doc();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(assetRef);
    if (!snap.exists) throw new Error('Asset does not exist.');

    const asset = snap.data();
    if (asset.status === 'retired') throw new Error('Cannot loan a retired asset.');
    if (asset.quantityAvailable < loanQty) {
      throw new Error(`Insufficient quantity available (Requested: ${loanQty}, Available: ${asset.quantityAvailable}).`);
    }

    const nextAvailable = asset.quantityAvailable - loanQty;
    const nextStatus = nextAvailable === 0 ? 'in_use' : asset.status;

    const loanDoc = {
      borrowerType,
      borrowerId,
      borrowerName,
      quantity: loanQty,
      outAt: FieldValue.serverTimestamp(),
      outBy: uid,
      dueDate: dueDate || null,
      note: note ? String(note).trim().slice(0, 500) : null,
      inAt: null,
      inBy: null,
      returnCondition: null
    };

    tx.set(loanRef, loanDoc);

    tx.update(assetRef, {
      quantityAvailable: nextAvailable,
      status: nextStatus,
      currentLoan: {
        loanId: loanRef.id,
        borrowerType,
        borrowerId,
        borrowerName,
        dueDate: dueDate || null
      },
      updatedBy: uid,
      updatedAt: FieldValue.serverTimestamp()
    });
  });

  return loanRef.id;
}

/**
 * Checks in loaned equipment in an atomic transaction.
 * Closes the loan with return condition, restores asset available quantity, and adjusts status.
 *
 * @param {string} assetId
 * @param {string} loanId
 * @param {object} returnDetails
 * @returns {Promise<void>}
 */
export async function checkInAsset(assetId, loanId, { returnCondition = 'good', note = '', markNeedsRepair = false }) {
  const { db, auth, FieldValue } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Administrator sign-in required to check in equipment.');

  const assetRef = db.collection('assets').doc(assetId);
  const loanRef = assetRef.collection('loans').doc(loanId);

  await db.runTransaction(async (tx) => {
    const [assetSnap, loanSnap] = await Promise.all([tx.get(assetRef), tx.get(loanRef)]);
    if (!assetSnap.exists) throw new Error('Asset does not exist.');
    if (!loanSnap.exists) throw new Error('Loan record not found.');

    const loan = loanSnap.data();
    if (loan.inAt) throw new Error('This loan has already been closed.');

    const asset = assetSnap.data();
    const nextAvailable = Math.min(asset.quantity, asset.quantityAvailable + loan.quantity);

    let nextStatus = asset.status;
    if (markNeedsRepair || returnCondition === 'poor') {
      nextStatus = 'needs_repair';
    } else if (asset.status === 'in_use' && nextAvailable > 0) {
      nextStatus = 'available';
    }

    const isCurrentLoan = asset.currentLoan?.loanId === loanId;

    tx.update(loanRef, {
      inAt: FieldValue.serverTimestamp(),
      inBy: uid,
      returnCondition,
      note: note ? String(note).trim().slice(0, 500) : loan.note || null
    });

    const assetUpdates = {
      quantityAvailable: nextAvailable,
      status: nextStatus,
      updatedBy: uid,
      updatedAt: FieldValue.serverTimestamp()
    };

    if (isCurrentLoan) {
      assetUpdates.currentLoan = null;
    }

    tx.update(assetRef, assetUpdates);
  });
}

/**
 * Fetches coaches and active classes for populating borrower selection.
 *
 * @returns {Promise<{ coaches: Array<object>, classes: Array<object> }>}
 */
export async function fetchBorrowerRoster() {
  const { db } = getFirebase();
  const [coachesSnap, classesSnap] = await Promise.all([
    db.collection('users').where('role', 'in', ['teacher', 'coach']).get().catch(() => ({ docs: [] })),
    db.collection('classes').get().catch(() => ({ docs: [] }))
  ]);

  const coaches = coachesSnap.docs.map((d) => ({
    uid: d.id,
    name: d.data().displayName || d.data().email || 'Coach',
    email: d.data().email || ''
  }));

  const classes = classesSnap.docs.map((d) => ({
    id: d.id,
    name: d.data().name || d.id
  }));

  return { coaches, classes };
}
