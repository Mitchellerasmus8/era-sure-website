# POPIA processing facts — what is verified, and what is not

Evidence gathered for the v0.10.0 privacy notice. Recorded here so nobody
re-derives it, and so the difference between **verified**, **unverified** and **not
publicly knowable** stays visible — the notice gates its sentences on exactly that
difference.

**Verified 2026-08-10.** Re-check before launch; provider terms change.

---

## Verified

### Information Regulator of South Africa

Taken from the Regulator's own
[contact page](https://inforegulator.org.za/contact-us/), not from memory. Needed so the
right to complain is actionable rather than theoretical (POPIA §18(1)(h)).

| Detail | Value |
| --- | --- |
| Physical address | Woodmead North Office Park, 54 Maxwell Drive, Woodmead, Johannesburg, 2191 |
| General enquiries | `enquiries@inforegulator.org.za` |
| **POPIA complaints** | `POPIAComplaints@inforegulator.org.za` |
| PAIA complaints | `PAIAComplaints@inforegulator.org.za` |
| Telephone | 010 023 5200 |
| Toll free | 0800 017 160 |

**Correction, same day.** An earlier version of this memo stated the Regulator publishes no
separate complaints address. That was wrong, and it was wrong for an avoidable reason: only
the site's **home page** had been checked, which lists the general enquiries address alone.
The `/contact-us/` page publishes three addresses with distinct purposes. The notice now
uses the POPIA complaints address for complaints and labels the general one as general.

The lesson generalises past this page: "verified from the official source" has to mean the
page that actually carries the fact, not the first page of the right site. A right-looking
address on the wrong desk is indistinguishable from a correct one until someone's complaint
goes unanswered.

The PAIA complaints address is recorded here because the pre-launch checklist carries an
open question about whether the business needs a PAIA manual.

### Netlify Forms — storage and deletion

From [docs.netlify.com/manage/forms/submissions](https://docs.netlify.com/manage/forms/submissions/):

- Submissions are stored in Netlify's user database and reachable through the Forms tab,
  email notification, CSV export and the API.
- Individual submissions can be deleted; deleting a form deletes its submissions.
- **After a form is deleted, uploaded files remain available by direct URL for 24 hours**
  because of how form caching works.

That last point is the one with teeth. Any deletion routine that stops at "delete the
submission" leaves the attached bill of quantities retrievable for another day, and an
attachment is the item most likely to carry personal information beyond the form fields.

### Netlify — cross-border transfer

From [netlify.com/privacy](https://www.netlify.com/privacy/): data "may be collected,
transferred to and stored by Netlify outside of the country of collection", including the
**United States** and countries without an EU adequacy decision.

---

## Not established

### What metadata accompanies a submission

Netlify's privacy statement **explicitly excludes** data processed as a processor on behalf
of customers — which is precisely what a form submission is. So the public documentation
does not say whether an IP address, user agent or similar is stored against each
submission.

**Resolving this needs dashboard access**: submit a test enquiry and inspect what is
recorded against it in the Netlify Forms tab. Until then the notice describes automatically
collected data in general terms and asserts no specific field.

### The POPIA §72 basis for either operator

Netlify cites **EU Standard Contractual Clauses** and the **EU-U.S. Data Privacy
Framework**. These are EU, UK and Swiss instruments. **They are not a POPIA §72 finding**,
and treating them as one would be a plausible-looking error of exactly the kind ARCHI §7
warns about: §72 requires the recipient to be subject to a law, binding corporate rules or
a binding agreement affording substantially similar protection.

So the notice may state **where** data goes — that is verified — but not that the
destination affords adequate protection. Establishing the §72 basis is a contractual
question for the client and their legal advisor, not a web lookup, and it is a launch
blocker.

### The email operator

Notification emails come to rest in mailboxes hosted by **GoDaddy** — established from the
domain's live MX records (`smtp.secureserver.net`, `mailstore1.secureserver.net`) and its
SPF record (`include:secureserver.net`), checked 2026-08-10. The provider is therefore
known; what is not known is GoDaddy's storage location for these mailboxes or any §72
basis, and, separately, **which people receive the notifications** — Mitchell, Wesley or
both is still an open client decision.

That decision is not cosmetic here: it determines whose mailboxes hold personal data and
therefore what the deletion routine has to cover.
