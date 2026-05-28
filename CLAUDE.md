# Dolphin Backoffice — Guía de desarrollo

Panel de administración React 19 + Vite. Autenticación vía Firebase, backend propio con JWT.

## Stack

| Capa | Librería |
|------|----------|
| UI framework | React 19 + Vite 8 |
| Lenguaje | TypeScript 6 |
| Estilos | Tailwind CSS 4 + shadcn (estilo `radix-rhea`) |
| Routing | React Router 7 (browser router) |
| Server state | TanStack Query 5 |
| Tablas | TanStack Table 8 |
| Client state | Zustand 5 |
| Forms | react-hook-form + zod |
| Auth | Firebase SDK (email/password) |
| HTTP | Axios (instancia en `src/lib/axios.ts`) |
| Notificaciones | Sonner |

## Estructura de carpetas

```
src/
├── components/
│   ├── auth/          # AuthProvider, ProtectedRoute
│   ├── ui/            # Componentes shadcn (NO editar manualmente)
│   ├── AppSidebar.tsx
│   ├── ErrorBoundary.tsx
│   └── ThemeToggle.tsx
├── hooks/
│   └── use-menu.ts    # Filtra el menú por permisos del usuario
├── layouts/
│   ├── AppLayout.tsx  # Layout autenticado (sidebar + header)
│   └── AuthLayout.tsx # Layout público (centrado)
├── lib/
│   ├── api.types.ts   # Todos los DTOs y tipos de respuesta
│   ├── axios.ts       # Instancia HTTP configurada
│   ├── firebase.ts    # Inicialización de Firebase
│   ├── menu.ts        # Definición del menú lateral
│   ├── permissions.ts # Constantes de permisos
│   ├── query-client.ts
│   └── utils.ts
├── pages/             # Una carpeta por sección (página + dialogs + columns)
├── stores/
│   └── auth.store.ts  # Estado global de autenticación (Zustand)
└── app.router.tsx     # Definición de rutas
```

## Flujo de autenticación

1. `LoginPage` llama `signInWithEmailAndPassword` (Firebase SDK)
2. `AuthProvider` escucha `onAuthStateChanged` → llama `GET /api/v1/auth/me` con el Bearer token
3. El perfil `MeResponseDto` se guarda en Zustand (`auth.store.ts`)
4. `ProtectedRoute` lee el store: redirige a `/login` si no hay usuario, o a `/dashboard` si falta el permiso requerido

## Cliente HTTP (`src/lib/axios.ts`)

La instancia `api` tiene dos interceptores configurados:

- **Request**: inyecta automáticamente `Authorization: Bearer <token>` en cada petición. El token se refresca solo si está expirado.
- **Response**: desenvuelve el nivel Axios (`response.data`) para retornar el body JSON directamente. En 401 hace logout automático.

```ts
// Los tipos reflejan el body JSON tal como llega del backend
api.get<ApiPaginatedResponse<UserResponseDto>>('/api/v1/users', { params })
api.get<ApiResponse<RoleResponseDto[]>>('/api/v1/roles')
api.post<ApiResponse<UserResponseDto>>('/api/v1/users', body)
api.patch<ApiResponse<UserResponseDto>>(`/api/v1/users/${id}/role`, body)
api.delete(`/api/v1/users/${id}`)
```

Todos los endpoints del backend devuelven:
- Recurso único: `{ data: T }`  → tipo `ApiResponse<T>`
- Lista paginada: `{ data: T[], meta: PaginationMeta }` → tipo `ApiPaginatedResponse<T>`
- Error: `{ statusCode, errorCode, message, ... }` → tipo `ErrorResponse`

## Sistema de permisos

Los permisos viven en `src/lib/permissions.ts` como constantes tipadas:

```ts
Permissions.DASHBOARD.VIEW
Permissions.USERS.CREATE | READ | UPDATE | DELETE
Permissions.ROLES.CREATE | READ | UPDATE | DELETE
Permissions.PERMISSIONS.CREATE | READ | UPDATE | DELETE
Permissions.PROFILE.READ
```

El tipo `Permission` es la unión de todos los valores posibles — TypeScript valida que solo uses permisos existentes.

Para verificar permisos en un componente:

```ts
const can = useAuthStore((s) => s.can);
if (can(Permissions.USERS.CREATE)) { ... }
```

## Menú lateral (`src/lib/menu.ts`)

El menú se filtra automáticamente por los permisos del usuario en `useVisibleMenuItems()`.

Hay dos tipos de items:
- `MenuLeaf` — enlace directo con `path` y `permission`
- `MenuGroup` — grupo colapsable sin ruta propia, con `children: MenuLeaf[]`

Para discriminar entre ambos usa siempre el type guard exportado:

```ts
import { isMenuGroup } from '@/lib/menu';
isMenuGroup(item) // → true si es MenuGroup
```

