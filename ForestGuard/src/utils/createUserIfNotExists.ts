import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { UserType } from '../types/user';

export const createUserIfNotExists = async (user: UserType) => {
  const db = getFirestore();
  const userRef = doc(db, 'usuarios', user.id);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      avatarUrl: user.avatarUrl || '',
      estado: 'activo',
      proyectos: {},      // ✅ inicializa correctamente
      createdAt: new Date(),
    });
    console.log('✅ Usuario creado en Firestore');
  } else {
    console.log('ℹ️ Usuario ya existe en Firestore');
  }
};
