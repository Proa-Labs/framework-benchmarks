// Retry observation failures without restarting a healthy benchmark worker.
export const transientTransportError = (error) =>
  /http2: client connection lost|connection reset|unexpected EOF|TLS handshake timeout|i\/o timeout|Unable to connect to the server/i.test(
    String(error),
  );

export async function retryObservation(
  observe,
  {
    attempts = 5,
    delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  } = {},
) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await observe();
    } catch (error) {
      if (!transientTransportError(error) || attempt + 1 >= attempts)
        throw error;
      await delay(250 * 2 ** attempt);
    }
  }
}
