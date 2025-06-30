// src/types/user.d.ts

export interface UserType {
  id: string;             // UID de Auth0 o Firebase
  name?: string;          // Nombre completo del usuario (ahora opcional)
  email?: string;         // Correo del usuario (ahora opcional)
  avatarUrl?: string;     // URL de la foto de perfil
  role?: 'administrador' | 'marcador' | 'talador' | 'operador' | 'auxiliar' | string; // ahora opcional
  proyectoId?: string;    // permanece opcional
}
