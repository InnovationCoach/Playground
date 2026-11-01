import { Router } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { requireClaims } from '../middleware/auth.js';

const router = Router();

router.get('/me', requireClaims, async (req, res) => {
  // Use profile data already retrieved in requireClaims to prevent redundant roundtrips
  let userData = req.callerUserData;
  if (!userData || Object.keys(userData).length === 0) {
    try {
      const db = getFirestore();
      const userDocSnap = await db.collection('users').doc(req.caller.uid).get();
      userData = userDocSnap.exists ? userDocSnap.data() : {};
    } catch {
      userData = {};
    }
  }

  return res.json({
    uid: req.caller.uid,
    publicId: userData.publicId || req.caller.publicId || null,
    role: req.caller.role,
    orgId: req.caller.orgId,
    schoolIds: userData.schoolIds || req.caller.schoolIds || [],
    classIds: userData.classIds || req.caller.classIds || [],
    status: userData.status || 'active',
    displayName: userData.displayName || req.caller.displayName,
    email: userData.email || req.caller.email || null,
    locale: userData.locale || 'en'
  });
});

export default router;
