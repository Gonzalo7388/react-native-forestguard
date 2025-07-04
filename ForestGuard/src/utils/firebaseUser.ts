import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { app } from "../config/firebase";

export const ensureUserInFirestore = async (user: {
  id: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
}) => {
  const db = getFirestore(app);
  const userRef = doc(db, "usuarios", user.id);

  try {
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      console.log("👀 ID que se usará para guardar usuario en Firestore:", user.id);

      await setDoc(userRef, {
        id: user.id,
        name: user.name || "",
        email: user.email || "",
        avatarUrl: user.avatarUrl || "",
        estado: 'activo',
        proyectos: {},     // ✅ inicializa correctamente
        createdAt: new Date(),
      });
      console.log("✅ Usuario creado en Firestore correctamente");
    } else {
      console.log("ℹ️ Usuario ya existe en Firestore");
    }
  } catch (error) {
    console.error("❌ Error asegurando usuario en Firestore:", error);
  }
};
