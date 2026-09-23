# Domain, HTTPS and analytics setup

Everything needed to get eanalyticsstudio.com live on GitHub Pages with working
statistics. About forty minutes, most of which is waiting for DNS.

---

## 1. Files to add to the repository root

| File | Purpose |
| --- | --- |
| `CNAME` | Tells GitHub Pages which domain serves the site. Must contain the domain and nothing else |
| `robots.txt` | Allows crawling and points to the sitemap |
| `sitemap.xml` | Lists your pages for search engines |
| `404.html` | GitHub Pages serves this automatically for broken links |
| `privacy.html` | Required. The diagnostic consent box links to it |

Commit all five to the root of the repo, not into a subfolder.

---

## 2. DNS records at your registrar

Verified against GitHub's current documentation.

**For the apex domain** (eanalyticsstudio.com), create four A records. Host is
`@`, or blank, depending on your registrar.

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

**Optionally add four AAAA records** for IPv6, same host. GitHub recommends
keeping the A records as well, because IPv6 adoption is still patchy.

```
2606:50c0:8000::153
2606:50c0:8001::153
2606:50c0:8002::153
2606:50c0:8003::153
```

**For the www subdomain**, one CNAME record:

```
Type: CNAME    Host: www    Value: YOUR-USERNAME.github.io
```

### Important

Delete any other A, AAAA, ALIAS or ANAME records on `@` first. Leftover records
from a registrar's parking page are the most common reason the HTTPS certificate
fails to generate.

---

## 3. GitHub settings

1. Repository → **Settings → Pages**
2. Source: **Deploy from a branch**, branch `main`, folder `/ (root)`
3. Custom domain: enter `eanalyticsstudio.com`, save
4. Wait for the DNS check to pass. This can take anywhere from ten minutes to a
   few hours
5. Once it passes, tick **Enforce HTTPS**

The certificate is issued automatically and free. If the tickbox is greyed out,
DNS has not fully propagated yet. Wait rather than changing anything.

### Verify from the terminal

```bash
dig eanalyticsstudio.com +noall +answer -t A
dig www.eanalyticsstudio.com +noall +answer -t CNAME
```

The first should return the four GitHub IPs. The second should return your
github.io address.

---

## 4. Analytics

You asked about Google Analytics, so here is the honest position first.

### The problem with GA4 for this site

GA4 sets cookies. In the UK, PECR requires consent before non-essential cookies
are set, which means a cookie banner, a consent mechanism, and analytics that
only fire after someone accepts. Most small sites skip this and are technically
non-compliant.

That matters more for you than for most people, because your entire positioning
is measurement done properly. A visitor who notices you running cookie tracking
with no banner, on a site about evidence and rigour, has learned something you
would rather they did not.

### Recommended: Cloudflare Web Analytics

Free, no cookies, no banner required, no personal data collected. It gives you
page views, referrers, countries, devices and top pages, which is everything you
actually need to know at this stage.

1. Sign up at cloudflare.com, free tier
2. Analytics & Logs → **Web Analytics** → Add a site
3. Enter `eanalyticsstudio.com`
4. Copy the snippet it gives you
5. Paste it immediately before `</body>` in `index.html`, `diagnostic.html`,
   `privacy.html`, `karol-nedza.html` and `thesis.html`

You do not need to move your DNS to Cloudflare to use this.

The privacy notice as written already describes this arrangement accurately.

### If you still want GA4

Create the property at analytics.google.com, take the Measurement ID
(`G-XXXXXXXXXX`), and add this before `</body>` on each page:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX', { 'anonymize_ip': true });
</script>
```

If you do this, you also need a cookie consent banner that blocks the script
until accepted, and the privacy notice needs rewriting to name Google Analytics,
describe the cookies, and explain the consent mechanism. That is a genuine piece
of work, not a footnote.

**You can run both.** Cloudflare for everyday numbers, GA4 later if you ever need
conversion tracking for paid campaigns. You do not need paid campaigns yet.

---

## 5. Conversion tracking worth having, without any analytics tool

Three things you actually want to know, none of which needs a tracking script:

1. **How many people completed the diagnostic.** Count rows in your Google Sheet.
2. **Which link broke most often.** A pivot on the `weakest` column. After twenty
   or thirty completions this is genuinely interesting, and it is publishable
   content in itself.
3. **Where enquiries came from.** Ask in the contact form, or notice which came
   in during the two days after the conference.

---

## 6. Before the conference

- [ ] Five files committed to the repo root
- [ ] DNS records added, old parking records deleted
- [ ] Custom domain set in GitHub Pages settings
- [ ] Enforce HTTPS ticked
- [ ] `https://eanalyticsstudio.com` loads, and `http://` redirects to it
- [ ] `www.eanalyticsstudio.com` redirects to the apex
- [ ] Analytics snippet on every page
- [ ] Google Sheets endpoint set in `diagnostic.html`, and a test submission lands
- [ ] Privacy link from the consent checkbox resolves
- [ ] A deliberately broken URL shows the 404 page
- [ ] QR code generated from the live `https://` URL and tested on iPhone and Android

---

## 7. One optional extra

Submit the site to Google Search Console (`search.google.com/search-console`),
verify by DNS TXT record, and submit `sitemap.xml`. It costs ten minutes and it
is the only way to see which search terms bring anyone to the site. Not urgent
before the conference, worth doing in October.
