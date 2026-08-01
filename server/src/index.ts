import dns from "dns";
import { env } from "./env";
import { createApp } from "./app";

// Some environments have broken IPv6 egress; TMDB resolves both A and AAAA
// records, and Node's default DNS order can pick the unreachable IPv6 address.
dns.setDefaultResultOrder("ipv4first");

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`Server listening on http://localhost:${env.PORT}`);
});
