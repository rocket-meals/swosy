# Accessibility Report

> Generated: 2026-07-10T05:56:39.610Z | axe-core 4.12.1 | Rules: wcag2a, wcag2aa, wcag21a, wcag21aa, best-practice | Viewport: 1280x900
> Base URL: http://localhost:8081

## Summary

Total violations (affected elements): **81** — 🟥 Critical: 0, 🟧 Serious: 10, 🟨 Moderate: 71, 🟦 Minor: 0

| Screen | 🟥 Critical | 🟧 Serious | 🟨 Moderate | 🟦 Minor | Total | Passes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| price-group | 0 | 1 | 3 | 0 | 4 | 13 |
| faq-food | 0 | 1 | 3 | 0 | 4 | 28 |
| faq-living | 0 | 1 | 3 | 0 | 4 | 28 |
| leaflet-map | 0 | 1 | 3 | 0 | 4 | 13 |
| login | 0 | 0 | 3 | 0 | 3 | 24 |
| housing | 0 | 1 | 2 | 0 | 3 | 24 |
| support-ticket | 0 | 1 | 2 | 0 | 3 | 26 |
| foodoffers | 0 | 0 | 2 | 0 | 2 | 27 |
| eating-habits | 0 | 0 | 2 | 0 | 2 | 17 |
| account-balance | 0 | 0 | 2 | 0 | 2 | 17 |
| campus | 0 | 0 | 2 | 0 | 2 | 21 |
| news | 0 | 0 | 2 | 0 | 2 | 17 |
| course-timetable | 0 | 0 | 2 | 0 | 2 | 17 |
| settings | 0 | 0 | 2 | 0 | 2 | 29 |
| data-access | 0 | 0 | 2 | 0 | 2 | 17 |
| support-FAQ | 0 | 0 | 2 | 0 | 2 | 17 |
| licenseInformation | 0 | 0 | 2 | 0 | 2 | 17 |
| management | 0 | 0 | 2 | 0 | 2 | 17 |
| events | 0 | 0 | 2 | 0 | 2 | 17 |
| experimentell | 0 | 0 | 2 | 0 | 2 | 17 |
| feedback-support | 0 | 0 | 2 | 0 | 2 | 22 |
| forms | 0 | 0 | 2 | 0 | 2 | 17 |
| form-categories | 0 | 0 | 2 | 0 | 2 | 29 |
| form-submissions | 0 | 0 | 2 | 0 | 2 | 21 |
| form-submission | 0 | 0 | 2 | 0 | 2 | 17 |
| delete-user | 0 | 1 | 1 | 0 | 2 | 11 |
| notification | 0 | 0 | 2 | 0 | 2 | 17 |
| vertical-image-scroll | 0 | 0 | 2 | 0 | 2 | 17 |
| wikis | 0 | 1 | 1 | 0 | 2 | 21 |
| bigScreen | 0 | 1 | 1 | 0 | 2 | 14 |
| rss-feed | 0 | 1 | 1 | 0 | 2 | 21 |
| statistics | 0 | 0 | 1 | 0 | 1 | 16 |
| labels | 0 | 0 | 1 | 0 | 1 | 14 |
| foodPlanDay | 0 | 0 | 1 | 0 | 1 | 25 |
| foodPlanList | 0 | 0 | 1 | 0 | 1 | 22 |
| foodPlanWeek | 0 | 0 | 1 | 0 | 1 | 25 |
| list-day-screen | 0 | 0 | 1 | 0 | 1 | 14 |
| list-week-screen | 0 | 0 | 1 | 0 | 1 | 13 |
| rss-feed-config | 0 | 0 | 1 | 0 | 1 | 27 |

## Most common rule violations