> **Nota:** `MenuGroup` NO tiene campo `permission` propio. La visibilidad del grupo depende de si alguno de sus hijos es visible para el usuario.

---

## Cómo agregar una nueva característica

### 1. Definir el permiso (si aplica)

En `src/lib/permissions.ts`, añadir la constante en el namespace correspondiente:

```ts
export const Permissions = {
  // ...
  REPORTS: {
    READ: 'reports.read',
    EXPORT: 'reports.export',
  },
} as const;
```

### 2. Crear los tipos de la API

En `src/lib/api.types.ts`, añadir los DTOs que devuelve el backend:

```ts
export type ReportResponseDto = {
  id: string;
  name: string;
  createdAt: string;
};
```

### 3. Crear la página

Crear una carpeta en `src/pages/<nombre>/`. Cada página puede incluir:
- `<Nombre>Page.tsx` — componente principal
- `columns.tsx` — definición de columnas si usa tabla
- `Create<Nombre>Dialog.tsx`, `Edit<Nombre>Dialog.tsx` — dialogs de acción

Patrón base de una página con tabla y paginación:

```tsx
export function ReportsPage() {
  const can = useAuthStore((s) => s.can);
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['reports', page],
    queryFn: () =>
      api.get<ApiPaginatedResponse<ReportResponseDto>>('/api/v1/reports', {
        params: { page, limit: 20 },
      }),
  });

  // ...
}
```

Patrón base de una mutación con invalidación de caché:

```tsx
const mutation = useMutation({
  mutationFn: (data: CreateReportDto) =>
    api.post<ApiResponse<ReportResponseDto>>('/api/v1/reports', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['reports'] });
    toast.success('Report created.');
    onOpenChange(false);
  },
});
```

### 4. Registrar la ruta

En `src/app.router.tsx`, añadir dentro del bloque `AppLayout`:

```tsx
{
  path: '/reports',
  element: (
    <ProtectedRoute permission={Permissions.REPORTS.READ}>
      <ReportsPage />
    </ProtectedRoute>
  ),
},
```

> `ProtectedRoute` sin `permission` solo verifica que el usuario esté autenticado. Con `permission`, redirige a `/dashboard` si el usuario no tiene ese permiso.

### 5. Añadir al menú lateral

En `src/lib/menu.ts`, añadir un `MenuLeaf` o agruparlo en un `MenuGroup`:

```ts
// Item simple
{
  id: 'reports',
  label: 'Reports',
  icon: BarChart,
  path: '/reports',
  permission: Permissions.REPORTS.READ,
},

// Como hijo de un grupo existente
{
  id: 'reports-group',
  label: 'Analytics',
  icon: BarChart,
  children: [
    { id: 'reports', label: 'Reports', icon: FileText, path: '/reports', permission: Permissions.REPORTS.READ },
  ],
},
```

---

## Convenciones

### TypeScript

- **No usar `baseUrl` en tsconfig** — está deprecado en TS 6 y provoca error. Usar solo `paths: { "@/*": ["./src/*"] }`.
- Importar componentes shadcn desde `'radix-ui'` (no desde `@radix-ui/react-*` — este proyecto usa el paquete unificado `radix-rhea`).
- Para filtrar/mapear `MenuItem[]` (discriminated union), usar `isMenuGroup()` como type guard. Evitar `flatMap` que pierde el tipo.

### Componentes UI (shadcn)

- Los componentes de `src/components/ui/` son generados por shadcn — **no editarlos manualmente**. Para extender, crear un wrapper.
- Usar `Skeleton` para estados de carga en tablas.
- Usar `toast.success()` / `toast.error()` de `sonner` para feedback de mutaciones.
- Checkbox con estado indeterminado: usar `checked={'indeterminate'}` (no `data-state`).

### Formularios

- Siempre usar `react-hook-form` + `zodResolver` + schema zod.
- Deshabilitar el botón submit con `disabled={mutation.isPending}`.
- Mostrar error de servidor con `{mutation.isError && <p className="text-destructive text-sm">...</p>}`.

### Queries y caché

- `queryKey` como array: `['recurso']` para listas, `['recurso', id]` para items individuales, `['recurso', page]` para listas paginadas.
- Usar `select` para transformar la respuesta dentro de `useQuery` (ej: extraer `.data` del envelope).
- Compartir la misma `queryKey` entre componentes que necesiten el mismo dato — React Query deduplicará las peticiones.
- En logout, `queryClient.clear()` ya está en `AppSidebar` — no es necesario hacerlo manualmente.

### Seguridad

- Toda ruta nueva dentro de `AppLayout` debe tener `<ProtectedRoute>` con `permission` si requiere acceso restringido.
- Usar `can(Permissions.X.Y)` para mostrar/ocultar botones de acción en tablas y formularios.
- Nunca mostrar tokens o URLs sensibles en texto plano en la UI — usar solo botón "Copy".
- Variables de entorno nuevas: añadirlas a `.env.example` con valor vacío, y documentar su propósito.
