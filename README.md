# Land Pro Design website — review build, not public

This is a review-only build of the Land Pro Design site mockup. It is not the public site, and a noindex meta tag is in place so it should not be indexed.

Animation libraries (GSAP 3.12.5 and Lenis 1.1.18) are vendored in `js/vendor/` so the page does not depend on a CDN for scripts. Google Fonts remain loaded from Google. Do not add a CNAME; this build is for GitHub Pages testing only.

To preview locally:

```bash
python3 -m http.server 8099
```

Then open http://127.0.0.1:8099
