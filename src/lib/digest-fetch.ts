import { createHash, randomBytes } from "crypto";

function md5(value: string) {
  return createHash("md5").update(value).digest("hex");
}

function parseChallenge(header: string) {
  const get = (name: string) => {
    const re = new RegExp(`${name}=(?:"([^"]+)"|([^,\\s]+))`, "i");
    const m = re.exec(header);
    return m?.[1] || m?.[2] || "";
  };
  return {
    realm: get("realm"),
    nonce: get("nonce"),
    qop: get("qop").split(",")[0].trim(),
    opaque: get("opaque"),
    algorithm: get("algorithm") || "MD5",
  };
}

type DigestOptions = RequestInit & {
  username: string;
  password: string;
};

/** HTTP Digest auth (kamery Hikvision/Dahua zwykle tego wymagają) */
export async function digestFetch(url: string, options: DigestOptions) {
  const { username, password, ...init } = options;
  const method = (init.method || "GET").toUpperCase();

  const probe = await fetch(url, {
    ...init,
    headers: init.headers,
    redirect: "manual",
  });

  if (probe.status !== 401) return probe;
  await probe.arrayBuffer().catch(() => undefined);

  const challenge = probe.headers.get("www-authenticate") || "";
  if (!/digest/i.test(challenge)) return probe;

  const { realm, nonce, qop, opaque, algorithm } = parseChallenge(challenge);
  const parsed = new URL(url);
  const uri = parsed.pathname + parsed.search;
  const nc = "00000001";
  const cnonce = randomBytes(8).toString("hex");

  const ha1 = md5(`${username}:${realm}:${password}`);
  const ha2 = md5(`${method}:${uri}`);
  const response = qop
    ? md5(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`)
    : md5(`${ha1}:${nonce}:${ha2}`);

  const parts = [
    `Digest username="${username}"`,
    `realm="${realm}"`,
    `nonce="${nonce}"`,
    `uri="${uri}"`,
    `response="${response}"`,
  ];
  if (algorithm) parts.push(`algorithm=${algorithm}`);
  if (qop) {
    parts.push(`qop=${qop}`);
    parts.push(`nc=${nc}`);
    parts.push(`cnonce="${cnonce}"`);
  }
  if (opaque) parts.push(`opaque="${opaque}"`);

  const headers = new Headers(init.headers);
  headers.set("Authorization", parts.join(", "));

  return fetch(url, { ...init, headers });
}
