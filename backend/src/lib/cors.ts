// Origem permitida além da lista fixa: qualquer host de rede local (LAN) ou
// túnel ngrok. Assim o app funciona em localhost, pelo IP da rede (celular na
// mesma Wi-Fi) e pelo ngrok, sem precisar listar cada URL.
const PRIVATE_IP =
  /^(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/;
const NGROK = /\.ngrok(-free)?\.(app|io|dev)$/;

export function isLanOrNgrok(origin: string): boolean {
  let host = "";
  try {
    host = new URL(origin).hostname;
  } catch {
    return false;
  }
  return PRIVATE_IP.test(host) || NGROK.test(host);
}
