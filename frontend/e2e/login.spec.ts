import { expect, test, type Page } from '@playwright/test';
import { mockApi } from './fixtures';

// Las pruebas corren en "modo desarrollo" (sin variables de Supabase): el login usa /api/auth/login.
const fakeToken = (sub: string) => `x.${Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.y`;

const mockAuth = async (page: Page, rol: 'administrador' | 'turista') => {
  const user = { id: 'u-1', email: 'herme@test.mx', nombre: 'Herme', rol };
  await page.route('**/api/auth/login', (route) => route.fulfill({ json: { token: fakeToken('u-1'), user } }));
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: { user } }));
  await page.route('**/api/admin/**', (route) => route.fulfill({ json: { data: [] } }));
  await page.route('**/api/favoritos**', (route) => route.fulfill({ json: { data: [] } }));
};

test.describe('Inicio de sesión', () => {
  test('una administradora entra directo a su panel', async ({ page }) => {
    await mockApi(page);
    await mockAuth(page, 'administrador');
    await page.goto('/login');
    await page.getByLabel('Correo electrónico').fill('herme@test.mx');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { name: /Panel de XploraSG/i }).first()).toBeVisible();
  });

  test('tras iniciar sesión vuelve a la página protegida que se pidió', async ({ page }) => {
    await mockApi(page);
    await mockAuth(page, 'turista');
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel('Correo electrónico').fill('herme@test.mx');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('una turista con sesión no puede entrar al panel de administración', async ({ page }) => {
    await mockApi(page);
    await mockAuth(page, 'turista');
    await page.goto('/login');
    await page.getByLabel('Correo electrónico').fill('herme@test.mx');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/unauthorized$/);
  });

  test('si el backend está apagado muestra un mensaje claro', async ({ page }) => {
    await mockApi(page);
    await page.route('**/api/auth/login', (route) => route.abort('connectionrefused'));
    await page.goto('/login');
    await page.getByLabel('Correo electrónico').fill('herme@test.mx');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page.getByRole('alert')).toContainText('No hay conexión con el servidor de XploraSG');
  });

  test('un enlace de recuperación vencido explica qué hacer', async ({ page }) => {
    await mockApi(page);
    await page.goto('/restablecer-contrasena#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid');
    await expect(page.getByRole('heading', { name: 'Enlace no válido' })).toBeVisible();
    await expect(page.getByText(/expiró o ya se usó/)).toBeVisible();
  });
});
