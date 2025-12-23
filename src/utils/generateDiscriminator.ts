import { User } from "../models/User";

/*
 * Generates a unique discriminator for a given username.
 *
 * @param {string} username - The username for which to generate a discriminator.
 * @returns {Promise<string>} A promise that resolves to the generated discriminator.
 */
export async function generateDiscriminator(username: string): Promise<string> {
  const MAX_ATTEMPTS = 10;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const exists = await User.exists({ username, discriminator: code });
    if (!exists) return code;
  }

  throw new Error("No se pudo generar un discriminator único");
}
