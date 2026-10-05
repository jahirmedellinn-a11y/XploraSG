import app from './app';
import { validateAuthConfiguration } from './auth/verifyAccessToken';

const PORT = process.env.PORT || 3000;
const authMode = validateAuthConfiguration();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} with ${authMode} authentication.`);
});