| Rule | Impact | Elements | Screens | Help |
| --- | --- | ---: | ---: | --- |
| `region` | 🟨 moderate | 65 | 39 | [All page content should be contained by landmarks](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer) |
| `document-title` | 🟧 serious | 6 | 6 | [Documents must have <title> element to aid in navigation](https://dequeuniversity.com/rules/axe/4.12/document-title?application=axe-puppeteer) |
| `landmark-one-main` | 🟨 moderate | 3 | 3 | [Document should have one main landmark](https://dequeuniversity.com/rules/axe/4.12/landmark-one-main?application=axe-puppeteer) |
| `page-has-heading-one` | 🟨 moderate | 3 | 3 | [Page should contain a level-one heading](https://dequeuniversity.com/rules/axe/4.12/page-has-heading-one?application=axe-puppeteer) |
| `aria-progressbar-name` | 🟧 serious | 2 | 2 | [ARIA progressbar nodes must have an accessible name](https://dequeuniversity.com/rules/axe/4.12/aria-progressbar-name?application=axe-puppeteer) |
| `color-contrast` | 🟧 serious | 1 | 1 | [Elements must meet minimum color contrast ratio thresholds](https://dequeuniversity.com/rules/axe/4.12/color-contrast?application=axe-puppeteer) |
| `scrollable-region-focusable` | 🟧 serious | 1 | 1 | [Scrollable region must have keyboard access](https://dequeuniversity.com/rules/axe/4.12/scrollable-region-focusable?application=axe-puppeteer) |

## Details per screen

### price-group

URL: `http://localhost:8081/price-group?kioskMode=true`

- 🟧 **document-title** (serious) — 1 element(s)
  - Documents must have <title> element to aid in navigation ([docs](https://dequeuniversity.com/rules/axe/4.12/document-title?application=axe-puppeteer))
  - `html`

- 🟨 **landmark-one-main** (moderate) — 1 element(s)
  - Document should have one main landmark ([docs](https://dequeuniversity.com/rules/axe/4.12/landmark-one-main?application=axe-puppeteer))
  - `html`

- 🟨 **page-has-heading-one** (moderate) — 1 element(s)
  - Page should contain a level-one heading ([docs](https://dequeuniversity.com/rules/axe/4.12/page-has-heading-one?application=axe-puppeteer))
  - `html`

- 🟨 **region** (moderate) — 1 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `#root`

### faq-food

URL: `http://localhost:8081/faq-food?kioskMode=true`

- 🟧 **document-title** (serious) — 1 element(s)
  - Documents must have <title> element to aid in navigation ([docs](https://dequeuniversity.com/rules/axe/4.12/document-title?application=axe-puppeteer))
  - `html`

- 🟨 **region** (moderate) — 3 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-maxWidth-dnmrzs.r-bottom-1p0dtai.r-top-ipm5af`
  - `.r-pointerEvents-12vffkv.r-justifyContent-1777fci.css-view-g5y9jx`
  - `.r-pointerEvents-105ug2t.r-overflow-1udh08x.r-left-1d2f490 > .r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx`

### faq-living

URL: `http://localhost:8081/faq-living?kioskMode=true`

- 🟧 **document-title** (serious) — 1 element(s)
  - Documents must have <title> element to aid in navigation ([docs](https://dequeuniversity.com/rules/axe/4.12/document-title?application=axe-puppeteer))
  - `html`

- 🟨 **region** (moderate) — 3 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-maxWidth-dnmrzs.r-bottom-1p0dtai.r-top-ipm5af`
  - `.r-pointerEvents-12vffkv.r-justifyContent-1777fci.css-view-g5y9jx`
  - `.r-pointerEvents-105ug2t.r-overflow-1udh08x.r-left-1d2f490 > .r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx`

### leaflet-map

URL: `http://localhost:8081/leaflet-map?kioskMode=true`

- 🟧 **document-title** (serious) — 1 element(s)
  - Documents must have <title> element to aid in navigation ([docs](https://dequeuniversity.com/rules/axe/4.12/document-title?application=axe-puppeteer))
  - `html`

- 🟨 **landmark-one-main** (moderate) — 1 element(s)
  - Document should have one main landmark ([docs](https://dequeuniversity.com/rules/axe/4.12/landmark-one-main?application=axe-puppeteer))
  - `html`

- 🟨 **page-has-heading-one** (moderate) — 1 element(s)
  - Page should contain a level-one heading ([docs](https://dequeuniversity.com/rules/axe/4.12/page-has-heading-one?application=axe-puppeteer))
  - `html`

- 🟨 **region** (moderate) — 1 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `#root`

### login

URL: `http://localhost:8081/login?kioskMode=true`

- 🟨 **landmark-one-main** (moderate) — 1 element(s)
  - Document should have one main landmark ([docs](https://dequeuniversity.com/rules/axe/4.12/landmark-one-main?application=axe-puppeteer))
  - `html`

- 🟨 **page-has-heading-one** (moderate) — 1 element(s)
  - Page should contain a level-one heading ([docs](https://dequeuniversity.com/rules/axe/4.12/page-has-heading-one?application=axe-puppeteer))
  - `html`

- 🟨 **region** (moderate) — 1 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `#root`

### housing

URL: `http://localhost:8081/housing?kioskMode=true`

- 🟧 **color-contrast** (serious) — 1 element(s)
  - Elements must meet minimum color contrast ratio thresholds ([docs](https://dequeuniversity.com/rules/axe/4.12/color-contrast?application=axe-puppeteer))
  - `.r-textAlign-q4m81j`

- 🟨 **region** (moderate) — 2 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-maxWidth-dnmrzs`
  - `.r-flexDirection-18u37iz.r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx`

### support-ticket

URL: `http://localhost:8081/support-ticket?kioskMode=true`

- 🟧 **aria-progressbar-name** (serious) — 1 element(s)
  - ARIA progressbar nodes must have an accessible name ([docs](https://dequeuniversity.com/rules/axe/4.12/aria-progressbar-name?application=axe-puppeteer))
  - `div[role="progressbar"]`

- 🟨 **region** (moderate) — 2 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-maxWidth-dnmrzs`
  - `.r-flexDirection-18u37iz.r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx`

### foodoffers

URL: `http://localhost:8081/foodoffers?kioskMode=true`

- 🟨 **region** (moderate) — 2 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-maxWidth-dnmrzs.r-bottom-1p0dtai.r-top-ipm5af`
  - `.r-flex-13awgt0.r-flexDirection-18u37iz.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx`

### eating-habits

URL: `http://localhost:8081/eating-habits?kioskMode=true`

- 🟨 **region** (moderate) — 2 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-maxWidth-dnmrzs`
  - `.r-flex-13awgt0.r-flexDirection-18u37iz.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx`

### account-balance

URL: `http://localhost:8081/account-balance?kioskMode=true`

- 🟨 **region** (moderate) — 2 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-maxWidth-dnmrzs`
  - `.r-flexDirection-18u37iz.r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx`

### campus

URL: `http://localhost:8081/campus?kioskMode=true`

- 🟨 **region** (moderate) — 2 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-maxWidth-dnmrzs`
  - `.r-flex-13awgt0.r-flexDirection-18u37iz.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx`

### news

URL: `http://localhost:8081/news?kioskMode=true`

- 🟨 **region** (moderate) — 2 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-maxWidth-dnmrzs`
  - `.r-flexDirection-18u37iz.r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx`

### course-timetable

URL: `http://localhost:8081/course-timetable?kioskMode=true`

- 🟨 **region** (moderate) — 2 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-maxWidth-dnmrzs`
  - `.r-flexDirection-18u37iz.r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx`

### settings

URL: `http://localhost:8081/settings?kioskMode=true`

- 🟨 **region** (moderate) — 2 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-maxWidth-dnmrzs`
  - `.r-flex-13awgt0.r-flexDirection-18u37iz.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx`

### data-access

URL: `http://localhost:8081/data-access?kioskMode=true`

- 🟨 **region** (moderate) — 2 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-maxWidth-dnmrzs`
  - `.r-flex-13awgt0.r-flexDirection-18u37iz.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx`

### support-FAQ

URL: `http://localhost:8081/support-FAQ?kioskMode=true`

- 🟨 **region** (moderate) — 2 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-maxWidth-dnmrzs`
  - `.r-flex-13awgt0.r-flexDirection-18u37iz.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx`

### licenseInformation

URL: `http://localhost:8081/licenseInformation?kioskMode=true`

- 🟨 **region** (moderate) — 2 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-maxWidth-dnmrzs`
  - `.r-flex-13awgt0.r-flexDirection-18u37iz.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx`

### management

URL: `http://localhost:8081/management?kioskMode=true`

- 🟨 **region** (moderate) — 2 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-maxWidth-dnmrzs`
  - `.r-flex-13awgt0.r-flexDirection-18u37iz.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx`

### events

URL: `http://localhost:8081/events?kioskMode=true`

- 🟨 **region** (moderate) — 2 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-maxWidth-dnmrzs`
  - `.r-flexDirection-18u37iz.r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx`

### experimentell

URL: `http://localhost:8081/experimentell?kioskMode=true`

- 🟨 **region** (moderate) — 2 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-maxWidth-dnmrzs`
  - `.r-flex-13awgt0.r-flexDirection-18u37iz.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx`

### feedback-support

URL: `http://localhost:8081/feedback-support?kioskMode=true`

- 🟨 **region** (moderate) — 2 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-maxWidth-dnmrzs`
  - `.r-flex-13awgt0.r-flexDirection-18u37iz.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx`

### forms

URL: `http://localhost:8081/forms?kioskMode=true`

- 🟨 **region** (moderate) — 2 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-maxWidth-dnmrzs`
  - `.r-flexDirection-18u37iz.r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx`

### form-categories

URL: `http://localhost:8081/form-categories?kioskMode=true`

- 🟨 **region** (moderate) — 2 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-maxWidth-dnmrzs`
  - `.r-flexDirection-18u37iz.r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx`

### form-submissions

URL: `http://localhost:8081/form-submissions?kioskMode=true`

- 🟨 **region** (moderate) — 2 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-maxWidth-dnmrzs`
  - `.r-flexDirection-18u37iz.r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx`

### form-submission

URL: `http://localhost:8081/form-submission?kioskMode=true`

- 🟨 **region** (moderate) — 2 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-maxWidth-dnmrzs`
  - `.r-flexDirection-18u37iz.r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx`

### delete-user

URL: `http://localhost:8081/delete-user?kioskMode=true`

- 🟧 **document-title** (serious) — 1 element(s)
  - Documents must have <title> element to aid in navigation ([docs](https://dequeuniversity.com/rules/axe/4.12/document-title?application=axe-puppeteer))
  - `html`

- 🟨 **region** (moderate) — 1 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-bottom-1p0dtai`

### notification

URL: `http://localhost:8081/notification?kioskMode=true`

- 🟨 **region** (moderate) — 2 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-maxWidth-dnmrzs`
  - `.r-flexDirection-18u37iz.r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx`

### vertical-image-scroll

URL: `http://localhost:8081/vertical-image-scroll?kioskMode=true`

- 🟨 **region** (moderate) — 2 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-maxWidth-dnmrzs`
  - `.r-flexDirection-18u37iz.r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx`

### wikis

URL: `http://localhost:8081/wikis?kioskMode=true`

- 🟧 **aria-progressbar-name** (serious) — 1 element(s)
  - ARIA progressbar nodes must have an accessible name ([docs](https://dequeuniversity.com/rules/axe/4.12/aria-progressbar-name?application=axe-puppeteer))
  - `.r-justifyContent-1777fci`

- 🟨 **region** (moderate) — 1 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-bottom-1p0dtai`

### bigScreen

URL: `http://localhost:8081/bigScreen?kioskMode=true`

- 🟧 **scrollable-region-focusable** (serious) — 1 element(s)
  - Scrollable region must have keyboard access ([docs](https://dequeuniversity.com/rules/axe/4.12/scrollable-region-focusable?application=axe-puppeteer))
  - `.r-WebkitOverflowScrolling-150rngu`

- 🟨 **region** (moderate) — 1 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-flex-13awgt0.css-view-g5y9jx > .r-bottom-1p0dtai.r-left-1d2f490.r-position-u8s1d`

### rss-feed

URL: `http://localhost:8081/rss-feed?kioskMode=true`

- 🟧 **document-title** (serious) — 1 element(s)
  - Documents must have <title> element to aid in navigation ([docs](https://dequeuniversity.com/rules/axe/4.12/document-title?application=axe-puppeteer))
  - `html`

- 🟨 **region** (moderate) — 1 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-flex-13awgt0.css-view-g5y9jx > .r-bottom-1p0dtai.r-left-1d2f490.r-position-u8s1d`

### statistics

URL: `http://localhost:8081/statistics?kioskMode=true`

- 🟨 **region** (moderate) — 1 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-bottom-1p0dtai`

### labels

URL: `http://localhost:8081/labels?kioskMode=true`

- 🟨 **region** (moderate) — 1 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-flex-13awgt0.r-bottom-1p0dtai.r-top-ipm5af`

### foodPlanDay

URL: `http://localhost:8081/foodPlanDay?kioskMode=true`

- 🟨 **region** (moderate) — 1 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-flex-13awgt0.css-view-g5y9jx > .r-bottom-1p0dtai.r-left-1d2f490.r-position-u8s1d`

### foodPlanList

URL: `http://localhost:8081/foodPlanList?kioskMode=true`

- 🟨 **region** (moderate) — 1 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-bottom-1p0dtai`

### foodPlanWeek

URL: `http://localhost:8081/foodPlanWeek?kioskMode=true`

- 🟨 **region** (moderate) — 1 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-flex-13awgt0.css-view-g5y9jx > .r-bottom-1p0dtai.r-left-1d2f490.r-position-u8s1d`

### list-day-screen

URL: `http://localhost:8081/list-day-screen?kioskMode=true`

- 🟨 **region** (moderate) — 1 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-flex-13awgt0.r-bottom-1p0dtai.r-left-1d2f490`

### list-week-screen

URL: `http://localhost:8081/list-week-screen?kioskMode=true`

- 🟨 **region** (moderate) — 1 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `#root > .r-flex-13awgt0.css-view-g5y9jx > .css-view-g5y9jx > .css-view-g5y9jx > .css-view-g5y9jx > .r-flex-13awgt0.css-view-g5y9jx > .r-bottom-1p0dtai.r-left-1d2f490.r-position-u8s1d`

### rss-feed-config

URL: `http://localhost:8081/rss-feed-config?kioskMode=true`

- 🟨 **region** (moderate) — 1 element(s)
  - All page content should be contained by landmarks ([docs](https://dequeuniversity.com/rules/axe/4.12/region?application=axe-puppeteer))
  - `.r-flex-13awgt0.css-view-g5y9jx > .r-bottom-1p0dtai.r-left-1d2f490.r-position-u8s1d`
