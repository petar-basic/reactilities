# loadScript

Utility function for dynamically loading external scripts into the document. Supports both external script URLs and inline script code.

## Usage

```tsx
import { loadScript } from 'reactilities';

// Load external script
loadScript({
  scriptProps: {
    src: 'https://cdn.example.com/library.js',
    async: true
  },
  inlineScript: ''
});

// Load inline script
loadScript({
  scriptProps: {},
  inlineScript: 'console.log("Hello from inline script!");'
});
```

## API

### Parameters

Object containing:
- **`scriptProps`** (`object`) - Attributes to set on the script element (src, async, defer, etc.)
- **`inlineScript`** (`string`) - Inline JavaScript code to execute

### Returns

`void`

## Examples

### Load External Library

```tsx
useEffect(() => {
  loadScript({
    scriptProps: {
      src: 'https://cdn.jsdelivr.net/npm/chart.js',
      async: true
    },
    inlineScript: ''
  });
}, []);
```

### Google Analytics

```tsx
function initAnalytics() {
  loadScript({
    scriptProps: {
      src: 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID',
      async: true
    },
    inlineScript: ''
  });
  
  loadScript({
    scriptProps: {},
    inlineScript: `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'GA_MEASUREMENT_ID');
    `
  });
}
```

### Google Tag Manager

```tsx
const GTM_SCRIPT = {
  scriptProps: {},
  inlineScript: `
    (function(w,d,s,l,i){
      w[l]=w[l]||[];
      w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
      var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
      j.async=true;
      j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
      f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-XXXXXX');
  `
};

loadScript(GTM_SCRIPT);
```

### Load Multiple Scripts

```tsx
function loadAnalyticsScripts() {
  // Load Google Analytics
  loadScript({
    scriptProps: {
      src: 'https://www.google-analytics.com/analytics.js',
      async: true
    },
    inlineScript: ''
  });
  
  // Load Facebook Pixel
  loadScript({
    scriptProps: {},
    inlineScript: `
      !function(f,b,e,v,n,t,s){
        if(f.fbq)return;
        n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;
        n.push=n;
        n.loaded=!0;
        n.version='2.0';
        n.queue=[];
      }(window, document,'script');
      fbq('init', 'YOUR_PIXEL_ID');
      fbq('track', 'PageView');
    `
  });
}
```

### Stripe Integration

```tsx
function loadStripe() {
  loadScript({
    scriptProps: {
      src: 'https://js.stripe.com/v3/',
      async: true,
      onload: () => {
        const stripe = window.Stripe('pk_test_...');
        // Initialize Stripe
      }
    },
    inlineScript: ''
  });
}
```

### reCAPTCHA

```tsx
function loadRecaptcha() {
  loadScript({
    scriptProps: {
      src: 'https://www.google.com/recaptcha/api.js',
      async: true,
      defer: true
    },
    inlineScript: ''
  });
}
```

### Custom Configuration

```tsx
loadScript({
  scriptProps: {
    src: 'https://cdn.example.com/sdk.js',
    async: true,
    defer: true,
    crossOrigin: 'anonymous',
    integrity: 'sha384-...',
    'data-config': 'production'
  },
  inlineScript: ''
});
```

## Features

- ✅ Load external scripts
- ✅ Execute inline scripts
- ✅ Set script attributes
- ✅ Support for async/defer
- ✅ TypeScript support
- ✅ Simple API

## Notes

- Script is appended to `document.head`
- Supports all standard script attributes
- Can combine external src with inline code
- Inline scripts execute immediately
- Use for third-party integrations (analytics, ads, etc.)
- Scripts are not automatically removed
- No duplicate detection - will create new script each time called

## Common Use Cases

- **Analytics** - Google Analytics, Mixpanel, Segment
- **Advertising** - Google Ads, Facebook Pixel
- **Payment** - Stripe, PayPal
- **Social** - Facebook SDK, Twitter widgets
- **Maps** - Google Maps, Mapbox
- **Chat** - Intercom, Drift, Zendesk
- **CDN Libraries** - jQuery, Chart.js, D3.js
