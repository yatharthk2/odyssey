---
name: manage-ionos-dns
description: Use when DNS records for yatharthk.com need to change at IONOS — adding subdomains, migrating between hosts, updating Vercel records, fixing broken email routing. The domain is registered with IONOS; the dashboard is at https://my.ionos.com/domain-dns-settings/yatharthk.com.
---

# Managing DNS at IONOS for yatharthk.com

The IONOS DNS console is the single source of truth for everything under `yatharthk.com`. Vercel and Hetzner are downstream — they only see traffic that DNS sends them.

## Current DNS layout (as of the last update)

```
A     @                            216.198.79.1                          ← Vercel apex
A     api                          178.104.211.36                        ← Hetzner backend
CNAME www                          5602e39a746295b9.vercel-dns-017.com   ← Vercel www
CNAME _dmarc                       dmarc.ionos.com                       ← email DMARC
CNAME _domainconnect               _domainconnect.ionos.com              ← IONOS managed
MX    @                            mx00.ionos.com                        ← email
MX    @                            mx01.ionos.com                        ← email
TXT   @                            "v=spf1 include:_spf-us.ionos.com ~all"  ← email SPF
CNAME s1-ionos._domainkey          s1.dkim.ionos.com                     ← email DKIM
CNAME s2-ionos._domainkey          s2.dkim.ionos.com                     ← email DKIM
CNAME s42582890._domainkey         s42582890.dkim.ionos.com              ← email DKIM
CNAME autodiscover                 adsredir.ionos.info                   ← email autodiscover
MX    emailreceipt                 mx00.ionos.com                        ← email
MX    emailreceipt                 mx01.ionos.com                        ← email
```

The "Service" column in IONOS labels Mail/DKIM/DMARC records — those are managed by IONOS's email product. **Never delete them unless you're decommissioning email**, otherwise inbound mail to `*@yatharthk.com` stops working.

## How to actually edit records

IONOS console URL: https://my.ionos.com → click `yatharthk.com` → **DNS** tab (rightmost, after Nameserver).

Per row:
- ✏️ pencil = edit value
- 🗑️ trash = delete
- 🚫 disable = soft-disable (keeps the record but it doesn't resolve; useful if you might want it back)

The **Add record** button at the top creates a new one. There's also a search box and a "Reset filter" link — if you don't see records you expect, you probably have a stale filter (e.g. you searched for "api" earlier).

## Conflicts to know about

- **A and CNAME on the same name conflict.** DNS doesn't allow both. If you add a CNAME for `www` while an A record for `www` exists, IONOS pops a warning and offers to disable the conflicting record. Accept it — that's the correct behavior. (We hit this when migrating www from Hetzner to Vercel.)
- **AAAA + A both work, but lead to split routing.** If apex has both an A pointing at Vercel and an AAAA pointing at the old server, IPv6-preferring clients hit the old server. Always update or delete AAAA when migrating apex.

## Common operations

### Pointing a subdomain at a new server

```
Add record →
  Type:   A
  Host:   <subdomain>           (just the label, not the FQDN — IONOS appends .yatharthk.com)
  Value:  <new IP>
  TTL:    5 min during testing (raise to 1h after stable)
```

If you also have a www-style CNAME for that subdomain, see the conflict note above.

### Migrating apex from one host to another

1. Edit the existing `A @` record — change Value to the new IP. Don't add a second A — that round-robins traffic 50/50 between hosts.
2. If there's a corresponding `AAAA @` (IPv6) record and the new host doesn't have IPv6 (or you don't have its v6 address), **delete** the AAAA. Leaving it points half the world at the old box.
3. Lower TTL to 5 min beforehand if you can — old TTL determines how long broken state persists if you mess up.

### Adding the Vercel www CNAME

```
Add record →
  Type:   CNAME
  Host:   www
  Value:  <copy exactly from Vercel's Domains page — it's a unique per-project hostname like 5602e39a746295b9.vercel-dns-017.com>
  TTL:    5 min
```

The Vercel CNAME value is **not** the generic `cname.vercel-dns.com` — newer Vercel projects get a project-specific subdomain under `vercel-dns-XXX.com`. Always copy the exact value from the Vercel Domains page.

### Removing email (if ever decommissioning IONOS mail)

Delete all the records labeled "Mail" / "DMARC" / "Domain Connect" in the Service column:
- `MX @`, `MX emailreceipt` (×2 each)
- `TXT @ "v=spf1 ..."`
- `CNAME _dmarc`, `_domainconnect`, `autodiscover`
- `CNAME *._domainkey` (DKIM, ×3)

⚠️ Once these are gone, *@yatharthk.com email stops working. Don't do this casually.

## Verifying changes propagated

IONOS usually pushes changes within 30 seconds. From your laptop:

```bash
dig +short A yatharthk.com @1.1.1.1
dig +short A www.yatharthk.com @1.1.1.1
dig +short AAAA yatharthk.com @1.1.1.1     # should return nothing if AAAA deleted
dig +short CNAME www.yatharthk.com @1.1.1.1
dig +short A api.yatharthk.com @1.1.1.1
```

Use `@1.1.1.1` (Cloudflare's public resolver) instead of your ISP's resolver — your local resolver may cache the old value for the full original TTL.

If `dig` returns the old value:
1. Verify IONOS actually saved — refresh the DNS page in the console
2. Wait — propagation to public resolvers can take a couple minutes even after IONOS pushes
3. Try a different public resolver (`@8.8.8.8`, `@9.9.9.9`) to rule out a specific resolver being stuck

## Vercel + IONOS interaction

After a DNS change that affects Vercel domains, you must also poke Vercel to re-check:

- Vercel project → **Domains** tab
- Find the row showing "Invalid Configuration" (red badge)
- Click **Refresh**

Vercel re-runs its validation and auto-fetches Let's Encrypt cert if everything checks out. Usually green within 30-60 seconds.

## What I (Claude) cannot do here

- Log into IONOS for you (your credentials)
- Pay for new domains (your card)
- Approve domain transfers (email verification flows that come to your inbox)

I CAN guide you through every IONOS click, verify with `dig` after, and tell Vercel to recheck. The DNS console interaction is always yours.
