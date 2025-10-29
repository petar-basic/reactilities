import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadScript } from '../scriptLoader';

describe('loadScript', () => {
  beforeEach(() => {
    // Clear any existing scripts
    document.head.innerHTML = '';
  });

  afterEach(() => {
    document.head.innerHTML = '';
  });

  it('should create and append script element to head', () => {
    loadScript({
      scriptProps: {},
      inlineScript: 'console.log("test");'
    });

    const scripts = document.head.getElementsByTagName('script');
    expect(scripts.length).toBe(1);
  });

  it('should set inline script text', () => {
    const scriptText = 'console.log("Hello World");';
    
    loadScript({
      scriptProps: {},
      inlineScript: scriptText
    });

    const script = document.head.getElementsByTagName('script')[0];
    expect(script.text).toBe(scriptText);
  });

  it('should set script attributes from scriptProps', () => {
    loadScript({
      scriptProps: {
        type: 'text/javascript',
        async: true,
        defer: true
      } as any,
      inlineScript: ''
    });

    const script = document.head.getElementsByTagName('script')[0];
    expect(script.getAttribute('type')).toBe('text/javascript');
    expect(script.getAttribute('async')).toBe('true');
    expect(script.getAttribute('defer')).toBe('true');
  });

  it('should set src attribute', () => {
    const src = 'https://example.com/script.js';
    
    loadScript({
      scriptProps: {
        src
      } as any,
      inlineScript: ''
    });

    const script = document.head.getElementsByTagName('script')[0];
    expect(script.getAttribute('src')).toBe(src);
  });

  it('should handle multiple script properties', () => {
    loadScript({
      scriptProps: {
        id: 'test-script',
        'data-test': 'value',
        crossOrigin: 'anonymous'
      } as any,
      inlineScript: 'console.log("test");'
    });

    const script = document.head.getElementsByTagName('script')[0];
    expect(script.getAttribute('id')).toBe('test-script');
    expect(script.getAttribute('data-test')).toBe('value');
    expect(script.getAttribute('crossOrigin')).toBe('anonymous');
  });

  it('should load Google Tag Manager script', () => {
    const GTM_SCRIPT = {
      scriptProps: {},
      inlineScript: `
        (function (w, d, s, l, i) {
          w[l] = w[l] || [];
          w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
        })(window, document, 'script', 'dataLayer', 'GTM-KEY');
      `
    };

    loadScript(GTM_SCRIPT);

    const script = document.head.getElementsByTagName('script')[0];
    expect(script.text).toContain('gtm.start');
    expect(script.text).toContain('GTM-KEY');
  });

  it('should handle empty inline script', () => {
    loadScript({
      scriptProps: {
        src: 'https://example.com/script.js'
      } as any,
      inlineScript: ''
    });

    const script = document.head.getElementsByTagName('script')[0];
    expect(script.text).toBe('');
    expect(script.getAttribute('src')).toBe('https://example.com/script.js');
  });

  it('should handle empty scriptProps', () => {
    const scriptText = 'console.log("test");';
    
    loadScript({
      scriptProps: {},
      inlineScript: scriptText
    });

    const script = document.head.getElementsByTagName('script')[0];
    expect(script.text).toBe(scriptText);
  });

  it('should load multiple scripts', () => {
    loadScript({
      scriptProps: {},
      inlineScript: 'console.log("script1");'
    });

    loadScript({
      scriptProps: {},
      inlineScript: 'console.log("script2");'
    });

    const scripts = document.head.getElementsByTagName('script');
    expect(scripts.length).toBe(2);
    expect(scripts[0].text).toBe('console.log("script1");');
    expect(scripts[1].text).toBe('console.log("script2");');
  });

  it('should handle script with both src and inline code', () => {
    loadScript({
      scriptProps: {
        src: 'https://example.com/script.js'
      } as any,
      inlineScript: 'console.log("inline");'
    });

    const script = document.head.getElementsByTagName('script')[0];
    expect(script.getAttribute('src')).toBe('https://example.com/script.js');
    expect(script.text).toBe('console.log("inline");');
  });
});
