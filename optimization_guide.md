# Website Optimization Guide

This document outlines additional optimization steps for your website beyond what the `optimize.py` script provides.

## Performance Optimizations

### Lazy Loading
Consider adding lazy loading for images and iframes:

```html
<img src="image.jpg" loading="lazy" alt="Description">
<iframe src="embed.html" loading="lazy"></iframe>
```

### Preloading Critical Assets
Add preload directives for critical resources:

```html
<link rel="preload" href="critical.css" as="style">
<link rel="preload" href="important-font.woff2" as="font" type="font/woff2" crossorigin>
```

### Responsive Images
Use srcset for responsive image loading:

```html
<img srcset="small.jpg 500w, medium.jpg 1000w, large.jpg 1500w"
     sizes="(max-width: 600px) 500px, (max-width: 1200px) 1000px, 1500px"
     src="fallback.jpg" alt="Description">
```

## SEO Optimizations

### Meta Tags
Ensure all pages have proper meta tags:

```html
<meta name="description" content="Your description here">
<meta name="keywords" content="relevant, keywords, here">
<meta name="author" content="Shaukat Aziz">
```

### Semantic HTML
Use semantic HTML elements like `<article>`, `<section>`, `<nav>`, etc.

### Sitemap
Create a sitemap.xml file for better search engine indexing.

## Accessibility Improvements

### Alt Text
Ensure all images have meaningful alt text.

### ARIA Attributes
Add ARIA attributes where appropriate:

```html
<button aria-label="Close dialog" aria-pressed="false">×</button>
```

### Color Contrast
Verify sufficient color contrast between text and background.

## Running Additional Tools

### Lighthouse
Run Google Lighthouse in Chrome DevTools for detailed performance analysis.

### PageSpeed Insights
Use [Google PageSpeed Insights](https://developers.google.com/speed/pagespeed/insights/) for more optimization suggestions.

### WebPageTest
[WebPageTest](https://www.webpagetest.org/) provides detailed performance metrics.
