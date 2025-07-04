export interface UserType {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    proyectoId?: string;
    proyectos?: { [proyectoId: string]: string };
    estado?: string; // ✅ añadido si deseas utilizarlo
}
