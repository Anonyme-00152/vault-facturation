export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Échoue immédiatement si la configuration est incomplète.
    const { env } = await import("./env");
    env();
  }
}
